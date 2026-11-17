"use client";

import { useCallback, useState } from "react";
import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { BarValueLabels } from "@/components/charts/value-labels";
import { useFonteGrafico } from "@/hooks/use-fonte-grafico";
import type { DiaSerie } from "@/lib/tipos";
import { COR } from "@/lib/cores";
import { fmtBRL, fmtBRL0, fmtCompacto, fmtData, fmtDiaMes, fmtInt, fmtPct } from "@/lib/formato";
import { FocoGrafico, LinhaFoco } from "./FocoGrafico";
import { Painel, Segmentado } from "./Painel";

type Metrica = "investido" | "impressoes" | "cliques";

const METRICAS: { id: Metrica; rotulo: string }[] = [
  { id: "investido", rotulo: "Investimento" },
  { id: "impressoes", rotulo: "Impressões" },
  { id: "cliques", rotulo: "Cliques" },
];

const formatarCurto = (m: Metrica, v: number) => (m === "investido" ? fmtBRL0(v) : m === "cliques" ? fmtInt(v) : fmtCompacto(v));

function Tabela({ serie }: { serie: DiaSerie[] }) {
  const tot = {
    investido: serie.reduce((a, d) => a + d.investido, 0),
    impressoes: serie.reduce((a, d) => a + (d.impressoes ?? 0), 0),
    cliques: serie.reduce((a, d) => a + (d.cliques ?? 0), 0),
  };
  const linha = (inv: number, imp: number | null, cli: number | null) => ({
    ctr: imp ? ((cli ?? 0) / imp) * 100 : null,
    cpm: imp ? inv / (imp / 1000) : null,
  });
  const totais = linha(tot.investido, tot.impressoes, tot.cliques);
  return (
    <div className="min-h-[220px] flex-1 overflow-auto lg:min-h-0">
      <table className="num fs-mini w-full min-w-[560px] text-left">
        <thead className="sticky top-0 bg-card text-texto-3">
          <tr className="border-b border-borda">
            <th className="py-1.5 font-medium">Dia</th>
            <th className="py-1.5 text-right font-medium">Investido bruto</th>
            <th className="py-1.5 text-right font-medium">Impressões</th>
            <th className="py-1.5 text-right font-medium">Cliques</th>
            <th className="py-1.5 text-right font-medium">CTR</th>
            <th className="py-1.5 text-right font-medium">CPM bruto</th>
          </tr>
        </thead>
        <tbody>
          {serie.map((d) => {
            const x = linha(d.investido, d.impressoes, d.cliques);
            return (
              <tr key={d.data} className="border-b border-borda/70 text-texto">
                <td className="py-1.5">{fmtData(d.data)}</td>
                <td className="py-1.5 text-right">{fmtBRL(d.investido)}</td>
                <td className="py-1.5 text-right">{fmtInt(d.impressoes)}</td>
                <td className="py-1.5 text-right">{fmtInt(d.cliques)}</td>
                <td className="py-1.5 text-right">{fmtPct(x.ctr, 2)}</td>
                <td className="py-1.5 text-right">{fmtBRL(x.cpm)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="sticky bottom-0 bg-card font-semibold">
          <tr>
            <td className="py-1.5">Total</td>
            <td className="py-1.5 text-right">{fmtBRL(tot.investido)}</td>
            <td className="py-1.5 text-right">{fmtInt(tot.impressoes)}</td>
            <td className="py-1.5 text-right">{fmtInt(tot.cliques)}</td>
            <td className="py-1.5 text-right">{fmtPct(totais.ctr, 2)}</td>
            <td className="py-1.5 text-right">{fmtBRL(totais.cpm)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Por dia: colunas Bklit com rótulo de dados em cada barra; toggle de métrica e tabela. */
export function PorDia({ serie, aguardando }: { serie: DiaSerie[]; aguardando: boolean }) {
  const [metrica, setMetrica] = useState<Metrica>("investido");
  const [tabela, setTabela] = useState(false);
  const fs = useFonteGrafico();
  const dados = serie.map((d) => ({
    dia: fmtDiaMes(d.data),
    data: d.data,
    investido: d.investido,
    impressoes: d.impressoes ?? 0,
    cliques: d.cliques ?? 0,
  }));
  const [foco, setFoco] = useState<number | null>(null);
  const aoFocar = useCallback((i: number | null) => setFoco(i), []);
  const dia = foco !== null ? dados[foco] : null;

  return (
    <Painel
      titulo="Por dia"
      subtitulo={aguardando ? "Aguardando dados da plataforma" : undefined}
      className="h-full"
      acoes={
        <>
          {!tabela && <Segmentado rotulo="Métrica" opcoes={METRICAS} valor={metrica} onChange={setMetrica} />}
          <button
            type="button"
            onClick={() => setTabela((t) => !t)}
            aria-pressed={tabela}
            className="fs-mini rounded-full px-[clamp(0.5rem,0.7vw,0.9rem)] py-[clamp(0.15rem,0.35vh,0.35rem)] font-semibold ring-1 ring-black/5 transition-colors"
            style={tabela ? { background: COR.azul, color: "#FFFFFF" } : { background: "#FFFFFF", color: COR.texto2 }}
          >
            {tabela ? "Gráfico" : "Tabela"}
          </button>
        </>
      }
    >
      {tabela ? (
        <Tabela serie={serie} />
      ) : (
        <div className="grafico-fluido relative min-h-[220px] flex-1 lg:min-h-0">
          <div className="absolute inset-0">
            <BarChart
              key={metrica}
              aspectRatio=""
              barGap={dados.length <= 4 ? 0.64 : 0.42}
              className="h-full w-full"
              data={dados}
              margin={{ top: Math.round(fs * 2), right: 8, bottom: Math.round(fs * 2.6), left: 8 }}
              xDataKey="dia"
            >
              <Grid horizontal strokeDasharray="0" />
              <Bar dataKey={metrica} fill={COR.azul} lineCap={6} />
              <BarValueLabels fontSize={fs} format={(v) => formatarCurto(metrica, v)} valueKey={metrica} />
              <BarXAxis showAllLabels />
              <FocoGrafico onFoco={aoFocar} />
            </BarChart>
          </div>
        </div>
      )}
      {!tabela && (
        <LinhaFoco>
          {dia && (
            <>
              <strong className="text-texto">{fmtData(dia.data)}</strong> · investido {fmtBRL(dia.investido)} · {fmtInt(dia.impressoes)} impressões ·{" "}
              {fmtInt(dia.cliques)} cliques
            </>
          )}
        </LinhaFoco>
      )}
    </Painel>
  );
}
