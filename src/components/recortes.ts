import type { LinhaRecorte } from "@/lib/tipos";
import { fmtBRL, fmtCompacto, fmtInt, fmtPct } from "@/lib/formato";

export type MetricaRecorte = "impressoes" | "cliques" | "cpm" | "cpc";

export const METRICAS_RECORTE: { id: MetricaRecorte; rotulo: string }[] = [
  { id: "impressoes", rotulo: "Impressões" },
  { id: "cliques", rotulo: "Cliques" },
  { id: "cpm", rotulo: "CPM" },
  { id: "cpc", rotulo: "CPC" },
];

export const ehCusto = (m: MetricaRecorte) => m === "cpm" || m === "cpc";

/** Linhas "Não identificado" (UNDETERMINED / AGE_RANGE_UNDETERMINED) saem só da exibição. */
const naoIdentificada = (l: LinhaRecorte) => /UNDETERMINED$/.test(l.chave);

export interface ItemRecorte {
  chave: string;
  rotulo: string;
  valor: number;
  /** % sobre o total identificado (só impressões/cliques) */
  pct: number | null;
  /** rótulo de dados pronto: "97,5 mil · 15,1%" ou "R$ 8,93" */
  texto: string;
  linha: LinhaRecorte;
}

/**
 * Itens exibidos para a métrica escolhida. Impressões/cliques: valor e % sobre o
 * total IDENTIFICADO. CPM/CPC: valor em R$ bruto (o investido de cada linha já vem
 * distribuído proporcionalmente ao custo, fechando ao centavo no servidor).
 */
export function itensRecorte(linhas: LinhaRecorte[], metrica: MetricaRecorte): ItemRecorte[] {
  const identificadas = linhas.filter((l) => !naoIdentificada(l));
  if (ehCusto(metrica)) {
    return identificadas
      .filter((l) => l[metrica] !== null)
      .map((l) => ({ chave: l.chave, rotulo: l.rotulo, valor: l[metrica] as number, pct: null, texto: fmtBRL(l[metrica]), linha: l }));
  }
  const total = identificadas.reduce((a, l) => a + l[metrica], 0);
  return identificadas.map((l) => {
    const valor = l[metrica];
    const pct = total > 0 ? (valor / total) * 100 : 0;
    const v = metrica === "impressoes" ? fmtCompacto(valor) : fmtInt(valor);
    return { chave: l.chave, rotulo: l.rotulo, valor, pct, texto: `${v} · ${fmtPct(pct)}`, linha: l };
  });
}

export const formatarValor = (m: MetricaRecorte, v: number) => (ehCusto(m) ? fmtBRL(v) : fmtInt(v));
