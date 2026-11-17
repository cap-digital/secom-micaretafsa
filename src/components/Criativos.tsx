"use client";

import { useState } from "react";
import type { CriativoPayload, DashboardPayload, Periodo } from "@/lib/tipos";
import { COR } from "@/lib/cores";
import { fmtBRL, fmtData, fmtInt, fmtPct } from "@/lib/formato";
import { TituloPagina } from "./TituloPagina";
import { CriativoImagem } from "./CriativoImagem";
import { Numero, type FormatoNumero } from "./Numero";

type Ordem = "investido" | "impressoes" | "cliques";

const ORDENS: { id: Ordem; rotulo: string }[] = [
  { id: "investido", rotulo: "Investimento" },
  { id: "impressoes", rotulo: "Impressões" },
  { id: "cliques", rotulo: "Cliques" },
];

function BigNumber({
  rotulo,
  valor,
  formato,
  nota,
}: {
  rotulo: string;
  valor: number | null;
  formato: FormatoNumero;
  nota?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/75">{rotulo}</p>
      <Numero valor={valor} formato={formato} className="font-display mt-1 block text-[26px] font-extrabold leading-none text-white" />
      {nota && <p className="num mt-1 text-[11px] text-white/75">{nota}</p>}
    </div>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="rotulo">{rotulo}</dt>
      <dd className="num mt-0.5 text-[15px] font-bold text-texto">{valor}</dd>
    </div>
  );
}

export function Criativos({
  criativos,
  periodo,
  kpis,
}: {
  criativos: CriativoPayload[];
  periodo: Periodo;
  kpis: DashboardPayload["kpis"];
}) {
  const [ordem, setOrdem] = useState<Ordem>("investido");
  const lista = [...criativos].sort((a, b) => b[ordem] - a[ordem]);
  const melhor = criativos.reduce<CriativoPayload | null>(
    (m, c) => (c.ctr !== null && (m === null || (m.ctr ?? -1) < c.ctr) ? c : m),
    null,
  );

  return (
    <div className="flex flex-col gap-4">
      <TituloPagina titulo="Criativos" periodo={periodo} />

      {/* Banner "Resumo dos criativos" */}
      <section className="faixa-azul overflow-hidden rounded-[24px] p-5 text-white shadow-[0_16px_40px_-16px_rgba(20,40,90,0.7)] lg:p-6">
        <h2 className="font-display text-xl font-extrabold">Resumo dos criativos</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <BigNumber rotulo="Anúncios veiculados" valor={criativos.length} formato="int" />
          <BigNumber rotulo="Investido bruto" valor={kpis.investido} formato="brl" />
          <BigNumber rotulo="Impressões" valor={kpis.impressoes} formato="int" />
          <BigNumber rotulo="Cliques" valor={kpis.cliques} formato="int" nota={`CTR ${fmtPct(kpis.ctr, 2)}`} />
          <BigNumber rotulo="CPM bruto" valor={kpis.cpmRealizado} formato="brl" />
          <BigNumber rotulo="CPC bruto" valor={kpis.cpc} formato="brl" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/15 pt-3 text-xs text-white/85">
          <span className="min-w-0 break-words">
            {melhor ? (
              <>
                Melhor CTR: <strong className="text-white">{melhor.nome.replace(/-/g, "-​")}</strong> ({fmtPct(melhor.ctr, 2)})
              </>
            ) : (
              "Sem cliques no período"
            )}
          </span>
          <span className="num whitespace-nowrap">
            {fmtData(periodo.de)} a {fmtData(periodo.ate)}
          </span>
        </div>
      </section>

      {/* "Ordenar por" sozinho, alinhado à direita abaixo do banner */}
      <div className="flex justify-end">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-sobre-laranja/80">Ordenar por</span>
          <div className="flex items-center rounded-full bg-white p-1 shadow-md shadow-orange-900/15" role="group" aria-label="Ordenar por">
            {ORDENS.map((o) => (
              <button
                key={o.id}
                type="button"
                aria-pressed={ordem === o.id}
                onClick={() => setOrdem(o.id)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  ordem === o.id ? "bg-azul text-white shadow-sm" : "text-texto-2 hover:text-texto"
                }`}
              >
                {o.rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="card p-8 text-center text-xs text-texto-3">Sem veiculação no período. Escolha outro intervalo de datas.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {lista.map((c, i) => (
            <article key={c.chave} className="card flex min-w-0 flex-col overflow-hidden">
              {/* preview grande, altura fixa + object-contain (verticais não estouram) */}
              <div className="relative flex h-72 items-center justify-center p-5" style={{ background: "#ECE9E4" }}>
                <span
                  className="font-display absolute left-3 top-3 flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-extrabold text-white shadow"
                  style={{ background: i === 0 ? COR.laranja : COR.azul }}
                >
                  #{i + 1}
                </span>
                <span className="num absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold shadow-sm" style={{ color: COR.azul }}>
                  {c.formato.replace("x", "×")}
                </span>
                <CriativoImagem remota={c.imagemUrl} local={c.imagemLocal} alt={`Criativo ${c.formato}`} formato={c.formato} />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <p className="break-words text-[13px] font-semibold leading-snug text-texto" title={c.nome}>
                  {c.nome.replace(/-/g, "-​")}
                </p>
                <dl className="mt-auto grid grid-cols-3 gap-x-3 gap-y-3">
                  <Metrica rotulo="Investimento" valor={fmtBRL(c.investido)} />
                  <Metrica rotulo="Impressões" valor={fmtInt(c.impressoes)} />
                  <Metrica rotulo="Cliques" valor={fmtInt(c.cliques)} />
                  <Metrica rotulo="CTR" valor={fmtPct(c.ctr, 2)} />
                  <Metrica rotulo="CPC" valor={fmtBRL(c.cpc)} />
                  <Metrica rotulo="CPM" valor={fmtBRL(c.cpm)} />
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
