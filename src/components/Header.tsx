"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Periodo } from "@/lib/tipos";
import { COR, DEGRADE } from "@/lib/cores";
import { fmtData } from "@/lib/formato";

const ABAS = [
  { href: "/", rotulo: "Visão Geral" },
  { href: "/criativos", rotulo: "Criativos" },
] as const;

/** vidro branco translúcido sobre o laranja (inline: não depende de CSS) */
const VIDRO: React.CSSProperties = {
  background: "rgba(255,255,255,0.38)",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6), 0 6px 18px -8px rgba(90,35,0,0.35)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

function Abas() {
  const pathname = usePathname();
  return (
    <nav className="flex justify-center gap-1 rounded-full p-1" style={VIDRO} aria-label="Seções">
      {ABAS.map((aba) => {
        const ativa = aba.href === "/" ? pathname === "/" : pathname.startsWith(aba.href);
        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativa ? "page" : undefined}
            className="fs-corpo whitespace-nowrap rounded-full px-[clamp(0.9rem,1.2vw,1.6rem)] py-[clamp(0.35rem,0.6vh,0.6rem)] font-semibold transition-colors"
            style={
              ativa
                ? { background: COR.azul, color: "#FFFFFF", boxShadow: "0 4px 12px -4px rgba(30,78,156,0.6)" }
                : { color: COR.sobreLaranja }
            }
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

/** Botão de atualizar no mesmo vidro das abas (re-renderiza; dados com cache ≤ 5 min). */
function Atualizar() {
  const router = useRouter();
  const [carregando, iniciar] = useTransition();
  return (
    <button
      type="button"
      onClick={() => iniciar(() => router.refresh())}
      className="flex h-[clamp(2rem,4.2vh,2.75rem)] w-[clamp(2rem,4.2vh,2.75rem)] items-center justify-center rounded-full transition-transform hover:scale-105"
      style={{ ...VIDRO, color: COR.sobreLaranja }}
      aria-label="Atualizar dados"
      title="Atualizar dados"
    >
      <svg viewBox="0 0 20 20" className={`h-[45%] w-[45%] ${carregando ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6M16.5 3.5v3.9h-3.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/**
 * Header transparente sobre o degradê: logo em tile + marca + período à esquerda,
 * abas em pílula de vidro centralizadas, atualizar à direita. Compacto no desktop
 * (≈ 72–88px); abaixo de lg as abas descem para uma segunda linha.
 */
export function Header({ periodo, aviso }: { periodo?: Periodo; aviso?: string | null }) {
  return (
    <header className="relative shrink-0">
      <div className="pad-tela mx-auto grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 lg:grid-cols-[1fr_auto_1fr] lg:!pb-0">
        <Link href="/" className="flex min-w-0 items-center gap-[clamp(0.6rem,0.9vw,1.1rem)]" aria-label="Micareta de Feira 2026 — Visão Geral">
          <span
            className="flex h-[clamp(3.25rem,7vh,4.75rem)] shrink-0 items-center overflow-hidden rounded-[clamp(10px,0.9vw,16px)] px-0.5"
            style={{ background: DEGRADE.tileLogo, boxShadow: "0 6px 16px -6px rgba(90,35,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.45)" }}
          >
            <Image src="/brand/logo-micareta-2026.png" alt="Micareta de Feira 2026" width={443} height={323} priority className="h-full w-auto" />
          </span>
          <span className="min-w-0" style={{ color: COR.sobreLaranja }}>
            <span className="rotulo block" style={{ color: COR.sobreLaranja, opacity: 0.8 }}>
              SECOM · Governo da Bahia
            </span>
            <span className="font-display block text-[clamp(1.05rem,1.1vw+0.6vh,1.9rem)] font-extrabold leading-tight">
              Micareta de Feira 2026
            </span>
            {periodo && (
              <span className="fs-mini num block font-medium" style={{ opacity: 0.85 }}>
                {fmtData(periodo.de)} a {fmtData(periodo.ate)} · valores em bruto
              </span>
            )}
            {aviso && (
              <span className="fs-mini mt-0.5 inline-block rounded-full bg-white/70 px-2 font-semibold" style={{ color: COR.sobreLaranja }}>
                {aviso}
              </span>
            )}
          </span>
        </Link>
        <div className="col-span-2 row-start-2 flex justify-center lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <Abas />
        </div>
        <div className="col-start-2 row-start-1 flex justify-end lg:col-start-3">
          <Atualizar />
        </div>
      </div>
    </header>
  );
}
