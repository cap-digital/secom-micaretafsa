"use client";

import { useEffect, useRef, useState } from "react";
import { PieChart } from "@/components/charts/pie-chart";
import type { PieData } from "@/components/charts/pie-context";
import { PieSlice } from "@/components/charts/pie-slice";
import type { LinhaRecorte } from "@/lib/tipos";
import { COR, COR_GENERO } from "@/lib/cores";
import { fmtPct } from "@/lib/formato";
import { BarrasRecorte } from "./BarrasRecorte";
import { Painel, Segmentado } from "./Painel";
import { ehCusto, formatarValor, itensRecorte, METRICAS_RECORTE, type MetricaRecorte } from "./recortes";

const corDe = (k: string) => COR_GENERO[k] ?? COR.neutro;

/**
 * Gênero com seletor Impressões | Cliques | CPM | CPC.
 * Impressões/Cliques: donut Bklit (parte do todo). Sem caixa de tooltip: ao passar
 * o mouse numa fatia (ou na legenda), o CENTRO do donut mostra aquela fatia.
 * CPM/CPC: custos não somam como parte do todo, então viram barras horizontais.
 */
export function Genero({ linhas, medias }: { linhas: LinhaRecorte[]; medias: { cpm: number | null; cpc: number | null } }) {
  const [metrica, setMetrica] = useState<MetricaRecorte>("impressoes");
  const [foco, setFoco] = useState<number | null>(null);
  const itens = itensRecorte(linhas, metrica);

  // espessura do anel proporcional ao tamanho do donut (furo = 62% do raio)
  const caixa = useRef<HTMLDivElement>(null);
  const [raioInterno, setRaioInterno] = useState(48);
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => {
      const lado = Math.min(e.contentRect.width, e.contentRect.height);
      if (lado > 0) setRaioInterno(Math.round((lado / 2 - 6) * 0.62));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [metrica]);

  const pie: PieData[] = itens.map((i) => ({ label: i.rotulo, value: i.valor, color: corDe(i.chave) }));
  const maior = itens.reduce((m, i, idx) => (i.valor > itens[m].valor ? idx : m), 0);
  const centro = itens[foco ?? maior];

  return (
    <Painel
      titulo="Gênero"
      className="h-full"
      acoes={
        <Segmentado
          rotulo="Métrica de gênero"
          opcoes={METRICAS_RECORTE}
          valor={metrica}
          onChange={(m) => {
            setFoco(null);
            setMetrica(m);
          }}
        />
      }
    >
      {!itens.length ? (
        <p className="m-auto text-xs text-texto-3">Aguardando dados</p>
      ) : ehCusto(metrica) ? (
        <BarrasRecorte itens={itens} metrica={metrica} media={metrica === "cpm" ? medias.cpm : medias.cpc} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center gap-[clamp(0.5rem,0.8vw,1.25rem)] sm:flex-row sm:items-stretch">
          <div ref={caixa} className="relative aspect-square w-full max-w-[200px] shrink-0 sm:h-full sm:w-auto sm:max-w-[50%] sm:self-center">
            <PieChart
              className="aspect-auto h-full w-full"
              cornerRadius={3}
              data={pie}
              hoveredIndex={foco}
              innerRadius={raioInterno}
              onHoverChange={setFoco}
              padAngle={0.02}
            >
              {pie.map((d, i) => (
                <PieSlice hoverEffect="grow" index={i} key={d.label} />
              ))}
            </PieChart>
            {/* centro: a fatia em foco (ou a maior) — substitui o tooltip flutuante */}
            {centro && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display num fs-num font-extrabold" style={{ color: corDe(centro.chave) }}>
                  {fmtPct(centro.pct, 0)}
                </span>
                <span className="fs-mini mt-[0.2em] font-semibold text-texto">{centro.rotulo}</span>
                <span className="fs-mini num text-texto-3">{formatarValor(metrica, centro.valor)}</span>
              </div>
            )}
          </div>
          <ul className="flex w-full min-w-0 flex-1 flex-col justify-center gap-[clamp(0.25rem,0.6vh,0.6rem)]">
            {itens.map((i, idx) => (
              <li
                key={i.chave}
                onMouseEnter={() => setFoco(idx)}
                onMouseLeave={() => setFoco(null)}
                className="rounded-[clamp(10px,0.8vw,16px)] bg-white px-[clamp(0.5rem,0.6vw,0.9rem)] py-[clamp(0.3rem,0.7vh,0.75rem)] ring-1 ring-black/5 transition-opacity"
                style={{
                  boxShadow: foco === idx ? `inset 0 0 0 2px ${corDe(i.chave)}` : undefined,
                  opacity: foco !== null && foco !== idx ? 0.55 : 1,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-x-2">
                  <span className="fs-corpo flex items-center gap-2 font-semibold text-texto">
                    <span className="h-[0.75em] w-[0.75em] shrink-0 rounded-full" style={{ background: corDe(i.chave) }} />
                    {i.rotulo}
                  </span>
                  <span className="num font-display fs-corpo font-bold text-texto">{fmtPct(i.pct)}</span>
                </div>
                <p className="num fs-mini text-texto-3">{formatarValor(metrica, i.valor)} {metrica === "impressoes" ? "impressões" : "cliques"}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Painel>
  );
}
