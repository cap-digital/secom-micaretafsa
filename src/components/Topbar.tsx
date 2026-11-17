"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Periodo, Preset } from "@/lib/tipos";
import { rotuloStatus } from "@/lib/formato";

const ABAS = [
  { href: "/", rotulo: "Visão Geral" },
  { href: "/criativos", rotulo: "Criativos" },
] as const;

function somarDias(iso: string, n: number): string {
  const t = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + n * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}
const limitar = (d: string, min: string, max: string) => (d < min ? min : d > max ? max : d);

export function query(periodo: Pick<Periodo, "de" | "ate" | "preset">) {
  return periodo.preset === "tudo" ? "" : `?de=${periodo.de}&ate=${periodo.ate}`;
}

export function Topbar({
  periodo,
  atualizadoHora,
  status,
}: {
  periodo?: Periodo;
  atualizadoHora?: string;
  status?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [carregando, iniciar] = useTransition();
  // rascunho do seletor; sincroniza com a URL quando o período muda (padrão "estado derivado")
  const chave = periodo ? `${periodo.de}|${periodo.ate}` : "";
  const [rascunho, setRascunho] = useState({ chave, de: periodo?.de ?? "", ate: periodo?.ate ?? "" });
  if (periodo && rascunho.chave !== chave) setRascunho({ chave, de: periodo.de, ate: periodo.ate });

  const qs = periodo ? query(periodo) : "";

  const ir = (de: string, ate: string) => {
    if (!periodo) return;
    const tudo = de === periodo.minimo && ate === periodo.maximo;
    iniciar(() => router.push(`${pathname}${tudo ? "" : `?de=${de}&ate=${ate}`}`));
  };
  const aplicarPreset = (p: Exclude<Preset, "personalizado">) => {
    if (!periodo) return;
    const { minimo: mn, maximo: mx, hoje } = periodo;
    if (p === "tudo") return ir(mn, mx);
    if (p === "ontem") {
      const o = limitar(somarDias(hoje, -1), mn, mx);
      return ir(o, o);
    }
    ir(limitar(somarDias(hoje, -6), mn, mx), limitar(hoje, mn, mx));
  };

  const presets: { id: Exclude<Preset, "personalizado">; rotulo: string }[] = [
    { id: "ontem", rotulo: "Ontem" },
    { id: "7d", rotulo: "Últimos 7 dias" },
    { id: "tudo", rotulo: "Todo o período" },
  ];

  return (
    <header className="sticky top-0 z-[1000] shrink-0 border-b border-borda bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 lg:h-14 lg:flex-nowrap lg:px-6 lg:py-0">
        <Link href={`/${qs}`} className="flex shrink-0 items-center gap-2" aria-label="Micareta de Feira 2026">
          <Image
            src="/brand/logo-micareta.png"
            alt="Micareta de Feira 2026"
            width={106}
            height={90}
            priority
            className="h-9 w-auto rounded-md"
          />
        </Link>

        <nav className="flex items-center gap-1" aria-label="Seções">
          {ABAS.map((aba) => {
            const ativa = aba.href === "/" ? pathname === "/" : pathname.startsWith(aba.href);
            return (
              <Link
                key={aba.href}
                href={`${aba.href}${qs}`}
                aria-current={ativa ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  ativa ? "bg-roxo text-white" : "text-texto-2 hover:bg-fundo hover:text-texto"
                }`}
              >
                {aba.rotulo}
              </Link>
            );
          })}
        </nav>

        {periodo && (
          <div className="order-last flex w-full flex-wrap items-center gap-2 lg:order-none lg:ml-auto lg:w-auto lg:flex-nowrap">
            <div className="flex items-center rounded-lg border border-borda bg-fundo p-0.5" role="group" aria-label="Períodos rápidos">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => aplicarPreset(p.id)}
                  aria-pressed={periodo.preset === p.id}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    periodo.preset === p.id ? "bg-roxo text-white shadow-sm" : "text-texto-2 hover:text-texto"
                  }`}
                >
                  {p.rotulo}
                </button>
              ))}
            </div>

            <form
              className="flex items-center gap-1 rounded-lg border border-borda bg-white px-2 py-0.5"
              onSubmit={(ev) => {
                ev.preventDefault();
                if (rascunho.de && rascunho.ate) ir(rascunho.de <= rascunho.ate ? rascunho.de : rascunho.ate, rascunho.de <= rascunho.ate ? rascunho.ate : rascunho.de);
              }}
              aria-label="Intervalo de datas"
            >
              <input
                type="date"
                aria-label="Data inicial"
                value={rascunho.de}
                min={periodo.minimo}
                max={periodo.maximo}
                onChange={(e) => setRascunho((r) => ({ ...r, de: e.target.value }))}
                className="num bg-transparent text-xs text-texto outline-none"
              />
              <span className="text-texto-3">–</span>
              <input
                type="date"
                aria-label="Data final"
                value={rascunho.ate}
                min={periodo.minimo}
                max={periodo.maximo}
                onChange={(e) => setRascunho((r) => ({ ...r, ate: e.target.value }))}
                className="num bg-transparent text-xs text-texto outline-none"
              />
              <button
                type="submit"
                className="ml-1 rounded-md px-2 py-0.5 text-xs font-medium text-roxo hover:bg-roxo-suave"
                disabled={rascunho.de === periodo.de && rascunho.ate === periodo.ate}
              >
                Aplicar
              </button>
            </form>

            <button
              type="button"
              onClick={() => iniciar(() => router.refresh())}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-borda bg-white text-texto-2 hover:text-roxo"
              aria-label="Atualizar dados"
              title="Atualizar"
            >
              <svg viewBox="0 0 20 20" className={`h-3.5 w-3.5 ${carregando ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6M16.5 3.5v3.9h-3.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {atualizadoHora && (
              <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-borda bg-white px-2.5 py-1 text-xs text-texto-2">
                <span className={`h-1.5 w-1.5 rounded-full ${status === "encerrado" ? "bg-texto-3" : "bg-[#3f9d1f]"}`} />
                {status ? rotuloStatus(status) : ""} · Atualizado às {atualizadoHora}
              </span>
            )}
          </div>
        )}

        <Image
          src="/brand/governo-bahia.png"
          alt="Governo da Bahia"
          width={145}
          height={53}
          className="ml-auto h-7 w-auto lg:ml-0"
        />
      </div>
    </header>
  );
}
