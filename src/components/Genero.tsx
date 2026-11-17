"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { LinhaRecorte } from "@/lib/tipos";
import { COR, COR_GENERO } from "@/lib/cores";
import { fmtBRL, fmtCompacto, fmtInt, fmtPct } from "@/lib/formato";
import { Painel } from "./Painel";

const corDe = (k: string) => COR_GENERO[k] ?? COR.neutro;

function Dica({ active, payload }: { active?: boolean; payload?: { payload: LinhaRecorte }[] }) {
  if (!active || !payload?.length) return null;
  const l = payload[0].payload;
  return (
    <div className="num rounded-xl border border-borda bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-texto">{l.rotulo}</p>
      <p className="text-texto-2">
        {fmtInt(l.impressoes)} impressões ({fmtPct(l.pct)}) · CPM {fmtBRL(l.cpm)}
      </p>
    </div>
  );
}

/** Donut de impressões por gênero: % do maior grupo no centro e legenda com impressões, % e CPM bruto. */
export function Genero({ linhas }: { linhas: LinhaRecorte[] }) {
  const maior = linhas.reduce<LinhaRecorte | null>((m, l) => (!m || l.impressoes > m.impressoes ? l : m), null);
  return (
    <Painel titulo="Gênero" className="h-full">
      {!linhas.length || !maior ? (
        <p className="m-auto text-xs text-texto-3">Aguardando dados</p>
      ) : (
        // mobile: donut em cima, legenda embaixo; ≥ sm: donut (quadrado, altura do card) ao lado da legenda
        <div className="flex min-h-0 flex-1 flex-col items-center gap-[clamp(0.5rem,0.8vw,1.25rem)] sm:flex-row sm:items-stretch">
          <div className="relative aspect-square w-full max-w-[200px] shrink-0 sm:h-full sm:w-auto sm:max-w-[48%] sm:self-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<Dica />} />
                <Pie
                  data={linhas}
                  dataKey="impressoes"
                  nameKey="rotulo"
                  innerRadius="64%"
                  outerRadius="96%"
                  paddingAngle={2}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                >
                  {linhas.map((l) => (
                    <Cell key={l.chave} fill={corDe(l.chave)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className="font-display num fs-num font-extrabold"
                style={{ color: corDe(maior.chave) === COR.neutro ? COR.texto : corDe(maior.chave) }}
              >
                {fmtPct(maior.pct, 0)}
              </span>
              <span className="fs-mini mt-[0.3em] font-medium text-texto-2">{maior.rotulo}</span>
            </div>
          </div>
          <ul className="flex w-full min-w-0 flex-1 flex-col justify-center gap-[clamp(0.25rem,0.6vh,0.6rem)]">
            {linhas.map((l) => (
              <li key={l.chave} className="rounded-[clamp(10px,0.8vw,16px)] bg-white px-[clamp(0.5rem,0.6vw,0.9rem)] py-[clamp(0.25rem,0.55vh,0.6rem)] ring-1 ring-black/[0.04]">
                <div className="flex flex-wrap items-center justify-between gap-x-2">
                  <span className="fs-corpo flex items-center gap-2 font-semibold text-texto">
                    <span className="h-[0.75em] w-[0.75em] shrink-0 rounded-full" style={{ background: corDe(l.chave) }} />
                    {l.rotulo}
                  </span>
                  <span className="num font-display fs-corpo font-bold text-texto">{fmtPct(l.pct)}</span>
                </div>
                <p className="num fs-mini flex flex-wrap justify-between gap-x-3 text-texto-3">
                  <span>{fmtCompacto(l.impressoes)} impr.</span>
                  <span>CPM {fmtBRL(l.cpm)}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Painel>
  );
}
