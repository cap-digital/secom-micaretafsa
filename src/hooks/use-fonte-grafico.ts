"use client";

import { useSyncExternalStore } from "react";

/**
 * Tamanho (px) dos rótulos de dados desenhados em SVG pelos gráficos —
 * mesma escala do CSS `clamp(10px, 0.32vw + 0.35vh, 16px)` usada nos eixos.
 */
function calcular(): number {
  const v = 0.0032 * window.innerWidth + 0.0035 * window.innerHeight;
  return Math.round(Math.min(16, Math.max(10, v)) * 10) / 10;
}

function assinar(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

export function useFonteGrafico(): number {
  return useSyncExternalStore(assinar, calcular, () => 11);
}
