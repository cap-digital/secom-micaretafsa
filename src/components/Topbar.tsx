"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/", rotulo: "Visão Geral" },
  { href: "/criativos", rotulo: "Criativos" },
] as const;

export function Topbar() {
  const pathname = usePathname();
  return (
    <header className="listras relative z-10 shrink-0 border-b-4 border-limao">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-3 px-4 sm:gap-6 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Micareta de Feira 2026 — Visão Geral">
          <Image
            src="/brand/logo-micareta.png"
            alt="Micareta de Feira 2026"
            width={106}
            height={90}
            priority
            className="h-12 w-auto drop-shadow-[0_2px_0_rgba(13,10,12,0.35)]"
          />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Seções do dashboard">
          {ABAS.map((aba) => {
            const ativa = aba.href === "/" ? pathname === "/" : pathname.startsWith(aba.href);
            return (
              <Link
                key={aba.href}
                href={aba.href}
                aria-current={ativa ? "page" : undefined}
                className={`titulo-display rounded-md px-3 py-2 text-base tracking-wide transition-colors sm:px-4 sm:text-lg ${
                  ativa ? "bg-limao text-preto shadow-[3px_3px_0_var(--preto)]" : "text-white hover:bg-white/15"
                }`}
              >
                {aba.rotulo}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center rounded-md bg-white px-3 py-1.5 shadow-[3px_3px_0_var(--preto)] md:flex">
          <span className="titulo-display text-sm leading-none text-preto">
            Governo da
            <br />
            <span className="text-lg">Bahia</span>
          </span>
        </div>
      </div>
    </header>
  );
}
