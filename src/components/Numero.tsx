"use client";

import { useEffect, useRef } from "react";
import { fmtBRL, fmtBRL0, fmtCompacto, fmtInt, fmtPct } from "@/lib/formato";

export type FormatoNumero = "brl" | "brl0" | "int" | "compacto" | "pct" | "pct0" | "pct2" | "dec1";

export function formatarNumero(v: number | null, f: FormatoNumero): string {
  if (v === null || !Number.isFinite(v)) return "—";
  switch (f) {
    case "brl":
      return fmtBRL(v);
    case "brl0":
      return fmtBRL0(v);
    case "int":
      return fmtInt(v);
    case "compacto":
      return fmtCompacto(v);
    case "pct":
      return fmtPct(v);
    case "pct0":
      return fmtPct(v, 0);
    case "pct2":
      return fmtPct(v, 2);
    case "dec1":
      return v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
}

/**
 * Número com count-up ao carregar. O servidor já renderiza o valor final
 * (acessível e sem JS); no browser a animação reescreve o texto via ref,
 * sem re-render. Respeita prefers-reduced-motion.
 */
export function Numero({
  valor,
  formato,
  duracao = 900,
  className,
  style,
}: {
  valor: number | null;
  formato: FormatoNumero;
  duracao?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || valor === null || !Number.isFinite(valor)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const inicio = performance.now();
    const passo = (t: number) => {
      const p = Math.min(1, (t - inicio) / duracao);
      const suave = 1 - Math.pow(1 - p, 3);
      el.textContent = formatarNumero(valor * suave, formato);
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = formatarNumero(valor, formato);
    };
  }, [valor, formato, duracao]);

  return (
    <span ref={ref} className={`num ${className ?? ""}`} style={style}>
      {formatarNumero(valor, formato)}
    </span>
  );
}
