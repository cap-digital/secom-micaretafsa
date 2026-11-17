"use client";

import { useState } from "react";
import type { CriativoPayload, DashboardPayload, Periodo } from "@/lib/tipos";
import { COR, DEGRADE } from "@/lib/cores";
import { fmtBRL, fmtData, fmtInt, fmtPct } from "@/lib/formato";
import { CriativoImagem } from "./CriativoImagem";
import { Numero, type FormatoNumero } from "./Numero";

type Ordem = "investido" | "impressoes" | "cliques";

const ORDENS: { id: Ordem; rotulo: string }[] = [
  { id: "investido", rotulo: "Investimento" },
  { id: "impressoes", rotulo: "Impressões" },
  { id: "cliques", rotulo: "Cliques" },
];

/** até 5 criativos: uma linha com N colunas; acima disso, scroll horizontal com snap */
const MAX_COLUNAS = 5;

/** vidro translúcido sobre o azul (inline) */
const VIDRO_AZUL: React.CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
};

function BigNumber({ rotulo, valor, formato, nota }: { rotulo: string; valor: number | null; formato: FormatoNumero; nota?: string }) {
  return (
    <div className="min-w-0 rounded-[clamp(10px,0.8vw,16px)] px-[clamp(0.6rem,0.8vw,1.1rem)] py-[clamp(0.35rem,0.8vh,0.8rem)]" style={VIDRO_AZUL}>
      <p className="rotulo" style={{ color: "rgba(255,255,255,0.8)" }}>
        {rotulo}
      </p>
      <p className="mt-[0.2em] flex flex-wrap items-baseline gap-x-2">
        <Numero valor={valor} formato={formato} className="font-display fs-num block font-extrabold" style={{ color: "#FFFFFF" }} />
        {nota && (
          <span className="num fs-mini" style={{ color: "rgba(255,255,255,0.8)" }}>
            {nota}
          </span>
        )}
      </p>
    </div>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="rotulo">{rotulo}</dt>
      <dd className="num fs-corpo mt-[0.1em] font-bold text-texto">{valor}</dd>
    </div>
  );
}

function CardCriativo({ c, posicao }: { c: CriativoPayload; posicao: number }) {
  return (
    <article className="card flex min-h-0 min-w-0 flex-col overflow-hidden">
      {/* preview flex-1 + object-contain: verticais (160×600, 300×600) não estouram */}
      <div className="relative flex min-h-[220px] flex-1 items-center justify-center p-[clamp(0.6rem,1vw,1.25rem)] pt-[clamp(2.2rem,4vh,3rem)] lg:min-h-0" style={{ background: "#ECE9E4" }}>
        <span
          className="font-display fs-mini absolute left-[clamp(0.4rem,0.6vw,0.8rem)] top-[clamp(0.4rem,0.6vw,0.8rem)] flex h-[1.9em] min-w-[1.9em] items-center justify-center rounded-full px-1.5 font-extrabold shadow"
          style={{ background: posicao === 1 ? COR.laranja : COR.azul, color: "#FFFFFF" }}
        >
          #{posicao}
        </span>
        <span
          className="num fs-mini absolute right-[clamp(0.4rem,0.6vw,0.8rem)] top-[clamp(0.4rem,0.6vw,0.8rem)] rounded-full bg-white px-2 py-0.5 font-bold shadow-sm"
          style={{ color: COR.azul }}
        >
          {c.formato.replace("x", "×")}
        </span>
        <div className="relative h-full min-h-0 w-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <CriativoImagem remota={c.imagemUrl} local={c.imagemLocal} alt={`Criativo ${c.formato}`} formato={c.formato} />
          </div>
        </div>
      </div>
      <div className="pad-card flex shrink-0 flex-col gap-[clamp(0.3rem,0.7vh,0.75rem)]">
        <p className="fs-mini break-words font-semibold leading-snug text-texto" title={c.nome}>
          {c.nome.replace(/-/g, "-​")}
        </p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-[clamp(0.2rem,0.5vh,0.6rem)] 2xl:grid-cols-3">
          <Metrica rotulo="Investimento" valor={fmtBRL(c.investido)} />
          <Metrica rotulo="Impressões" valor={fmtInt(c.impressoes)} />
          <Metrica rotulo="Cliques" valor={fmtInt(c.cliques)} />
          <Metrica rotulo="CTR" valor={fmtPct(c.ctr, 2)} />
          <Metrica rotulo="CPC" valor={fmtBRL(c.cpc)} />
          <Metrica rotulo="CPM" valor={fmtBRL(c.cpm)} />
        </dl>
      </div>
    </article>
  );
}

