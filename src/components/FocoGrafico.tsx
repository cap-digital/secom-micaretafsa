"use client";

import { useEffect } from "react";
import { useChartHoverSelector } from "@/components/charts/chart-context";

/**
 * Filho invisível de um gráfico Bklit: avisa qual ponto/barra está em foco
 * (índice nos dados) ou null. Substitui a caixa de tooltip flutuante — o card
 * mostra o detalhe numa linha fixa, sem cobrir rótulos de dados.
 */
export function FocoGrafico({ onFoco }: { onFoco: (indice: number | null) => void }) {
  const indice = useChartHoverSelector((h) => h.hoveredBarIndex ?? h.tooltipData?.index ?? null);
  useEffect(() => {
    onFoco(indice);
  }, [indice, onFoco]);
  return null;
}

// desenhado depois das séries, como os demais overlays do Bklit
(FocoGrafico as unknown as Record<string, boolean>).__isPostOverlay = true;

/** Linha de detalhe do ponto em foco, com altura reservada (nada pula no hover). */
export function LinhaFoco({ children }: { children?: React.ReactNode }) {
  return (
    <p className="fs-mini num min-h-[2.7em] shrink-0 text-texto-2 lg:min-h-[1.35em]" aria-live="polite">
      {children}
    </p>
  );
}
