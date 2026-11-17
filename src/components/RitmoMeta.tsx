"use client";

import { useCallback, useState } from "react";
import { Area } from "@/components/charts/area";
import { ComposedChart } from "@/components/charts/composed-chart";
import { Grid } from "@/components/charts/grid";
import { Line } from "@/components/charts/line";
import { ProjectionLine } from "@/components/charts/projection-line";
import { ValueLabels } from "@/components/charts/value-labels";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { useFonteGrafico } from "@/hooks/use-fonte-grafico";
import type { PontoRitmo } from "@/lib/tipos";
import { COR } from "@/lib/cores";
import { fmtCompacto, fmtData, fmtInt } from "@/lib/formato";
import { FocoGrafico, LinhaFoco } from "./FocoGrafico";
import { Painel } from "./Painel";

/** "2026-11-16" → Date local ao meio-dia (evita virar o dia por fuso). */
const paraData = (iso: string) => new Date(`${iso}T12:00:00`);

/**
 * Impressões acumuladas (área) × meta esperada acumulada (tracejado).
 * As séries do Bklit não aceitam nulos: os dados vão até hoje e a meta dos
 * dias futuros segue como ProjectionLine até o fim do contrato (xDomain).
 */
export function RitmoMeta({ ritmo }: { ritmo: PontoRitmo[] }) {
  const fs = useFonteGrafico();
  const [foco, setFoco] = useState<number | null>(null);
  const aoFocar = useCallback((i: number | null) => setFoco(i), []);
  const realizados = ritmo.filter((r) => r.acumulado !== null);
  const dados = realizados.map((r) => ({ date: paraData(r.data), acumulado: r.acumulado as number, esperado: r.esperado }));
  const ultimo = realizados[realizados.length - 1];
  const futuros = ritmo.filter((r) => r.acumulado === null);
  const projecao = ultimo && futuros.length ? [ultimo, ...futuros].map((r) => ({ date: paraData(r.data), value: r.esperado })) : [];
  const dominio: [Date, Date] | undefined = ritmo.length ? [paraData(ritmo[0].data), paraData(ritmo[ritmo.length - 1].data)] : undefined;

  return (
    <Painel
      titulo="Ritmo em relação à meta"
      className="h-full"
      acoes={
        <div className="fs-mini flex flex-wrap items-center gap-x-3 gap-y-1 text-texto-2">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR.azul }} /> Acumulado
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="4" aria-hidden>
              <line x1="0" y1="2" x2="16" y2="2" stroke={COR.laranja} strokeWidth="2" strokeDasharray="4 3" />
            </svg>
            Meta esperada
          </span>
        </div>
      }
    >
      {!dados.length ? (
        <p className="m-auto text-xs text-texto-3">Aguardando dados</p>
      ) : (
        <div className="grafico-fluido relative min-h-[220px] flex-1 lg:min-h-0">
          {/* bottom-1: a caixa do eixo Y passa alguns px do gráfico; fica dentro do card */}
          <div className="absolute inset-x-0 top-0 bottom-1">
            <ComposedChart
              aspectRatio=""
              className="h-full w-full"
              data={dados}
              margin={{ top: Math.round(fs * 2), right: Math.round(fs * 1.5), bottom: Math.round(fs * 2.6), left: Math.round(fs * 4.2) }}
              xDomain={dominio}
              xDomainSlotCount={ritmo.length}
            >
              <Grid horizontal strokeDasharray="0" />
              <Area dataKey="acumulado" fill={COR.azul} fillOpacity={0.3} stroke={COR.azul} strokeWidth={2.5} showMarkers fadeEdges={false} />
              <Line dataKey="esperado" stroke={COR.laranja} strokeWidth={2} dashFromIndex={0} dashArray="6,4" fadeEdges={false} showHighlight={false} />
              {projecao.length > 1 && <ProjectionLine data={projecao} stroke={COR.laranja} strokeWidth={2} strokeDasharray="6,4" />}
              <ValueLabels fontSize={fs} format={fmtCompacto} valueKey="acumulado" color={COR.azulEscuro} />
              {/* sem o "0" (encostaria no primeiro rótulo do eixo X) */}
              <YAxis formatValue={(v) => (v === 0 ? "" : fmtCompacto(v))} numTicks={4} />
              <XAxis numTicks={7} tickMode="domain" />
              <FocoGrafico onFoco={aoFocar} />
            </ComposedChart>
          </div>
        </div>
      )}
      <LinhaFoco>
        {foco !== null && realizados[foco] && (
          <>
            <strong className="text-texto">{fmtData(realizados[foco].data)}</strong> · acumulado {fmtInt(realizados[foco].acumulado)} · meta esperada{" "}
            {fmtInt(realizados[foco].esperado)}
          </>
        )}
      </LinhaFoco>
    </Painel>
  );
}
