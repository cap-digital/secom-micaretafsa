import "server-only";
import { envCap, envGoogle, logServidor } from "./env";
import { buscarProjetoCap, type EstrategiaCap, type ProjetoCap } from "./cap-manager";
import { buscarGoogleEstrategia, type DadosGoogle } from "./google-ads";
import {
  ajustarAoPi,
  aplicarTetoPi,
  calcularPacing,
  converterEstrategia,
  custoPorResultado,
  deCentavos,
  distribuirProporcional,
  intervaloDatas,
  paraCentavos,
  pctMeta,
  rodarChecklist,
  statusRitmo,
  type EstrategiaParaChecklist,
} from "./calculos";
import { CRIATIVOS_LOCAIS, ROTULO_PLATAFORMA, SEGMENTACAO_POR_ESTRATEGIA } from "@/config/campanha";
import type { CriativoPayload, DashboardPayload, EstrategiaPayload, ResultadoDashboard } from "./tipos";

/**
 * Orquestra cap-manager + Google Ads, aplica as regras do manual e devolve
 * apenas o payload BRUTO para a tela. Todo cálculo é refeito a cada leitura;
 * só os dados crus das APIs têm cache (máx. 5 min).
 */

// Último payload que passou no checklist (memória do processo).
let ultimoValido: DashboardPayload | null = null;

/** Data de hoje no fuso da Bahia (UTC−3), em ISO. */
export function hojeBahia(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bahia" }).format(agora);
}

const minData = (a: string, b: string) => (a < b ? a : b);

function nomeProjeto(nome: string): string {
  // "MICARETA DE FEIRA 2026 - 16/11/2026 até 22/11/2026" → "MICARETA DE FEIRA 2026"
  return nome.replace(/\s*[-–]\s*\d{2}\/\d{2}\/\d{4}.*$/, "").trim() || nome;
}

interface EstrategiaCalculada {
  cap: EstrategiaCap;
  valorBrutoCent: number;
  investidoCent: number;
  diasCent: Map<string, number>;
  impressoesDia: Map<string, number>;
  fechado: boolean;
  aguardandoDados: boolean;
  google: DadosGoogle | null;
}

function fallback(motivo: string): ResultadoDashboard {
  if (ultimoValido) {
    return { estado: "ok", payload: ultimoValido, aviso: "Exibindo o último dado validado." };
  }
  return {
    estado: "vazio",
    titulo: "Dados em atualização",
    mensagem: motivo,
  };
}

