"use client";

import { useCallback, useState } from "react";
import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { Grid } from "@/components/charts/grid";
import { BarValueLabels } from "@/components/charts/value-labels";
import { useFonteGrafico } from "@/hooks/use-fonte-grafico";
import { COR } from "@/lib/cores";
import { fmtBRL, fmtInt } from "@/lib/formato";
import { FocoGrafico, LinhaFoco } from "./FocoGrafico";
import { ehCusto, formatarValor, type ItemRecorte, type MetricaRecorte } from "./recortes";

/**
 * Barras horizontais Bklit para um recorte (gênero/idade). Rótulos de dados fora
 * da barra: a margem direita é calculada pelo maior rótulo, então nunca ficam
 * cortados nem caem dentro da barra.
 */
export function BarrasRecorte({
  itens,
  metrica,
  media,
}: {
  itens: ItemRecorte[];
  metrica: MetricaRecorte;
  /** média da campanha (CPM/CPC) — referência leve abaixo do gráfico */
  media?: number | null;
}) {
  const fs = useFonteGrafico();
  const largura = (t: string) => Math.ceil(t.length * 0.61 * fs + 10);
  const esquerda = Math.max(...itens.map((i) => largura(i.rotulo)), 40);
  const direita = Math.max(...itens.map((i) => largura(i.texto)), 40) + 6;
  const dados = itens.map((i) => ({ rotulo: i.rotulo, valor: i.valor, texto: i.texto }));
  const [foco, setFoco] = useState<number | null>(null);
  const aoFocar = useCallback((i: number | null) => setFoco(i), []);
  const item = foco !== null ? itens[foco] : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <div className="grafico-fluido relative min-h-[200px] flex-1 lg:min-h-0">
        <div className="absolute inset-0">
          <BarChart
            key={metrica}
            aspectRatio=""
            barGap={0.38}
            className="h-full w-full"
            data={dados}
            margin={{ top: 4, right: direita, bottom: 4, left: esquerda }}
            orientation="horizontal"
            xDataKey="rotulo"
          >
            <Grid horizontal={false} strokeDasharray="0" vertical />
            <Bar dataKey="valor" fill={ehCusto(metrica) ? COR.laranja : COR.azul} lineCap={6} />
            <BarValueLabels fontSize={fs} format={(v) => formatarValor(metrica, v)} labelKey="texto" valueKey="valor" color={COR.texto} />
            <BarYAxis showAllLabels />
            <FocoGrafico onFoco={aoFocar} />
          </BarChart>
        </div>
      </div>
      <LinhaFoco>
        {item ? (
          <>
            <strong className="text-texto">{item.rotulo}</strong> · {fmtInt(item.linha.impressoes)} impr. · {fmtInt(item.linha.cliques)} cliques ·{" "}
            {fmtBRL(item.linha.investido)}
          </>
        ) : ehCusto(metrica) && media != null ? (
          <span className="text-texto-3">
            média da campanha <span className="font-semibold text-texto-2">{fmtBRL(media)}</span>
          </span>
        ) : null}
      </LinhaFoco>
    </div>
  );
}
