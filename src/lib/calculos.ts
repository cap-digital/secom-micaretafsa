/**
 * Regras de cálculo do manual (docs/manual-dashboard-api-projetos.md, seção 5).
 *
 * Arquivo PURO: sem imports, sem I/O, sem Date.now(). Pode ser importado pelo
 * servidor e pelos testes (`npm run check`). Todo dinheiro é tratado em
 * CENTAVOS INTEIROS para que as somas fechem exatamente.
 */

const EPS = 1e-6;

/** Converte reais (float) em centavos inteiros, arredondando para baixo. */
export function paraCentavosPiso(valor: number): number {
  if (!Number.isFinite(valor) || valor <= 0) return 0;
  return Math.floor(valor * 100 + EPS);
}

/** Converte reais (float) em centavos inteiros, arredondamento normal (valores contratados). */
export function paraCentavos(valor: number): number {
  if (!Number.isFinite(valor)) return 0;
  return Math.round(valor * 100);
}

export function deCentavos(cent: number): number {
  return cent / 100;
}

// ---------------------------------------------------------------------------
// 5.1 Regra de 3
// ---------------------------------------------------------------------------

/** bruto = gasto_plataforma × valor_bruto ÷ orcamento_plataforma (orçamento 0 → bruto = gasto). */
export function regraDeTres(gastoPlataforma: number, valorBruto: number, orcamentoPlataforma: number): number {
  if (!Number.isFinite(gastoPlataforma) || gastoPlataforma <= 0) return 0;
  if (!orcamentoPlataforma || orcamentoPlataforma <= 0) return gastoPlataforma;
  return (gastoPlataforma * valorBruto) / orcamentoPlataforma;
}

// ---------------------------------------------------------------------------
// Distribuição proporcional em centavos (fecha exatamente no total)
// ---------------------------------------------------------------------------

/**
 * Distribui `totalCent` proporcionalmente aos `pesos`, em centavos (piso),
 * e coloca a diferença de arredondamento no índice `indiceAjuste`
 * (padrão: último peso > 0). Pesos todos zero → divisão igual.
 */
export function distribuirProporcional(totalCent: number, pesos: number[], indiceAjuste?: number): number[] {
  const n = pesos.length;
  if (n === 0) return [];
  const somaPesos = pesos.reduce((a, b) => a + Math.max(0, b), 0);
  let partes: number[];
  if (somaPesos <= 0) {
    partes = pesos.map(() => Math.floor(totalCent / n));
  } else {
    partes = pesos.map((p) => Math.floor((totalCent * Math.max(0, p)) / somaPesos + EPS));
  }
  const soma = partes.reduce((a, b) => a + b, 0);
  const diff = totalCent - soma;
  if (diff !== 0) {
    let idx = indiceAjuste;
    if (idx === undefined) {
      idx = n - 1;
      if (somaPesos > 0) {
        for (let i = n - 1; i >= 0; i--) {
          if (pesos[i] > 0) {
            idx = i;
            break;
          }
        }
      }
    }
    partes[idx] += diff;
  }
  return partes;
}

// ---------------------------------------------------------------------------
// 5.3 Ajuste das estratégias ao PI
// ---------------------------------------------------------------------------

export interface AjustePi {
  valoresCent: number[];
  ajustado: boolean;
}

/**
 * Se a soma dos valores brutos das estratégias for diferente do PI, ajusta
 * proporcionalmente para fechar exatamente no PI (em centavos).
 */
export function ajustarAoPi(valoresBrutosCent: number[], piCent: number | null): AjustePi {
  const soma = valoresBrutosCent.reduce((a, b) => a + b, 0);
  if (piCent === null || piCent <= 0 || soma <= 0 || soma === piCent) {
    return { valoresCent: [...valoresBrutosCent], ajustado: false };
  }
  return { valoresCent: distribuirProporcional(piCent, valoresBrutosCent), ajustado: true };
}

// ---------------------------------------------------------------------------
// 5.2 + 5.4 Investido bruto da estratégia e série diária
// ---------------------------------------------------------------------------

