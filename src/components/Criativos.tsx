"use client";

import { useState } from "react";
import type { CriativoPayload, Periodo } from "@/lib/tipos";
import { fmtBRL, fmtData, fmtInt, fmtPct } from "@/lib/formato";
import { BarraFiltros } from "./BarraFiltros";
import { CriativoImagem } from "./CriativoImagem";

type Ordem = "investido" | "impressoes" | "cliques";

const ORDENS: { id: Ordem; rotulo: string }[] = [
  { id: "investido", rotulo: "Investimento" },
  { id: "impressoes", rotulo: "Impressões" },
  { id: "cliques", rotulo: "Cliques" },
];

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="rotulo">{rotulo}</dt>
      <dd className="num truncate text-[15px] font-semibold text-texto">{valor}</dd>
    </div>
  );
}

export function Criativos({ criativos, periodo }: { criativos: CriativoPayload[]; periodo: Periodo }) {
  const [ordem, setOrdem] = useState<Ordem>("investido");
  const lista = [...criativos].sort((a, b) => b[ordem] - a[ordem]);

  const ordenar = (
    <div className="flex items-center gap-2">
      <span className="rotulo whitespace-nowrap">Ordenar por</span>
      <div className="flex items-center rounded-full border border-borda bg-white p-0.5" role="group" aria-label="Ordenar por">
        {ORDENS.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={ordem === o.id}
            onClick={() => setOrdem(o.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              ordem === o.id ? "bg-laranja text-white" : "text-texto-2 hover:text-texto"
            }`}
          >
            {o.rotulo}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <BarraFiltros
        titulo="Criativos"
        subtitulo={`${criativos.length} anúncios · ${fmtData(periodo.de)} a ${fmtData(periodo.ate)} · valores em bruto`}
        periodo={periodo}
        extra={ordenar}
      />

      {lista.length === 0 ? (
        <p className="rounded-xl border border-borda bg-card p-8 text-center text-xs text-texto-3">
          Sem veiculação no período. Escolha outro intervalo de datas.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {lista.map((c) => (
            <article key={c.chave} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-borda bg-card">
              {/* altura fixa + object-contain: verticais (160×600, 300×600) não estouram */}
              <div className="flex h-72 items-center justify-center border-b border-borda bg-fundo p-4">
                <CriativoImagem remota={c.imagemUrl} local={c.imagemLocal} alt={`Criativo ${c.formato}`} formato={c.formato} />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  {/* quebra de linha só nos hífens (\u200b após cada "-"), nunca no meio da palavra */}
                  <p className="min-w-0 break-words text-xs font-medium leading-snug text-texto" title={c.nome}>
                    {c.nome.replace(/-/g, "-\u200b")}
                  </p>
                  <span className="num shrink-0 rounded-full bg-azul-suave px-2 py-0.5 text-[11px] font-semibold text-azul">
                    {c.formato.replace("x", "×")}
                  </span>
                </div>
                <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-2">
                  <Metrica rotulo="Investido bruto" valor={fmtBRL(c.investido)} />
                  <Metrica rotulo="Impressões" valor={fmtInt(c.impressoes)} />
                  <Metrica rotulo="Cliques" valor={fmtInt(c.cliques)} />
                  <Metrica rotulo="CTR" valor={fmtPct(c.ctr, 2)} />
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
