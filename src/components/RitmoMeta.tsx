"use client";

import { Area, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PontoRitmo } from "@/lib/tipos";
import { COR } from "@/lib/cores";
import { fmtCompacto, fmtDiaMes, fmtInt } from "@/lib/formato";
import { Painel } from "./Painel";

interface Ponto extends PontoRitmo {
  dia: string;
}

function Dica({ active, payload }: { active?: boolean; payload?: { payload: Ponto }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="num rounded-xl border border-borda bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-texto">{p.dia}</p>
      <p className="text-texto-2">
        Acumulado: <strong className="text-texto">{p.acumulado === null ? "a veicular" : fmtInt(p.acumulado)}</strong>
      </p>
      <p className="text-texto-2">
        Meta esperada: <strong className="text-texto">{fmtInt(p.esperado)}</strong>
      </p>
    </div>
  );
}

/** Impressões acumuladas (área) × meta esperada acumulada (linha tracejada), período inteiro. */
export function RitmoMeta({ ritmo }: { ritmo: PontoRitmo[] }) {
  const dados: Ponto[] = ritmo.map((r) => ({ ...r, dia: fmtDiaMes(r.data) }));
  const ultimoReal = dados.reduce((u, d, i) => (d.acumulado !== null ? i : u), -1);
  return (
    <Painel
      titulo="Ritmo em relação à meta"
      subtitulo="impressões acumuladas × meta esperada por dia (contrato)"
      className="h-full"
      acoes={
        <div className="flex items-center gap-3 text-[11px] text-texto-2">
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
      <div className="relative h-60 min-h-0 lg:h-auto lg:min-h-56 lg:flex-1">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dados} margin={{ top: 22, right: 14, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradAcumulado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COR.azul} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COR.azul} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={COR.grade} />
              <XAxis
                dataKey="dia"
                tick={{ fill: COR.eixo, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: COR.grade }}
                interval="preserveStartEnd"
                padding={{ left: 28, right: 12 }}
              />
              <YAxis width={56} tick={{ fill: COR.eixo, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => fmtCompacto(v)} />
              <Tooltip content={<Dica />} cursor={{ stroke: COR.eixo, strokeDasharray: "3 3" }} />
              <Line
                type="linear"
                dataKey="esperado"
                stroke={COR.laranja}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="acumulado"
                stroke={COR.azul}
                strokeWidth={2.5}
                fill="url(#gradAcumulado)"
                connectNulls={false}
                dot={{ r: 4, fill: COR.azul, stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="acumulado"
                  content={(props) => {
                    const { x, y, value, index } = props as { x?: number; y?: number; value?: unknown; index?: number };
                    if (typeof value !== "number" || x === undefined || y === undefined) return null;
                    // último ponto: rótulo acima; anteriores: abaixo e à direita (lado livre de uma linha que sobe)
                    const ultimo = index === ultimoReal;
                    return (
                      <text
                        x={Number(x) + (ultimo ? 0 : 7)}
                        y={Number(y) + (ultimo ? -10 : 16)}
                        textAnchor={ultimo ? "middle" : "start"}
                        fontSize={11}
                        fontWeight={600}
                        fill={COR.azulEscuro}
                        stroke={COR.card}
                        strokeWidth={4}
                        paintOrder="stroke"
                        strokeLinejoin="round"
                      >
                        {fmtCompacto(value)}
                      </text>
                    );
                  }}
                />
              </Area>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Painel>
  );
}
