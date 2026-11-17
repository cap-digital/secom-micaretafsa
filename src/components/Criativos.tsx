"use client";

import { useState } from "react";
import type { CriativoPayload } from "@/lib/tipos";
import { fmtBRL, fmtInt, fmtPct } from "@/lib/formato";
import { CriativoImagem } from "./CriativoImagem";
import { Segmentado } from "./Painel";

type Ordem = "investido" | "impressoes" | "cliques";

export function Criativos({ criativos }: { criativos: CriativoPayload[] }) {
  const [ordem, setOrdem] = useState<Ordem>("investido");
  const lista = [...criativos].sort((a, b) => b[ordem] - a[ordem]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-texto">Criativos</h1>
          <p className="text-[11px] text-texto-3">{criativos.length} anúncios veiculados no período · valores em bruto</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rotulo">Ordenar por</span>
          <Segmentado
            rotulo="Ordenar por"
            valor={ordem}
            onChange={setOrdem}
            opcoes={[
              { id: "investido", rotulo: "Investimento" },
              { id: "impressoes", rotulo: "Impressões" },
              { id: "cliques", rotulo: "Cliques" },
            ]}
          />
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-1 content-start gap-3 sm:grid-cols-2 lg:flex-1 lg:overflow-y-auto xl:grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
        {lista.map((c) => (
          <article key={c.chave} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-borda bg-card">
            <div className="flex h-72 items-center justify-center border-b border-borda bg-fundo p-4">
              <CriativoImagem remota={c.imagemUrl} local={c.imagemLocal} alt={`Criativo ${c.formato}`} formato={c.formato} />
            </div>
            <div className="flex flex-col gap-3 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-medium text-texto" title={c.nome}>
                  {c.nome}
                </p>
                <span className="num shrink-0 rounded-md bg-roxo-suave px-1.5 py-0.5 text-[11px] font-semibold text-roxo-cat">
                  {c.formato.replace("x", "×")}
                </span>
              </div>
              <dl className="num grid grid-cols-2 gap-x-3 gap-y-2">
                <div>
                  <dt className="rotulo">Investido bruto</dt>
                  <dd className="text-[15px] font-semibold text-texto">{fmtBRL(c.investido)}</dd>
                </div>
                <div>
                  <dt className="rotulo">Impressões</dt>
                  <dd className="text-[15px] font-semibold text-texto">{fmtInt(c.impressoes)}</dd>
                </div>
                <div>
                  <dt className="rotulo">Cliques</dt>
                  <dd className="text-[15px] font-semibold text-texto">{fmtInt(c.cliques)}</dd>
                </div>
                <div>
                  <dt className="rotulo">CTR</dt>
                  <dd className="text-[15px] font-semibold text-texto">{fmtPct(c.ctr, 2)}</dd>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
