import "server-only";
import { envCap, envGoogle, logServidor } from "./env";
import { buscarProjetoCap, type EstrategiaCap, type ProjetoCap } from "./cap-manager";
import {
  buscarGoogleDiario,
  buscarGoogleRecortes,
  type DiarioGoogle,
  type MetricasLinha,
  type RecortesGoogle,
} from "./google-ads";
import {
  ajustarAoPi,
  aplicarTetoPi,
  calcularPacing,
  converterEstrategia,
  custoPorResultado,
  deCentavos,
  distribuirMaioresRestos,
  intervaloDatas,
  paraCentavos,
  pctMeta,
  rodarChecklist,
  statusRitmo,
  type EstrategiaParaChecklist,
} from "./calculos";
import { CRIATIVOS_LOCAIS } from "@/config/campanha";
import type {
  CriativoPayload,
  DashboardPayload,
  LinhaRecorte,
  ResultadoDashboard,
} from "./tipos";

/**
 * Orquestra cap-manager + Google Ads, aplica as regras do manual e devolve
 * apenas o payload BRUTO para a tela. Todo cálculo é refeito a cada leitura;
 * só os dados crus das APIs têm cache (máx. 5 min).
 *
 * Período exibido: sempre a campanha inteira (início da estratégia até hoje,
 * ou até data_fim). A série diária bruta segue a regra 5.4 e os recortes
 * (criativos, gênero, idade) recebem o investido proporcionalmente ao custo
 * de cada linha (maiores restos), fechando ao centavo.
 */

// Último payload que passou no checklist (memória do processo).
let ultimoValido: DashboardPayload | null = null;

const FUSO = "America/Bahia";

/** Data de hoje no fuso da Bahia (UTC−3), em ISO. */
export function hojeBahia(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(agora);
}

