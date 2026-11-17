"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { COR } from "@/lib/cores";

const ABAS = [
  { href: "/", rotulo: "Visão Geral" },
  { href: "/criativos", rotulo: "Criativos" },
] as const;

function Abas() {
  const pathname = usePathname();
  return (
    <nav
      className="flex justify-center gap-1 rounded-full bg-white/15 p-1 ring-1 ring-white/30 backdrop-blur-md"
      aria-label="Seções"
    >
      {ABAS.map((aba) => {
        const ativa = aba.href === "/" ? pathname === "/" : pathname.startsWith(aba.href);
        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativa ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-semibold transition-colors ${
              ativa ? "text-white shadow-md" : "text-white/90 hover:bg-white/15"
            }`}
            style={ativa ? { background: COR.laranja } : undefined}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

/** Botão discreto que re-renderiza a página (dados com cache de no máximo 5 min). */
function Atualizar() {
  const router = useRouter();
  const [carregando, iniciar] = useTransition();
  return (
    <button
      type="button"
      onClick={() => iniciar(() => router.refresh())}
      className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 ring-1 ring-white/25 transition-colors hover:bg-white/15 hover:text-white"
      aria-label="Atualizar dados"
      title="Atualizar dados"
    >
      <svg viewBox="0 0 20 20" className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6M16.5 3.5v3.9h-3.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/**
 * Faixa azul royal com raios de sol: logo em tile + marca à esquerda, abas de
 * vidro centralizadas e o botão de atualizar à direita. Abaixo de lg, as abas
 * descem para uma segunda linha (sempre visíveis).
 */
export function Header() {
  return (
    <header className="faixa-azul relative shrink-0 shadow-[0_8px_24px_-12px_rgba(20,40,90,0.6)]">
      <div className="mx-auto grid max-w-[1680px] grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-3 lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4" aria-label="Micareta de Feira 2026 — Visão Geral">
          <span className="flex h-16 shrink-0 items-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#E8B141] to-[#E58038] px-1 shadow-lg ring-2 ring-white/40 sm:h-20 lg:h-24">
            <Image
              src="/brand/logo-micareta-2026.png"
              alt="Micareta de Feira 2026"
              width={443}
              height={323}
              priority
              className="h-full w-auto"
            />
          </span>
          <span className="min-w-0">
            <span className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/75">
              SECOM · Governo da Bahia
            </span>
            <span className="font-display block text-lg font-extrabold leading-tight text-white sm:text-2xl">
              Micareta de Feira 2026
            </span>
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