export interface EntradaConversao {
  /** valor bruto contratado da estratégia (já ajustado ao PI), em centavos */
  valorBrutoCent: number;
  /** orçamento de plataforma (reais) — só para a regra de 3 */
  orcamentoPlataforma: number;
  /** gasto de plataforma por dia (reais), na ordem cronológica */
  gastosDia: number[];
  /** estratégia finalizada ou projeto encerrado */
  fechado: boolean;
}

export interface SaidaConversao {
  investidoCent: number;
  diasCent: number[];
  tetoAtingido: boolean;
}

export function converterEstrategia(e: EntradaConversao): SaidaConversao {
  const { valorBrutoCent, orcamentoPlataforma, gastosDia, fechado } = e;
  const valorBruto = deCentavos(valorBrutoCent);

  // Finalizada / encerrado: total = valor bruto exato, proporcional ao gasto real.
  if (fechado) {
    return {
      investidoCent: valorBrutoCent,
      diasCent: distribuirProporcional(valorBrutoCent, gastosDia),
      tetoAtingido: true,
    };
  }

  // Em andamento: regra de 3 + teto da estratégia.
  const gastoTotal = gastosDia.reduce((a, b) => a + Math.max(0, b), 0);
  const brutoTotalCent = paraCentavosPiso(regraDeTres(gastoTotal, valorBruto, orcamentoPlataforma));
  const investidoCent = Math.min(brutoTotalCent, valorBrutoCent);

  const diasCent: number[] = [];
  let acumulado = 0;
  let tetoAtingido = false;
  for (const g of gastosDia) {
    if (tetoAtingido) {
      diasCent.push(0);
      continue;
    }
    let c = paraCentavosPiso(regraDeTres(g, valorBruto, orcamentoPlataforma));
    if (acumulado + c >= valorBrutoCent && valorBrutoCent > 0 && brutoTotalCent >= valorBrutoCent) {
      c = valorBrutoCent - acumulado;
      tetoAtingido = true;
    }
    acumulado += c;
    diasCent.push(c);
  }

  // Diferença de arredondamento no último dia veiculado.
  const diff = investidoCent - acumulado;
  if (diff !== 0 && diasCent.length > 0) {
    let idx = -1;
    for (let i = diasCent.length - 1; i >= 0; i--) {
      if (gastosDia[i] > 0 && (diasCent[i] > 0 || !tetoAtingido)) {
        idx = i;
        break;
      }
    }
    if (idx === -1) idx = diasCent.length - 1;
    diasCent[idx] += diff;
  }

  return { investidoCent, diasCent, tetoAtingido: tetoAtingido || investidoCent >= valorBrutoCent };
}

/** Teto do PI no projeto: a soma das estratégias nunca passa de pi.valor_bruto. */
export function aplicarTetoPi(somaInvestidoCent: number, piCent: number | null): number {
  if (piCent === null || piCent <= 0) return somaInvestidoCent;
  return Math.min(somaInvestidoCent, piCent);
}

// ---------------------------------------------------------------------------
// 5.5 Metas
// ---------------------------------------------------------------------------

export function pctMeta(entregue: number, meta: number): number | null {
  if (!meta || meta <= 0) return null;
  return (entregue / meta) * 100;
}

/** Custo bruto por resultado. CPM: valor ÷ (entrega ÷ 1000). */
export function custoPorResultado(valorBruto: number, entrega: number, kpi: string): number | null {
  if (!entrega || entrega <= 0) return null;
  if (kpi.toUpperCase() === "CPM") return valorBruto / (entrega / 1000);
  return valorBruto / entrega;
}

// ---------------------------------------------------------------------------
// 5.6 Pacing (bruto)
// ---------------------------------------------------------------------------

/** Diferença em dias entre duas datas ISO (YYYY-MM-DD), b − a. */
export function diffDias(a: string, b: string): number {
  const ta = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const tb = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((tb - ta) / 86_400_000);
}

/** Lista de datas ISO de `inicio` a `fim`, inclusive. */
export function intervaloDatas(inicio: string, fim: string): string[] {
  const out: string[] = [];
  const n = diffDias(inicio, fim);
  const base = Date.UTC(+inicio.slice(0, 4), +inicio.slice(5, 7) - 1, +inicio.slice(8, 10));
  for (let i = 0; i <= n; i++) out.push(new Date(base + i * 86_400_000).toISOString().slice(0, 10));
  return out;
}

