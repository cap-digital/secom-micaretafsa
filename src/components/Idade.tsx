"use client";

import { useState } from "react";
import type { LinhaRecorte } from "@/lib/tipos";
import { BarrasRecorte } from "./BarrasRecorte";
import { Painel, Segmentado } from "./Painel";
import { itensRecorte, METRICAS_RECORTE, type MetricaRecorte } from "./recortes";

/** Idade: barras horizontais (Bklit) com seletor Impressões | Cliques | CPM | CPC. */
export function Idade({ linhas, medias }: { linhas: LinhaRecorte[]; medias: { cpm: number | null; cpc: number | null } }) {
  const [metrica, setMetrica] = useState<MetricaRecorte>("impressoes");
  const itens = itensRecorte(linhas, metrica);
  return (
    <Painel
      titulo="Idade"
      className="h-full"
      acoes={<Segmentado rotulo="Métrica de idade" opcoes={METRICAS_RECORTE} valor={metrica} onChange={setMetrica} />}
    >
      {!itens.length ? (
        <p className="m-auto text-xs text-texto-3">Aguardando dados</p>
      ) : (
        <BarrasRecorte itens={itens} metrica={metrica} media={metrica === "cpm" ? medias.cpm : metrica === "cpc" ? medias.cpc : null} />
      )}
    </Painel>
  );
}
