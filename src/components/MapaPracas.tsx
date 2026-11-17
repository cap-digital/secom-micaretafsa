"use client";

import dynamic from "next/dynamic";
import type { PracaMapa } from "@/lib/tipos";
import { Painel } from "./Painel";

// Leaflet depende de `window`: carrega só no browser
const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-fundo" />,
});

export function MapaPracas({ pracas }: { pracas: PracaMapa[] }) {
  return (
    <Painel
      titulo="Praças · Localização"
      subtitulo="bolhas proporcionais às impressões (localização do usuário)"
      className="h-full"
    >
      <div className="h-64 min-h-0 overflow-hidden rounded-lg border border-borda lg:h-auto lg:flex-1">
        {pracas.length ? (
          <MapaLeaflet pracas={pracas} />
        ) : (
          <p className="flex h-full items-center justify-center text-xs text-texto-3">Aguardando dados</p>
        )}
      </div>
    </Painel>
  );
}