export interface Pacing {
  diasTotais: number;
  diasPassados: number;
  diasRestantes: number;
  idealAteHojeCent: number;
  restanteCent: number;
  restantePorDiaCent: number;
}

export function calcularPacing(
  valorBrutoCent: number,
  investidoCent: number,
  inicioEstrategia: string,
  fimProjeto: string,
  hoje: string,
): Pacing {
  const diasTotais = Math.max(1, diffDias(inicioEstrategia, fimProjeto) + 1);
  const diasPassados = Math.min(diasTotais, Math.max(0, diffDias(inicioEstrategia, hoje) + 1));
  const diasRestantes = diasTotais - diasPassados;
  const idealAteHojeCent = Math.floor((valorBrutoCent * diasPassados) / diasTotais);
  const restanteCent = Math.max(0, valorBrutoCent - investidoCent);
  const restantePorDiaCent = diasRestantes > 0 ? Math.ceil(restanteCent / diasRestantes) : 0;
  return { diasTotais, diasPassados, diasRestantes, idealAteHojeCent, restanteCent, restantePorDiaCent };
}

export type StatusRitmo = "No ritmo" | "Acima" | "Abaixo";

/** Tolerância de ±10% em relação ao ideal até hoje. */
export function statusRitmo(realizadoCent: number, idealCent: number, tolerancia = 0.1): StatusRitmo {
  if (idealCent <= 0) return realizadoCent > 0 ? "Acima" : "No ritmo";
  const r = realizadoCent / idealCent;
  if (r > 1 + tolerancia) return "Acima";
  if (r < 1 - tolerancia) return "Abaixo";
  return "No ritmo";
}

// ---------------------------------------------------------------------------
// 7. Checklist de validação
// ---------------------------------------------------------------------------

export interface EstrategiaParaChecklist {
  nome: string;
  valorBrutoCent: number;
  investidoCent: number;
  diasCent: number[];
  fechado: boolean;
  aguardandoDados: boolean;
}

/** Chaves que nunca podem aparecer no payload enviado ao browser. */
export const CHAVES_PROIBIDAS = [
  "orcamento_plataforma",
  "orcamentoPlataforma",
  "id_conta",
  "idConta",
  "campaign_id",
  "campaignId",
  "business_id",
  "cost_micros",
  "costMicros",
  "gasto",
  "gastoPlataforma",
  "gasto_plataforma",
  "spend",
];

export function encontrarChavesProibidas(payload: unknown): string[] {
  const achadas = new Set<string>();
  const visitar = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(visitar);
    else if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (CHAVES_PROIBIDAS.includes(k)) achadas.add(k);
        visitar(val);
      }
    }
  };
  visitar(payload);
  return [...achadas];
}

export function rodarChecklist(
  estrategias: EstrategiaParaChecklist[],
  piCent: number | null,
  payloadBrowser: unknown,
): string[] {
  const erros: string[] = [];
  let soma = 0;
  for (const e of estrategias) {
    soma += e.investidoCent;
    const somaDias = e.diasCent.reduce((a, b) => a + b, 0);
    if (!e.aguardandoDados || e.fechado) {
      if (somaDias !== e.investidoCent)
        erros.push(`[1] ${e.nome}: soma dos dias (${somaDias}) ≠ investido (${e.investidoCent}) em centavos`);
    }
    if (e.investidoCent > e.valorBrutoCent)
      erros.push(`[2] ${e.nome}: investido (${e.investidoCent}) > contratado (${e.valorBrutoCent})`);
    if (e.fechado && e.investidoCent !== e.valorBrutoCent)
      erros.push(`[4] ${e.nome}: finalizada/encerrado mas investido (${e.investidoCent}) ≠ contratado (${e.valorBrutoCent})`);
    if (e.diasCent.some((d) => d < 0)) erros.push(`[1] ${e.nome}: dia com valor negativo`);
  }
  if (piCent !== null && soma > piCent) erros.push(`[3] soma das estratégias (${soma}) > PI (${piCent})`);
  const proibidas = encontrarChavesProibidas(payloadBrowser);
  if (proibidas.length) erros.push(`[5] payload contém dados de plataforma: ${proibidas.join(", ")}`);
  return erros;
}
