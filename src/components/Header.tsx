"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const ABAS = [
  { href: "/", rotulo: "Visão Geral" },
  { href: "/criativos", rotulo: "Criativos" },
] as const;

function Abas({ qs }: { qs: string }) {
  const pathname = usePathname();
  return (
    <nav className="flex justify-center rounded-full bg-white/25 p-1 ring-1 ring-white/40 backdrop-blur-sm" aria-label="Seções">
      {ABAS.map((aba) => {
        const ativa = aba.href === "/" ? pathname === "/" : pathname.startsWith(aba.href);
        return (
          <Link
            key={aba.href}
            href={`${aba.href}${qs}`}
            aria-current={ativa ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-5 py-1.5 text-[13px] font-semibold transition-colors ${
              ativa ? "bg-white text-azul shadow-sm" : "text-[#7a3510] hover:bg-white/30"
            }`}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

/** Abas que preservam o filtro de datas (?de=&ate=) ao trocar de página. */
function AbasComFiltro() {
  const busca = useSearchParams();
  const qs = busca.toString() ? `?${busca.toString()}` : "";
  return <Abas qs={qs} />;
}

/** Faixa com o degradê da Micareta, logo à esquerda e abas em pílula centralizadas. */
export function Header() {
  return (
    <header className="faixa-micareta relative shrink-0 overflow-hidden">
      <div aria-hidden className="faixa-micareta-textura pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-[1680px] grid-cols-1 items-center gap-2 px-4 py-2 sm:grid-cols-[1fr_auto_1fr] sm:gap-4 lg:h-24 lg:px-6 lg:py-0">
        <Link href="/" className="flex justify-center sm:justify-start" aria-label="Micareta de Feira 2026 — Visão Geral">
          <Image
            src="/brand/logo-micareta-2026.png"
            alt="Micareta de Feira 2026"
            width={443}
            height={323}
            priority
            className="h-16 w-auto lg:h-20"
          />
        </Link>
        <Suspense fallback={<Abas qs="" />}>
          <AbasComFiltro />
        </Suspense>
        <div className="hidden sm:block" />
      </div>
    </header>
  );
}