function horaBahia(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

const minData = (a: string, b: string) => (a < b ? a : b);

/** "126955---BNI-300x250px-MICARETA-DE-FEIRA-SEADES26 (1).gif" → "300x250px-MICARETA-DE-FEIRA-SEADES26" */
export function nomeLimpo(nome: string): string {
  return (
    nome
      .replace(/\.(gif|png|jpe?g|webp|html?|zip)$/i, "")
      .replace(/\s*\(\d+\)$/, "")
      .replace(/\.(gif|png|jpe?g|webp|html?|zip)$/i, "")
      .replace(/^\d+-+[A-Z]{2,5}-+/i, "")
      .trim() || nome
  );
}

function nomeProjeto(nome: string): string {
  // "MICARETA DE FEIRA 2026 - 16/11/2026 até 22/11/2026" → "MICARETA DE FEIRA 2026"
  return nome.replace(/\s*[-–]\s*\d{2}\/\d{2}\/\d{4}.*$/, "").trim() || nome;
}

const ROTULO_GENERO: Record<string, string> = {
  FEMALE: "Feminino",
  MALE: "Masculino",
  UNDETERMINED: "Não identificado",
};
const ORDEM_GENERO = ["FEMALE", "MALE", "UNDETERMINED"];
const ROTULO_IDADE: Record<string, string> = {
  AGE_RANGE_18_24: "18–24",
  AGE_RANGE_25_34: "25–34",
  AGE_RANGE_35_44: "35–44",
  AGE_RANGE_45_54: "45–54",
  AGE_RANGE_55_64: "55–64",
  AGE_RANGE_65_UP: "65+",
  AGE_RANGE_UNDETERMINED: "Não identificado",
};
const ORDEM_IDADE = Object.keys(ROTULO_IDADE);


interface EstrategiaCalculada {
  cap: EstrategiaCap;
  valorBrutoCent: number;
  investidoCent: number;
  diasCent: Map<string, number>;
  fechado: boolean;
  aguardandoDados: boolean;
  diario: DiarioGoogle | null;
  recortes: RecortesGoogle | null;
}

/** Acumulador de um recorte, em centavos inteiros. */
interface Acumulado extends Omit<MetricasLinha, "custo"> {
  rotulo: string;
  cent: number;
}

function acumular<T extends MetricasLinha>(
  destino: Map<string, Acumulado>,
  linhas: T[],
  totalCent: number,
  chave: (l: T) => string,
  rotulo: (l: T) => string,
) {
  const partes = distribuirMaioresRestos(
    totalCent,
    linhas.map((l) => l.custo),
  );
  linhas.forEach((l, i) => {
    const k = chave(l);
    const a = destino.get(k) ?? { rotulo: rotulo(l), impressoes: 0, cliques: 0, cent: 0 };
    a.impressoes += l.impressoes;
    a.cliques += l.cliques;
    a.cent += partes[i];
    destino.set(k, a);
  });
}

function paraLinhas(m: Map<string, Acumulado>, ordem?: string[]): (LinhaRecorte & { cent: number })[] {
  const totalImp = [...m.values()].reduce((s, a) => s + a.impressoes, 0);
  const chaves = ordem ? ordem.filter((k) => m.has(k)).concat([...m.keys()].filter((k) => !ordem.includes(k))) : [...m.keys()];
  return chaves.map((k) => {
    const a = m.get(k)!;
    const investido = deCentavos(a.cent);
    return {
      chave: k,
      rotulo: a.rotulo,
      impressoes: a.impressoes,
      cliques: a.cliques,
      investido,
      cent: a.cent,
      pct: totalImp > 0 ? (a.impressoes / totalImp) * 100 : 0,
      cpm: a.impressoes > 0 ? investido / (a.impressoes / 1000) : null,
      ctr: a.impressoes > 0 ? (a.cliques / a.impressoes) * 100 : null,
    };
  });
}
const semCent = ({ cent: _c, ...l }: LinhaRecorte & { cent: number }): LinhaRecorte => l; // eslint-disable-line @typescript-eslint/no-unused-vars

function fallback(motivo: string): ResultadoDashboard {
  if (ultimoValido) return { estado: "ok", payload: ultimoValido, aviso: "Exibindo o último dado validado." };
  return { estado: "vazio", titulo: "Dados em atualização", mensagem: motivo };
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

    let diario: DiarioGoogle | null = null;
    let recortes: RecortesGoogle | null = null;
    const consultaGoogle = !e.falta_dados_conta_anuncio && e.plataforma === "google" && !!google && datas.length > 0;
    if (e.falta_dados_conta_anuncio) {
      logServidor("warn", `ALERTA INTERNO: estratégia ${e.id} (${e.estrategia}) sem id_conta/campaign_id`);
    }
    if (consultaGoogle) {
      const ids = [e.campaign_id!, ...e.campanhas_adicionais];
      try {
        const [d, r] = await Promise.all([
          buscarGoogleDiario(e.id_conta!, ids, datas[0], datas[datas.length - 1]),
          buscarGoogleRecortes(e.id_conta!, ids, datas[0], datas[datas.length - 1]),
        ]);
        diario = d;
        recortes = r;
        instantes.push(d.buscadoEm);
        if (r) instantes.push(r.buscadoEm);
      } catch (err) {
        logServidor("error", `falha no Google Ads (estratégia ${e.id}): ${(err as Error).message}`);
        if (ultimoValido) return fallback("");
        diario = null;
        recortes = null;
      }
    }

    const gastoPorData = new Map(diario?.dias.map((d) => [d.data, d.custo]) ?? []);
    const aguardandoDados = !diario;
    const conv = converterEstrategia({
      valorBrutoCent,
      orcamentoPlataforma: e.orcamento_plataforma,
      gastosDia: datas.map((d) => gastoPorData.get(d) ?? 0),
      fechado,
    });
    const semDados = aguardandoDados && !fechado;
    const diasCent = new Map<string, number>();
    datas.forEach((d, idx) => diasCent.set(d, semDados ? 0 : conv.diasCent[idx]));

    calculadas.push({
      cap: e,
      valorBrutoCent,
      investidoCent: semDados ? 0 : conv.investidoCent,
      diasCent,
      fechado,
      aguardandoDados,
      diario,
      recortes,
    });
  }

  // 4. Projeto — período inteiro (5.3)
  const contratadoCent = piCent ?? calculadas.reduce((a, c) => a + c.valorBrutoCent, 0);
  const investidoTotalCent = aplicarTetoPi(
    calculadas.reduce((a, c) => a + c.investidoCent, 0),
    piCent,
  );

  // KPI principal: CPM se existir; meta = soma das metas do MESMO KPI (5.5)
  const kpis = [...new Set(calculadas.map((c) => c.cap.kpi))];
  const kpiPrincipal = kpis.includes("CPM") ? "CPM" : (kpis[0] ?? "CPM");
  const doKpi = calculadas.filter((c) => c.cap.kpi === kpiPrincipal);
  const meta = doKpi.reduce((a, c) => a + c.cap.entrega_contratada, 0);
  const valorKpiCent = doKpi.reduce((a, c) => a + c.valorBrutoCent, 0);
  const comDados = calculadas.filter((c) => c.diario);
  const aguardando = comDados.length === 0;

  const somaDiario = (lista: EstrategiaCalculada[], campo: "impressoes" | "cliques", de?: string, ate?: string) =>
    lista.reduce(
      (a, c) =>
        a + c.diario!.dias.filter((d) => (!de || d.data >= de) && (!ate || d.data <= ate)).reduce((b, d) => b + d[campo], 0),
      0,
    );
  const entregueTotalKpi = doKpi.some((c) => c.diario)
    ? somaDiario(
        doKpi.filter((c) => c.diario),
        kpiPrincipal === "CPM" ? "impressoes" : "cliques",
      )
    : null;

  // 5. Pacing — período inteiro (5.6)
  const inicioRitmo = calculadas.length ? calculadas.map((c) => c.cap.data_inicio).sort()[0] : p.data_inicio;
  const pacing = calcularPacing(contratadoCent, investidoTotalCent, inicioRitmo, p.data_fim, hoje);
  const ritmo = encerrado ? "No ritmo" : statusRitmo(investidoTotalCent, pacing.idealAteHojeCent);

  // 6. KPIs da campanha até hoje (período exibido = início da estratégia → hoje/data_fim)
  const fimExibido = minData(hoje, p.data_fim);
  const periodo = { de: inicioRitmo, ate: fimExibido < inicioRitmo ? inicioRitmo : fimExibido };
  const periodoCent = investidoTotalCent;
  const impPeriodo = aguardando ? null : somaDiario(comDados, "impressoes");
  const cliPeriodo = aguardando ? null : somaDiario(comDados, "cliques");
  const investidoPeriodo = deCentavos(periodoCent);
  const impKpiPeriodo = doKpi.some((c) => c.diario)
    ? somaDiario(
        doKpi.filter((c) => c.diario),
        "impressoes",
      )
    : null;
  const periodoKpiCent = doKpi.reduce((a, c) => a + c.investidoCent, 0);

  // 7. Série diária da campanha até hoje (regra 5.4)
  const serie = intervaloDatas(periodo.de, periodo.ate).map((data) => {
    const cent = calculadas.reduce((a, c) => a + (c.diasCent.get(data) ?? 0), 0);
    const dia = (campo: "impressoes" | "cliques") =>
      comDados.length
        ? comDados.reduce((a, c) => a + (c.diario!.dias.find((d) => d.data === data)?.[campo] ?? 0), 0)
        : null;
    return { data, investido: deCentavos(cent), impressoes: dia("impressoes"), cliques: dia("cliques") };
  });

  // 8. Recortes — investido do intervalo distribuído pelo custo de cada linha
  const accCriativos = new Map<string, Acumulado & { info: RecortesGoogle["anuncios"][number] }>();
  const accGenero = new Map<string, Acumulado>();
  const accIdade = new Map<string, Acumulado>();
  const esperado = { criativos: 0, genero: 0, idade: 0 };

  for (const c of calculadas) {
    const r = c.recortes;
    if (!r) continue;
    const anuncios = r.anuncios.filter((a) => a.impressoes > 0 || a.custo > 0);
    if (anuncios.length) {
      esperado.criativos += c.investidoCent;
      const partes = distribuirMaioresRestos(
        c.investidoCent,
        anuncios.map((a) => a.custo),
      );
      anuncios.forEach((a, i) => {
        const k = `${c.cap.id}:${a.id}`;
        accCriativos.set(k, { rotulo: a.nome, impressoes: a.impressoes, cliques: a.cliques, cent: partes[i], info: a });
      });
    }
    if (r.genero.length) {
      esperado.genero += c.investidoCent;
      acumular(accGenero, r.genero, c.investidoCent, (l) => l.tipo, (l) => ROTULO_GENERO[l.tipo] ?? l.tipo);
    }
    if (r.idade.length) {
      esperado.idade += c.investidoCent;
      acumular(accIdade, r.idade, c.investidoCent, (l) => l.tipo, (l) => ROTULO_IDADE[l.tipo] ?? l.tipo);
    }
  }

  const genero = paraLinhas(accGenero, ORDEM_GENERO);
  const idade = paraLinhas(accIdade, ORDEM_IDADE);

  const criativos: CriativoPayload[] = [...accCriativos.entries()].map(([, a], i) => {
    const formato = a.info.largura && a.info.altura ? `${a.info.largura}x${a.info.altura}` : "—";
    return {
      chave: `c${i}`,
      nome: nomeLimpo(a.info.nome),
      formato,
      largura: a.info.largura,
      altura: a.info.altura,
      tipo: a.info.tipo,
      imagemUrl: a.info.imagemUrl,
      imagemLocal: CRIATIVOS_LOCAIS[formato] ?? null,
      impressoes: a.impressoes,
      cliques: a.cliques,
      ctr: a.impressoes > 0 ? (a.cliques / a.impressoes) * 100 : null,
      investido: deCentavos(a.cent),
      cpc: a.cliques > 0 ? deCentavos(a.cent) / a.cliques : null,
      cpm: a.impressoes > 0 ? deCentavos(a.cent) / (a.impressoes / 1000) : null,
    };
  });

  // 9. Métricas complementares (intervalo) e ritmo acumulado (período inteiro)
  const somaAV = (campo: "visiveis" | "mensuraveis") => {
    if (aguardando || comDados.some((c) => c.diario!.dias.some((d) => d[campo] === null))) return null;
    return comDados.reduce(
      (a, c) =>
        a + c.diario!.dias.reduce((b, d) => b + (d[campo] ?? 0), 0),
      0,
    );
  };
  const visiveis = somaAV("visiveis");
  const mensuraveis = somaAV("mensuraveis");
  const comRecortes = calculadas.filter((c) => c.recortes);
  const alcanceUnico = comRecortes.length === 1 ? comRecortes[0].recortes!.alcance : null;
  const complementares: DashboardPayload["complementares"] = {
    alcance: alcanceUnico?.usuarios ?? null,
    frequencia: alcanceUnico?.frequencia ?? null,
    cliques: cliPeriodo,
    ctr: impPeriodo && cliPeriodo !== null ? (cliPeriodo / impPeriodo) * 100 : null,
    cpc: cliPeriodo ? investidoPeriodo / cliPeriodo : null,
    impressoesVisiveis: visiveis,
    taxaVisibilidade: visiveis !== null && mensuraveis ? (visiveis / mensuraveis) * 100 : null,
    cpmAlcance: alcanceUnico?.usuarios ? investidoPeriodo / (alcanceUnico.usuarios / 1000) : null,
  };

  const datasContrato = intervaloDatas(inicioRitmo, p.data_fim);
  let acumulado = 0;
  const ritmoSerie = datasContrato.map((data, i) => {
    const esperadoDia = Math.round((meta * (i + 1)) / datasContrato.length);
    if (data > hoje || !doKpi.some((c) => c.diario)) return { data, acumulado: null, esperado: esperadoDia };
    acumulado += doKpi.reduce(
      (a, c) => a + (c.diario?.dias.find((d) => d.data === data)?.[kpiPrincipal === "CPM" ? "impressoes" : "cliques"] ?? 0),
      0,
    );
    return { data, acumulado, esperado: esperadoDia };
  });

  const atualizadoEm = instantes.sort()[0];
  const payload: DashboardPayload = {
    atualizadoEm,
    atualizadoHora: horaBahia(atualizadoEm),
    periodo,
    projeto: {
      nome: nomeProjeto(p.nome),
      cliente: p.cliente?.nome ?? "",
      piIdentificador: projeto.pi?.identificador ?? null,
      dataInicio: p.data_inicio,
      dataFim: p.data_fim,
      status: encerrado ? "encerrado" : p.status,
      encerrado,
    },
    kpis: {
      investido: investidoPeriodo,
      contratado: deCentavos(contratadoCent),
      impressoes: impPeriodo,
      cliques: cliPeriodo,
      cpmRealizado:
        kpiPrincipal === "CPM" && impKpiPeriodo
          ? custoPorResultado(deCentavos(periodoKpiCent), impKpiPeriodo, "CPM")
          : null,
      cpmContratado: kpiPrincipal === "CPM" ? custoPorResultado(deCentavos(valorKpiCent), meta, "CPM") : null,
      cpc: cliPeriodo ? investidoPeriodo / cliPeriodo : null,
      ctr: impPeriodo && cliPeriodo !== null ? (cliPeriodo / impPeriodo) * 100 : null,
      aguardandoDados: aguardando,
    },
    progresso: {
      kpi: kpiPrincipal,
      meta,
      entregue: entregueTotalKpi,
      pctMeta: entregueTotalKpi === null ? null : pctMeta(entregueTotalKpi, meta),
      entregaIdealAteHoje: Math.round((meta * pacing.diasPassados) / pacing.diasTotais),
      contratado: deCentavos(contratadoCent),
      investido: deCentavos(investidoTotalCent),
      pctInvestido: contratadoCent > 0 ? (investidoTotalCent / contratadoCent) * 100 : 0,
      idealAteHoje: deCentavos(pacing.idealAteHojeCent),
      pctIdeal: contratadoCent > 0 ? (pacing.idealAteHojeCent / contratadoCent) * 100 : 0,
      status: ritmo,
      diasTotais: pacing.diasTotais,
      diasPassados: pacing.diasPassados,
      diasRestantes: pacing.diasRestantes,
      brutoPorDiaNecessario: deCentavos(pacing.restantePorDiaCent),
      cpmRealizado:
        kpiPrincipal === "CPM" && entregueTotalKpi
          ? custoPorResultado(deCentavos(doKpi.reduce((a, c) => a + c.investidoCent, 0)), entregueTotalKpi, "CPM")
          : null,
      cpmContratado: kpiPrincipal === "CPM" ? custoPorResultado(deCentavos(valorKpiCent), meta, "CPM") : null,
    },
    complementares,
    serie,
    ritmo: ritmoSerie,
    publico: { genero: genero.map(semCent), idade: idade.map(semCent) },
    criativos,
  };

  // 9. Checklist (seção 7) + fechamento dos recortes, antes de exibir
  const paraChecklist: EstrategiaParaChecklist[] = calculadas.map((c) => ({
    nome: `${c.cap.id} ${c.cap.estrategia}`,
    valorBrutoCent: c.valorBrutoCent,
    investidoCent: c.investidoCent,
    diasCent: [...c.diasCent.values()],
    fechado: c.fechado,
    aguardandoDados: c.aguardandoDados,
  }));
  const erros = rodarChecklist(paraChecklist, piCent, payload);
  const somaCent = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const somaSerie = somaCent(serie.map((d) => paraCentavos(d.investido ?? 0)));
  if (somaSerie !== periodoCent) erros.push(`[1] série diária (${somaSerie}) ≠ investido (${periodoCent})`);
  const fechamentos: [string, number, number][] = [
    ["criativos", somaCent([...accCriativos.values()].map((a) => a.cent)), esperado.criativos],
    ["gênero", somaCent(genero.map((l) => l.cent)), esperado.genero],
    ["idade", somaCent(idade.map((l) => l.cent)), esperado.idade],
  ];
  for (const [nome, soma, esp] of fechamentos)
    if (soma !== esp) erros.push(`[1] recorte ${nome}: soma (${soma}) ≠ investido (${esp})`);

  if (erros.length) {
    for (const e of erros) logServidor("error", `checklist falhou: ${e}`);
    return fallback("Os números estão sendo validados. Tente novamente em instantes.");
  }

  ultimoValido = payload;
  return { estado: "ok", payload, aviso: null };
}

/** Totais por recorte, em centavos — usado pela verificação de fechamento. */
export function totaisRecortes(p: DashboardPayload) {
  const c = (xs: { investido: number }[]) => xs.reduce((a, x) => a + paraCentavos(x.investido), 0);
  return {
    investido: paraCentavos(p.kpis.investido),
    serie: c(p.serie.map((d) => ({ investido: d.investido ?? 0 }))),
    criativos: c(p.criativos),
    genero: c(p.publico.genero),
    idade: c(p.publico.idade),
  };
}
