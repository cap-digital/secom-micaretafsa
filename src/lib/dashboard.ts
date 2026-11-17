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
  diffDias,
  distribuirMaioresRestos,
  intervaloDatas,
  paraCentavos,
  pctMeta,
  rodarChecklist,
  somarIntervalo,
  statusRitmo,
  type EstrategiaParaChecklist,
} from "./calculos";
import { localizarMunicipio } from "./municipios";
import { CRIATIVOS_LOCAIS } from "@/config/campanha";
import type {
  CriativoPayload,
  DashboardPayload,
  LinhaRecorte,
  PracaMapa,
  Periodo,
  Preset,
  ResultadoDashboard,
} from "./tipos";

/**
 * Orquestra cap-manager + Google Ads, aplica as regras do manual e devolve
 * apenas o payload BRUTO para a tela. Todo cálculo é refeito a cada leitura;
 * só os dados crus das APIs têm cache (máx. 5 min).
 *
 * Filtro de datas: a série diária bruta é SEMPRE calculada sobre o período
 * inteiro (regra 5.4); o investido de um intervalo é a soma desses dias.
 * Os recortes (criativos, gênero, idade, praças) recebem o investido do
 * intervalo proporcionalmente ao custo de cada linha (maiores restos).
 */

// Último payload válido por intervalo (memória do processo).
const ultimosValidos = new Map<string, DashboardPayload>();

const FUSO = "America/Bahia";

/** Data de hoje no fuso da Bahia (UTC−3), em ISO. */
export function hojeBahia(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(agora);
}