export async function carregarDashboard(): Promise<ResultadoDashboard> {
  const cap = envCap();
  if (!cap) {
    return {
      estado: "vazio",
      titulo: "Dashboard em configuração",
      mensagem: "A conexão com os dados do projeto ainda não foi configurada.",
    };
  }

  // 1. cap-manager
  let projeto: ProjetoCap;
  let capBuscadoEm: string;
  try {
    const r = await buscarProjetoCap(cap.url, cap.token);
    projeto = r.dados;
    capBuscadoEm = r.buscadoEm;
  } catch (e) {
    logServidor("error", `falha no cap-manager: ${(e as Error).message}`);
    return fallback("Não foi possível ler os dados do projeto agora. Tentaremos novamente em instantes.");
  }

  const hoje = hojeBahia();
  const p = projeto.projeto;
  const encerrado = hoje > p.data_fim || p.campanha_finalizada;
  const ativas = projeto.estrategias.filter((e) => e.status !== "cancelada");
  const piCent = projeto.tipo === "td" && projeto.pi ? paraCentavos(projeto.pi.valor_bruto) : null;

  // 2. Ajuste ao PI (5.3)
  const ajuste = ajustarAoPi(
    ativas.map((e) => paraCentavos(e.valor_bruto)),
    piCent,
  );
  if (ajuste.ajustado) {
    logServidor("warn", `ALERTA INTERNO: estratégias não batem com o PI (${projeto.pi?.identificador}) — ajuste proporcional aplicado`);
  }

  // 3. Google + conversão por estratégia
  const google = envGoogle();
  const calculadas: EstrategiaCalculada[] = [];
  const instantes: string[] = [capBuscadoEm];

  for (let i = 0; i < ativas.length; i++) {
    const e = ativas[i];
    const valorBrutoCent = ajuste.valoresCent[i];
    const fechado = e.status === "finalizada" || encerrado;
    const fimConsulta = minData(hoje, p.data_fim);
    const datas = e.data_inicio <= fimConsulta ? intervaloDatas(e.data_inicio, fimConsulta) : [];

    let dados: DadosGoogle | null = null;
    const consultaGoogle = !e.falta_dados_conta_anuncio && e.plataforma === "google" && !!google && datas.length > 0;
    if (e.falta_dados_conta_anuncio) {
      logServidor("warn", `ALERTA INTERNO: estratégia ${e.id} (${e.estrategia}) sem id_conta/campaign_id`);
    }
    if (consultaGoogle) {
      try {
        dados = await buscarGoogleEstrategia(
          e.id_conta!,
          [e.campaign_id!, ...e.campanhas_adicionais],
          datas[0],
          datas[datas.length - 1],
        );
        instantes.push(dados.buscadoEm);
      } catch (err) {
        logServidor("error", `falha no Google Ads (estratégia ${e.id}): ${(err as Error).message}`);
        if (ultimoValido) return fallback("");
        dados = null;
      }
    }

    const gastoPorData = new Map(dados?.dias.map((d) => [d.data, d.custo]) ?? []);
    const aguardandoDados = !dados;
    const conv = converterEstrategia({
      valorBrutoCent,
      orcamentoPlataforma: e.orcamento_plataforma,
      gastosDia: datas.map((d) => gastoPorData.get(d) ?? 0),
      fechado,
    });
    const diasCent = new Map<string, number>();
    datas.forEach((d, idx) => diasCent.set(d, conv.diasCent[idx]));

    calculadas.push({
      cap: e,
      valorBrutoCent,
      // aguardando dados e não fechada: nada investido conhecido
      investidoCent: aguardandoDados && !fechado ? 0 : conv.investidoCent,
      diasCent: aguardandoDados && !fechado ? new Map(datas.map((d) => [d, 0])) : diasCent,
      impressoesDia: new Map(dados?.dias.map((d) => [d.data, d.impressoes]) ?? []),
      fechado,
      aguardandoDados,
      google: dados,
    });
  }

  // 4. Projeto (5.3)
  const contratadoCent = piCent ?? calculadas.reduce((a, c) => a + c.valorBrutoCent, 0);
  const investidoCent = aplicarTetoPi(
    calculadas.reduce((a, c) => a + c.investidoCent, 0),
    piCent,
  );

  // KPI principal: CPM se existir; meta = soma das metas do MESMO KPI (5.5)
  const kpis = [...new Set(calculadas.map((c) => c.cap.kpi))];
  const kpiPrincipal = kpis.includes("CPM") ? "CPM" : (kpis[0] ?? "CPM");
  const doKpi = calculadas.filter((c) => c.cap.kpi === kpiPrincipal);
  const meta = doKpi.reduce((a, c) => a + c.cap.entrega_contratada, 0);
  const comDados = calculadas.filter((c) => c.google);
  const doKpiComDados = doKpi.filter((c) => c.google);
  const somaG = (f: (d: DadosGoogle["dias"][number]) => number | null, lista = comDados) =>
    lista.reduce((a, c) => a + c.google!.dias.reduce((b, d) => b + (f(d) ?? 0), 0), 0);
  const aguardando = comDados.length === 0;
  const impressoes = aguardando ? null : somaG((d) => d.impressoes);
  const cliques = aguardando ? null : somaG((d) => d.cliques);
  const visiveis =
    aguardando || comDados.some((c) => c.google!.dias.some((d) => d.impressoesVisiveis === null))
      ? null
      : somaG((d) => d.impressoesVisiveis);
  const entregueKpi = doKpiComDados.length ? somaG((d) => d.impressoes, doKpiComDados) : null;
  const valorKpiCent = doKpi.reduce((a, c) => a + c.valorBrutoCent, 0);
  const investidoKpiCent = doKpi.reduce((a, c) => a + c.investidoCent, 0);
  const alcanceUnico = comDados.length === 1 ? comDados[0].google!.alcance : null;

  // 5. Pacing do projeto (5.6)
  const inicioRitmo = calculadas.length
    ? calculadas.map((c) => c.cap.data_inicio).sort()[0]
    : p.data_inicio;
  const pacing = calcularPacing(contratadoCent, investidoCent, inicioRitmo, p.data_fim, hoje);
  const ritmo = encerrado ? "No ritmo" : statusRitmo(investidoCent, pacing.idealAteHojeCent);

  // 6. Série diária do projeto (início → fim; futuros vazios)
  const serie = intervaloDatas(p.data_inicio, p.data_fim).map((data) => {
    const futuro = data > hoje;
    if (futuro) return { data, investido: null, impressoes: null, futuro };
    const cent = calculadas.reduce((a, c) => a + (c.diasCent.get(data) ?? 0), 0);
    const imp = comDados.length ? calculadas.reduce((a, c) => a + (c.impressoesDia.get(data) ?? 0), 0) : null;
    return { data, investido: deCentavos(cent), impressoes: imp, futuro };
  });

  // 7. Estratégias (somente campos brutos)
  const estrategias: EstrategiaPayload[] = calculadas.map((c, i) => {
    const entregue = c.google ? c.google.dias.reduce((a, d) => a + d.impressoes, 0) : null;
    const usaImpressoes = c.cap.kpi === "CPM";
    const entregueKpi = usaImpressoes ? entregue : c.google ? c.google.dias.reduce((a, d) => a + d.cliques, 0) : null;
    return {
      chave: `e${i}`,
      plataforma: c.cap.plataforma,
      plataformaRotulo: ROTULO_PLATAFORMA[c.cap.plataforma] ?? c.cap.plataforma_custom ?? c.cap.plataforma,
      nome: c.cap.estrategia,
      kpi: c.cap.kpi,
      status: c.cap.status,
      dataInicio: c.cap.data_inicio,
      valorBruto: deCentavos(c.valorBrutoCent),
      investido: deCentavos(c.investidoCent),
      restante: deCentavos(Math.max(0, c.valorBrutoCent - c.investidoCent)),
      meta: c.cap.entrega_contratada,
      entregue: entregueKpi,
      pctMeta: entregueKpi === null ? null : pctMeta(entregueKpi, c.cap.entrega_contratada),
      custoContratado: custoPorResultado(deCentavos(c.valorBrutoCent), c.cap.entrega_contratada, c.cap.kpi),
      custoRealizado:
        entregueKpi === null ? null : custoPorResultado(deCentavos(c.investidoCent), entregueKpi, c.cap.kpi),
      aguardandoDados: c.aguardandoDados,
      segmentacao: SEGMENTACAO_POR_ESTRATEGIA[c.cap.estrategia.trim().toLowerCase()] ?? null,
    };
  });

  // 8. Criativos: investido bruto da estratégia distribuído pelo custo de cada anúncio
  const criativos: CriativoPayload[] = [];
  for (const c of comDados) {
    const ads = c.google!.anuncios.filter((a) => a.impressoes > 0 || a.custo > 0);
    const partes = distribuirProporcional(
      c.investidoCent,
      ads.map((a) => a.custo),
    );
    ads.forEach((a, i) => {
      const investido = deCentavos(partes[i]);
      const formato = a.largura && a.altura ? `${a.largura}x${a.altura}` : "—";
      criativos.push({
        chave: `c${criativos.length}`,
        nome: a.nome.replace(/\.(gif|png|jpe?g|webp)$/i, "").replace(/\s*\(\d+\)$/, ""),
        formato,
        largura: a.largura,
        altura: a.altura,
        tipo: a.tipo,
        status: a.status,
        imagemUrl: a.imagemUrl,
        imagemLocal: CRIATIVOS_LOCAIS[formato] ?? null,
        impressoes: a.impressoes,
        cliques: a.cliques,
        ctr: a.impressoes > 0 ? (a.cliques / a.impressoes) * 100 : null,
        investido,
        cpm: a.impressoes > 0 ? investido / (a.impressoes / 1000) : null,
      });
    });
  }

  const atualizadoEm = instantes.sort()[0];
  const payload: DashboardPayload = {
    atualizadoEm,
    hoje,
    projeto: {
      nome: nomeProjeto(p.nome),
      cliente: p.cliente?.nome ?? "",
      agencia: p.agencia?.nome ?? null,
      piIdentificador: projeto.pi?.identificador ?? null,
      dataInicio: p.data_inicio,
      dataFim: p.data_fim,
      status: encerrado ? "encerrado" : p.status,
      encerrado,
    },
    kpis: {
      contratado: deCentavos(contratadoCent),
      investido: deCentavos(investidoCent),
      restante: deCentavos(Math.max(0, contratadoCent - investidoCent)),
      kpiPrincipal,
      impressoes,
      impressoesVisiveis: visiveis,
      alcance: alcanceUnico?.usuarios ?? null,
      frequencia: alcanceUnico?.frequencia ?? null,
      cliques,
      ctr: impressoes && cliques !== null ? (cliques / impressoes) * 100 : null,
      cpmContratado: kpiPrincipal === "CPM" ? custoPorResultado(deCentavos(valorKpiCent), meta, "CPM") : null,
      cpmRealizado:
        kpiPrincipal === "CPM" && entregueKpi ? custoPorResultado(deCentavos(investidoKpiCent), entregueKpi, "CPM") : null,
      aguardandoDados: aguardando,
    },
    progresso: {
      meta,
      entregue: entregueKpi,
      pctMeta: entregueKpi === null ? null : pctMeta(entregueKpi, meta),
      entregaIdealAteHoje: Math.round((meta * pacing.diasPassados) / pacing.diasTotais),
      contratado: deCentavos(contratadoCent),
      investido: deCentavos(investidoCent),
      pctInvestido: contratadoCent > 0 ? (investidoCent / contratadoCent) * 100 : 0,
      idealAteHoje: deCentavos(pacing.idealAteHojeCent),
      pctIdeal: contratadoCent > 0 ? (pacing.idealAteHojeCent / contratadoCent) * 100 : 0,
      status: ritmo,
      diasTotais: pacing.diasTotais,
      diasPassados: pacing.diasPassados,
      diasRestantes: pacing.diasRestantes,
      brutoPorDiaNecessario: deCentavos(pacing.restantePorDiaCent),
    },
    serie,
    estrategias,
    criativos,
  };

  // 9. Checklist (seção 7) antes de exibir
  const paraChecklist: EstrategiaParaChecklist[] = calculadas.map((c) => ({
    nome: `${c.cap.id} ${c.cap.estrategia}`,
    valorBrutoCent: c.valorBrutoCent,
    investidoCent: c.investidoCent,
    diasCent: [...c.diasCent.values()],
    fechado: c.fechado,
    aguardandoDados: c.aguardandoDados,
  }));
  const erros = rodarChecklist(paraChecklist, piCent, payload);
  const somaSerie = serie.reduce((a, d) => a + paraCentavos(d.investido ?? 0), 0);
  if (somaSerie !== investidoCent) erros.push(`[1] série do projeto (${somaSerie}) ≠ investido (${investidoCent})`);
  const somaCriativos = criativos.reduce((a, c) => a + paraCentavos(c.investido), 0);
  const investidoComAds = comDados
    .filter((c) => c.google!.anuncios.some((a) => a.impressoes > 0 || a.custo > 0))
    .reduce((a, c) => a + c.investidoCent, 0);
  if (somaCriativos !== investidoComAds)
    erros.push(`[1] soma dos criativos (${somaCriativos}) ≠ investido (${investidoComAds})`);

  if (erros.length) {
    for (const e of erros) logServidor("error", `checklist falhou: ${e}`);
    return fallback("Os números estão sendo validados. Tente novamente em instantes.");
  }

  ultimoValido = payload;
  return { estado: "ok", payload, aviso: null };
}