export function Criativos({ criativos, periodo, kpis }: { criativos: CriativoPayload[]; periodo: Periodo; kpis: DashboardPayload["kpis"] }) {
  const [ordem, setOrdem] = useState<Ordem>("investido");
  const lista = [...criativos].sort((a, b) => b[ordem] - a[ordem]);
  const melhor = criativos.reduce<CriativoPayload | null>((m, c) => (c.ctr !== null && (m === null || (m.ctr ?? -1) < c.ctr) ? c : m), null);
  const colunas = Math.min(Math.max(lista.length, 1), MAX_COLUNAS);
  const rolagem = lista.length > MAX_COLUNAS;

  return (
    <div className="gap-fluido flex min-h-0 flex-1 flex-col">
      {/* Banner compacto: uma linha de números + linha do melhor CTR (azul liso em degradê) */}
      <section
        className="shrink-0 overflow-hidden rounded-[clamp(16px,1.2vw,26px)] p-[clamp(0.6rem,0.9vw,1.4rem)]"
        style={{ background: DEGRADE.azul, color: "#FFFFFF", boxShadow: "0 16px 40px -16px rgba(20,40,90,0.7)" }}
      >
        <div className="grid grid-cols-2 gap-[clamp(0.4rem,0.6vw,0.9rem)] sm:grid-cols-3 lg:grid-cols-6">
          <BigNumber rotulo="Anúncios veiculados" valor={criativos.length} formato="int" />
          <BigNumber rotulo="Investido bruto" valor={kpis.investido} formato="brl" />
          <BigNumber rotulo="Impressões" valor={kpis.impressoes} formato="int" />
          <BigNumber rotulo="Cliques" valor={kpis.cliques} formato="int" nota={`CTR ${fmtPct(kpis.ctr, 2)}`} />
          <BigNumber rotulo="CPM bruto" valor={kpis.cpmRealizado} formato="brl" />
          <BigNumber rotulo="CPC bruto" valor={kpis.cpc} formato="brl" />
        </div>
        <div className="fs-mini mt-[clamp(0.4rem,0.8vh,0.8rem)] flex flex-wrap items-center justify-between gap-x-4 gap-y-1" style={{ color: "rgba(255,255,255,0.88)" }}>
          <span className="min-w-0 break-words">
            <strong style={{ color: "#FFFFFF" }}>Resumo dos criativos</strong>
            {melhor && (
              <>
                {" · "}Melhor CTR: <strong style={{ color: "#FFFFFF" }}>{melhor.nome.replace(/-/g, "-​")}</strong> ({fmtPct(melhor.ctr, 2)})
              </>
            )}
          </span>
          <span className="num whitespace-nowrap">
            {fmtData(periodo.de)} a {fmtData(periodo.ate)}
          </span>
        </div>
      </section>

      {/* "Ordenar por" sozinho, alinhado à direita */}
      <div className="flex shrink-0 justify-end">
        <div className="flex items-center gap-2">
          <span className="rotulo" style={{ color: COR.sobreLaranja }}>
            Ordenar por
          </span>
          <div className="flex items-center rounded-full bg-white p-1 shadow-md" role="group" aria-label="Ordenar por">
            {ORDENS.map((o) => (
              <button
                key={o.id}
                type="button"
                aria-pressed={ordem === o.id}
                onClick={() => setOrdem(o.id)}
                className="fs-mini whitespace-nowrap rounded-full px-[clamp(0.6rem,0.8vw,1rem)] py-[clamp(0.2rem,0.4vh,0.4rem)] font-semibold transition-colors"
                style={ordem === o.id ? { background: COR.azul, color: "#FFFFFF" } : { color: COR.texto2 }}
              >
                {o.rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="card p-8 text-center text-xs text-texto-3">Sem veiculação registrada até agora.</p>
      ) : rolagem ? (
        // mais de 5: scroll horizontal só nesta área, com snap; cada card = 1/5 da largura
        <div className="gap-fluido flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto pb-1">
          {lista.map((c, i) => (
            <div key={c.chave} className="flex min-h-0 shrink-0 snap-start flex-col" style={{ width: "calc((100% - 4 * clamp(0.5rem, 0.5vw + 0.35vh, 1.25rem)) / 5)", minWidth: 220 }}>
              <CardCriativo c={c} posicao={i + 1} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* mobile/tablet: 1 e 2 colunas; ≥ lg: uma linha com N colunas preenchendo a altura */}
          <div className="gap-fluido grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-2 lg:hidden">
            {lista.map((c, i) => (
              <CardCriativo key={c.chave} c={c} posicao={i + 1} />
            ))}
          </div>
          <div className="gap-fluido hidden min-h-0 flex-1 lg:grid" style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}>
            {lista.map((c, i) => (
              <CardCriativo key={c.chave} c={c} posicao={i + 1} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
