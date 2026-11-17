"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DiaSerie } from "@/lib/tipos";
import { fmtBRL, fmtCompacto, fmtDiaMes, fmtInt } from "@/lib/formato";

const COR_BARRA = "#b70097"; // roxo dos criativos
const COR_LINHA = "#2d099b"; // índigo dos criativos
const GRADE = "#efe6ef";
const EIXO = "#8a7a8c";

interface Ponto {
  dia: string;
  investido: number | null;
  impressoes: number | null;
  futuro: boolean;
}

function Dica({
  active,
  payload,
  tipo,
}: {
  active?: boolean;
  payload?: { payload: Ponto }[];
  tipo: "investido" | "impressoes";
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-borda bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-preto">{p.dia}</p>
      {p.futuro ? (
        <p className="text-texto-3">A veicular</p>
      ) : tipo === "investido" ? (
        <p className="num text-texto-2">
          Investido bruto: <strong className="text-preto">{fmtBRL(p.investido)}</strong>
        </p>
      ) : (
        <p className="num text-texto-2">
          Impressões: <strong className="text-preto">{fmtInt(p.impressoes)}</strong>
        </p>
      )}
    </div>
  );
}

/**
 * Série diária: investimento bruto (barras) e impressões (linha) em dois
 * painéis empilhados com o mesmo eixo de datas — cada um com sua própria
 * escala, sem eixo duplo. Dias futuros aparecem vazios.
 */
export function GraficoDiario({ serie }: { serie: DiaSerie[] }) {
  const dados: Ponto[] = serie.map((d) => ({
    dia: fmtDiaMes(d.data),
    investido: d.investido,
    impressoes: d.impressoes,
    futuro: d.futuro,
  }));
  const futuros = dados.filter((d) => d.futuro);
  const area = futuros.length ? { x1: futuros[0].dia, x2: futuros[futuros.length - 1].dia } : null;
  const margem = { top: 6, right: 8, bottom: 0, left: 0 };

  const eixoX = (mostrar: boolean) => (
    <XAxis
      dataKey="dia"
      tick={mostrar ? { fill: EIXO, fontSize: 11 } : false}
      tickLine={false}
      axisLine={{ stroke: GRADE }}
      height={mostrar ? 22 : 4}
      interval={0}
    />
  );
  const futuro =
    area &&
    (
      <ReferenceArea x1={area.x1} x2={area.x2} fill="#f3edf3" fillOpacity={1} ifOverflow="extendDomain" />
    );

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-borda bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="titulo-display text-xl text-preto">Veiculação dia a dia</h2>
        <p className="flex items-center gap-3 text-xs text-texto-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR_BARRA }} /> Investimento bruto
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded" style={{ background: COR_LINHA }} /> Impressões
          </span>
          {area && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-borda bg-[#f3edf3]" /> A veicular
            </span>
          )}
        </p>
      </div>

      <div className="mt-2 flex min-h-0 flex-1 flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-texto-2">Investimento bruto (R$)</p>
        <div className="relative h-40 min-h-0 lg:h-auto lg:flex-1">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados} margin={margem} syncId="diario" barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke={GRADE} />
                {futuro}
                {eixoX(false)}
                <YAxis
                  width={52}
                  tick={{ fill: EIXO, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => fmtCompacto(v)}
                />
                <Tooltip content={<Dica tipo="investido" />} cursor={{ fill: "rgba(183,0,151,0.06)" }} />
                <Bar dataKey="investido" fill={COR_BARRA} radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-texto-2">Impressões</p>
        <div className="relative h-40 min-h-0 lg:h-auto lg:flex-1">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dados} margin={margem} syncId="diario">
                <CartesianGrid vertical={false} stroke={GRADE} />
                {futuro}
                {eixoX(true)}
                <YAxis
                  width={52}
                  tick={{ fill: EIXO, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => fmtCompacto(v)}
                />
                <Tooltip content={<Dica tipo="impressoes" />} cursor={{ stroke: EIXO, strokeDasharray: "3 3" }} />
                <Line
                  type="monotone"
                  dataKey="impressoes"
                  stroke={COR_LINHA}
                  strokeWidth={2}
                  dot={{ r: 4, fill: COR_LINHA, stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
