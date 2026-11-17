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
    <Painel titulo="Gênero" subtitulo="impressões da campanha até hoje" className="h-full">
      {!linhas.length || !maior ? (
        <p className="m-auto text-xs text-texto-3">Aguardando dados</p>
      ) : (
        // container query: donut ao lado da legenda só quando o próprio card é largo (≥ 24rem)
        <div className="@container flex flex-1 flex-col">
        <div className="grid flex-1 grid-cols-1 items-center gap-4 @sm:grid-cols-[minmax(0,170px)_minmax(0,1fr)]">
          <div className="relative mx-auto aspect-square w-full max-w-[180px]">
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
              <span className="font-display num text-[26px] font-extrabold leading-none" style={{ color: corDe(maior.chave) === COR.neutro ? COR.texto : corDe(maior.chave) }}>
                {fmtPct(maior.pct, 0)}
              </span>
              <span className="mt-0.5 text-[11px] font-medium text-texto-2">{maior.rotulo}</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {linhas.map((l) => (
              <li key={l.chave} className="rounded-2xl bg-white px-3 py-2 ring-1 ring-black/[0.04]">
                <div className="flex flex-wrap items-center justify-between gap-x-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-texto">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: corDe(l.chave) }} />
                    {l.rotulo}
                  </span>
                  <span className="num font-display text-base font-bold text-texto">{fmtPct(l.pct)}</span>
                </div>
                <p className="num mt-0.5 flex flex-wrap justify-between gap-x-3 text-[11px] text-texto-3">
                  <span>{fmtCompacto(l.impressoes)} impressões</span>
                  <span>CPM {fmtBRL(l.cpm)}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
        </div>
      )}
    </Painel>
  );
}