function horaBahia(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function somarDias(iso: string, n: number): string {
  const t = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + n * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

const minData = (a: string, b: string) => (a < b ? a : b);
const maxData = (a: string, b: string) => (a > b ? a : b);
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Intervalo pedido na URL, limitado ao período do projeto. Padrão: período todo. */
export function resolverPeriodo(
  de: string | undefined,
  ate: string | undefined,
  inicio: string,
  fim: string,
  hoje: string,
): Periodo {
  const limitar = (d: string) => minData(fim, maxData(inicio, d));
  let a = de && DATA_ISO.test(de) ? limitar(de) : inicio;
  let b = ate && DATA_ISO.test(ate) ? limitar(ate) : fim;
  if (a > b) [a, b] = [b, a];

  const ontem = limitar(somarDias(hoje, -1));
  const seteDe = limitar(somarDias(hoje, -6));
  const seteAte = limitar(hoje);
  let preset: Preset = "personalizado";
  if (a === inicio && b === fim) preset = "tudo";
  else if (a === ontem && b === ontem) preset = "ontem";
  else if (a === seteDe && b === seteAte) preset = "7d";
  return { de: a, ate: b, preset, minimo: inicio, maximo: fim, hoje };
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
const TOP_PRACAS = 10;

interface EstrategiaCalculada {
  cap: EstrategiaCap;
  valorBrutoCent: number;
  investidoCent: number;
  periodoCent: number;
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

function fallback(chave: string, motivo: string): ResultadoDashboard {
  const ultimo = ultimosValidos.get(chave);
  if (ultimo) return { estado: "ok", payload: ultimo, aviso: "Exibindo o último dado validado." };
  return { estado: "vazio", titulo: "Dados em atualização", mensagem: motivo };
}

export async function carregarDashboard(filtro: { de?: string; ate?: string } = {}): Promise<ResultadoDashboard> {
  const cap = envCap();
  if (!cap) {
    return {
      estado: "vazio",
      titulo: "Dashboard em configuração",
      mensagem: "A conexão com os dados do projeto ainda não foi configurada.",
    };
  }
  const chaveFiltro = `${filtro.de ?? ""}|${filtro.ate ?? ""}`;

  // 1. cap-manager
  let projeto: ProjetoCap;
  let capBuscadoEm: string;
  try {
    const r = await buscarProjetoCap(cap.url, cap.token);
    projeto = r.dados;
    capBuscadoEm = r.buscadoEm;
  } catch (e) {
    logServidor("error", `falha no cap-manager: ${(e as Error).message}`);
    return fallback(chaveFiltro, "Não foi possível ler os dados do projeto agora. Tentaremos novamente em instantes.");
  }

  const hoje = hojeBahia();
  const p = projeto.projeto;
  const encerrado = hoje > p.data_fim || p.campanha_finalizada;
  const periodo = resolverPeriodo(filtro.de, filtro.ate, p.data_inicio, p.data_fim, hoje);
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
  const fimRecortes = minData(periodo.ate, hoje);

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
      const deRecortes = maxData(periodo.de, e.data_inicio);
      try {
        const [d, r] = await Promise.all([
          buscarGoogleDiario(e.id_conta!, ids, datas[0], datas[datas.length - 1]),
          deRecortes <= fimRecortes
            ? buscarGoogleRecortes(e.id_conta!, ids, deRecortes, fimRecortes)
            : Promise.resolve(null),
        ]);
        diario = d;
        recortes = r;
        instantes.push(d.buscadoEm);
        if (r) instantes.push(r.buscadoEm);
      } catch (err) {
        logServidor("error", `falha no Google Ads (estratégia ${e.id}): ${(err as Error).message}`);
        if (ultimosValidos.has(chaveFiltro)) return fallback(chaveFiltro, "");
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
      periodoCent: somarIntervalo(diasCent, periodo.de, periodo.ate),
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

  // 6. KPIs do intervalo filtrado
  const periodoCent = calculadas.reduce((a, c) => a + c.periodoCent, 0);
  const impPeriodo = aguardando ? null : somaDiario(comDados, "impressoes", periodo.de, periodo.ate);
  const cliPeriodo = aguardando ? null : somaDiario(comDados, "cliques", periodo.de, periodo.ate);
  const investidoPeriodo = deCentavos(periodoCent);
  const impKpiPeriodo = doKpi.some((c) => c.diario)
    ? somaDiario(
        doKpi.filter((c) => c.diario),
        "impressoes",
        periodo.de,
        periodo.ate,
      )
    : null;
  const periodoKpiCent = doKpi.reduce((a, c) => a + c.periodoCent, 0);

  // 7. Série diária do intervalo (futuros vazios)
  const serie = intervaloDatas(periodo.de, periodo.ate).map((data) => {
    const futuro = data > hoje;
    if (futuro) return { data, investido: null, impressoes: null, cliques: null, futuro };
    const cent = calculadas.reduce((a, c) => a + (c.diasCent.get(data) ?? 0), 0);
    const dia = (campo: "impressoes" | "cliques") =>
      comDados.length
        ? comDados.reduce((a, c) => a + (c.diario!.dias.find((d) => d.data === data)?.[campo] ?? 0), 0)
        : null;
    return { data, investido: deCentavos(cent), impressoes: dia("impressoes"), cliques: dia("cliques"), futuro };
  });

  // 8. Recortes — investido do intervalo distribuído pelo custo de cada linha
  const accCriativos = new Map<string, Acumulado & { info: RecortesGoogle["anuncios"][number] }>();
  const accGenero = new Map<string, Acumulado>();
  const accIdade = new Map<string, Acumulado>();
  const accCidades = new Map<string, Acumulado>();
  const geoInfo = new Map<string, { nome: string | null; canonico: string | null }>();
  const esperado = { criativos: 0, genero: 0, idade: 0, cidades: 0 };

  for (const c of calculadas) {
    const r = c.recortes;
    if (!r) continue;
    const anuncios = r.anuncios.filter((a) => a.impressoes > 0 || a.custo > 0);
    if (anuncios.length) {
      esperado.criativos += c.periodoCent;
      const partes = distribuirMaioresRestos(
        c.periodoCent,
        anuncios.map((a) => a.custo),
      );
      anuncios.forEach((a, i) => {
        const k = `${c.cap.id}:${a.id}`;
        accCriativos.set(k, { rotulo: a.nome, impressoes: a.impressoes, cliques: a.cliques, cent: partes[i], info: a });
      });
    }
    if (r.genero.length) {
      esperado.genero += c.periodoCent;
      acumular(accGenero, r.genero, c.periodoCent, (l) => l.tipo, (l) => ROTULO_GENERO[l.tipo] ?? l.tipo);
    }
    if (r.idade.length) {
      esperado.idade += c.periodoCent;
      acumular(accIdade, r.idade, c.periodoCent, (l) => l.tipo, (l) => ROTULO_IDADE[l.tipo] ?? l.tipo);
    }
    if (r.cidades.length) {
      esperado.cidades += c.periodoCent;
      for (const cid of r.cidades) if (cid.geo && cid.nome) geoInfo.set(cid.geo, { nome: cid.nome, canonico: cid.canonico });
      acumular(
        accCidades,
        r.cidades,
        c.periodoCent,
        (l) => l.geo ?? "nao-identificado",
        (l) => l.nome ?? "",
      );
    }
  }

  const genero = paraLinhas(accGenero, ORDEM_GENERO);
  const idade = paraLinhas(accIdade, ORDEM_IDADE);

  // Praças: une geo_target_constants que são o mesmo município (o Google pode
  // ter mais de um com o mesmo nome), depois top 10 + "Outras" + "Não identificado"
  const accMunicipios = new Map<string, Acumulado>();
  for (const [geo, a] of accCidades) {
    const g = geoInfo.get(geo);
    const mun = g ? localizarMunicipio(g.nome, g.canonico) : null;
    const k = geo === "nao-identificado" ? geo : mun ? `mun:${mun.uf}:${mun.nome}` : g?.canonico ? `geo:${g.canonico}` : geo;
    const destino = accMunicipios.get(k) ?? { rotulo: a.rotulo, impressoes: 0, cliques: 0, cent: 0 };
    destino.impressoes += a.impressoes;
    destino.cliques += a.cliques;
    destino.cent += a.cent;
    accMunicipios.set(k, destino);
    if (!geoInfo.has(k) && g) geoInfo.set(k, g);
  }
  const cidadesTodas = paraLinhas(accMunicipios);
  const totalImpCidades = cidadesTodas.reduce((a, l) => a + l.impressoes, 0);
  const nomeadas = cidadesTodas
    .filter((l) => l.chave !== "nao-identificado" && l.rotulo)
    .sort((a, b) => b.impressoes - a.impressoes);
  const top = nomeadas.slice(0, TOP_PRACAS).map((l) => {
    const g = geoInfo.get(l.chave);
    const mun = g ? localizarMunicipio(g.nome, g.canonico) : null;
    return { ...l, rotulo: mun ? `${mun.nome} · ${mun.uf}` : l.rotulo };
  });
  const chavesTop = new Set(top.map((l) => l.chave));
  const resto = cidadesTodas.filter((l) => !chavesTop.has(l.chave) && l.chave !== "nao-identificado");
  const naoId = cidadesTodas.find((l) => l.chave === "nao-identificado");
  const agrupada = (chave: string, rotulo: string, linhas: typeof cidadesTodas) => {
    const imp = linhas.reduce((a, l) => a + l.impressoes, 0);
    const cli = linhas.reduce((a, l) => a + l.cliques, 0);
    const cent = linhas.reduce((a, l) => a + l.cent, 0);
    const investido = deCentavos(cent);
    return {
      chave,
      rotulo,
      impressoes: imp,
      cliques: cli,
      investido,
      cent,
      pct: totalImpCidades > 0 ? (imp / totalImpCidades) * 100 : 0,
      cpm: imp > 0 ? investido / (imp / 1000) : null,
      ctr: imp > 0 ? (cli / imp) * 100 : null,
    };
  };
  const ranking = [...top];
  if (resto.length) ranking.push(agrupada("outras", `Outras (${resto.length})`, resto));
  if (naoId) ranking.push({ ...naoId, rotulo: "Não identificado" });

  const mapa: PracaMapa[] = [];
  for (const l of nomeadas) {
    const g = geoInfo.get(l.chave);
    const mun = g ? localizarMunicipio(g.nome, g.canonico) : null;
    if (mun)
      mapa.push({
        chave: l.chave,
        nome: mun.nome,
        uf: mun.uf,
        lat: mun.lat,
        lng: mun.lng,
        impressoes: l.impressoes,
        pct: l.pct,
      });
  }

  const criativos: CriativoPayload[] = [...accCriativos.entries()].map(([, a], i) => {
    const formato = a.info.largura && a.info.altura ? `${a.info.largura}x${a.info.altura}` : "—";
    return {
      chave: `c${i}`,
      nome: a.info.nome.replace(/\s*\(\d+\)(?=\.\w+$|$)/, ""),
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
    };
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
    },
    serie,
    publico: { genero: genero.map(semCent), idade: idade.map(semCent) },
    pracas: { ranking: ranking.map(semCent), mapa },
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
  if (somaSerie !== periodoCent) erros.push(`[1] série do intervalo (${somaSerie}) ≠ investido do intervalo (${periodoCent})`);
  const fechamentos: [string, number, number][] = [
    ["criativos", somaCent([...accCriativos.values()].map((a) => a.cent)), esperado.criativos],
    ["gênero", somaCent(genero.map((l) => l.cent)), esperado.genero],
    ["idade", somaCent(idade.map((l) => l.cent)), esperado.idade],
    ["praças", somaCent(ranking.map((l) => l.cent)), esperado.cidades],
  ];
  for (const [nome, soma, esp] of fechamentos)
    if (soma !== esp) erros.push(`[1] recorte ${nome}: soma (${soma}) ≠ investido do intervalo (${esp})`);
  if (diffDias(periodo.de, periodo.ate) < 0) erros.push("intervalo inválido");

  if (erros.length) {
    for (const e of erros) logServidor("error", `checklist falhou: ${e}`);
    return fallback(chaveFiltro, "Os números estão sendo validados. Tente novamente em instantes.");
  }

  ultimosValidos.set(chaveFiltro, payload);
  if (ultimosValidos.size > 50) ultimosValidos.delete(ultimosValidos.keys().next().value!);
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
    pracas: c(p.pracas.ranking),
  };
}
