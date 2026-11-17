"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DiaSerie } from "@/lib/tipos";
import { fmtBRL, fmtBRL0, fmtCompacto, fmtDiaMes, fmtInt, fmtPct } from "@/lib/formato";
import { Painel, Segmentado } from "./Painel";

type Metrica = "investido" | "impressoes" | "cliques";

const METRICAS: { id: Metrica; rotulo: string }[] = [
  { id: "investido", rotulo: "Investimento" },
  { id: "impressoes", rotulo: "Impressões" },
  { id: "cliques", rotulo: "Cliques" },
];

import { COR } from "@/lib/cores";

const AZUL = COR.azul;
const GRADE = COR.grade;
const EIXO = COR.eixo;

const formatar = (m: Metrica, v: number | null) => (m === "investido" ? fmtBRL(v) : fmtInt(v));
const formatarCurto = (m: Metrica, v: number | null) =>
  v === null ? "" : m === "investido" ? fmtBRL0(v) : m === "cliques" ? fmtInt(v) : fmtCompacto(v);

interface Ponto extends DiaSerie {
  dia: string;
}

function Dica({ active, payload, metrica }: { active?: boolean; payload?: { payload: Ponto }[]; metrica: Metrica }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-borda bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-texto">{fmtData(p.data)}</p>
      <p className="num text-texto-2">
        {METRICAS.find((m) => m.id === metrica)!.rotulo}: <strong className="text-texto">{formatar(metrica, p[metrica])}</strong>
      </p>
    </div>
  );
}
const fmtData = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

function Tabela({ serie }: { serie: DiaSerie[] }) {
  const passados = serie;
  const tot = {
    investido: passados.reduce((a, d) => a + (d.investido ?? 0), 0),
    impressoes: passados.reduce((a, d) => a + (d.impressoes ?? 0), 0),
    cliques: passados.reduce((a, d) => a + (d.cliques ?? 0), 0),
  };
  const linha = (inv: number | null, imp: number | null, cli: number | null) => ({
    ctr: imp ? ((cli ?? 0) / imp) * 100 : null,
    cpm: imp && inv !== null ? inv / (imp / 1000) : null,
  });
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="num w-full min-w-[560px] text-left text-xs">
        <thead className="sticky top-0 bg-card text-[11px] text-texto-3">
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
            <td className="py-1.5 text-right">{fmtPct(linha(tot.investido, tot.impressoes, tot.cliques).ctr, 2)}</td>
            <td className="py-1.5 text-right">{fmtBRL(linha(tot.investido, tot.impressoes, tot.cliques).cpm)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function PorDia({ serie, aguardando }: { serie: DiaSerie[]; aguardando: boolean }) {
  const [metrica, setMetrica] = useState<Metrica>("investido");
  const [tabela, setTabela] = useState(false);
  const dados: Ponto[] = serie.map((d) => ({ ...d, dia: fmtDiaMes(d.data) }));
  const muitosDias = dados.length > 16;

  return (
    <Painel
      titulo="Por dia"
      subtitulo={aguardando ? "Aguardando dados da plataforma" : "valores em bruto"}
      className="h-full"
      acoes={
        <>
          {!tabela && <Segmentado rotulo="Métrica" opcoes={METRICAS} valor={metrica} onChange={setMetrica} />}
          <button
            type="button"
            onClick={() => setTabela((t) => !t)}
            aria-pressed={tabela}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ring-1 transition-colors ${
              tabela ? "bg-azul text-white ring-azul" : "bg-white text-texto-2 ring-black/5 hover:text-texto"
            }`}
          >
            {tabela ? "Gráfico" : "Tabela"}
          </button>
        </>
      }
    >
      {tabela ? (
        <Tabela serie={serie} />
      ) : (
        <div className="relative h-64 min-h-0 lg:h-auto lg:min-h-64 lg:flex-1">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados} margin={{ top: 20, right: 8, bottom: 0, left: 0 }} barCategoryGap="22%">
                <CartesianGrid vertical={false} stroke={GRADE} />
                <XAxis
                  dataKey="dia"
                  scale="band"
                  tick={{ fill: EIXO, fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: GRADE }}
                  interval={muitosDias ? "preserveStartEnd" : 0}
                />
                <YAxis
                  width={48}
                  tick={{ fill: EIXO, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => fmtCompacto(v)}
                />
                <Tooltip content={<Dica metrica={metrica} />} cursor={{ fill: "rgba(47,109,181,0.06)" }} />
                <Bar dataKey={metrica} fill={AZUL} radius={[6, 6, 0, 0]} maxBarSize={56} isAnimationActive={false}>
                  {!muitosDias && (
                    <LabelList
                      dataKey={metrica}
                      content={(props) => {
                        const { x, y, width, value } = props as { x?: number; y?: number; width?: number; value?: unknown };
                        if (typeof value !== "number" || x === undefined || y === undefined || width === undefined) return null;
                        if (width < 18) return null; // barra estreitíssima: valor no tooltip/tabela
                        const largo = width >= 44;
                        const texto = largo ? formatarCurto(metrica, value) : fmtCompacto(value);
                        return (
                          <text
                            x={x + width / 2}
                            y={y - 6}
                            textAnchor="middle"
                            fontSize={largo ? 11 : 10}
                            fontWeight={500}
                            fill={COR.texto2}
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {texto}
                          </text>
                        );
                      }}
                    />
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Painel>
  );
}
