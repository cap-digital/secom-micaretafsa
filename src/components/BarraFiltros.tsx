"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Periodo, Preset } from "@/lib/tipos";
import { fmtData } from "@/lib/formato";

function somarDias(iso: string, n: number): string {
  const t = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + n * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}
const limitar = (d: string, min: string, max: string) => (d < min ? min : d > max ? max : d);

const PRESETS: { id: Exclude<Preset, "personalizado">; rotulo: string }[] = [
  { id: "ontem", rotulo: "Ontem" },
  { id: "7d", rotulo: "Últimos 7 dias" },
  { id: "tudo", rotulo: "Todo o período" },
];

/**
 * Linha abaixo do header: título da página à esquerda; à direita o filtro de
 * período (presets, intervalo, atualizar) e controles extras (ex.: ordenar).
 * O filtro vai na URL (?de=&ate=), valendo para as duas abas.
 */
export function BarraFiltros({
  titulo,
  subtitulo,
  periodo,
  extra,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  periodo: Periodo;
  extra?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [carregando, iniciar] = useTransition();
  const chave = `${periodo.de}|${periodo.ate}`;
  const [rascunho, setRascunho] = useState({ chave, de: periodo.de, ate: periodo.ate });
  if (rascunho.chave !== chave) setRascunho({ chave, de: periodo.de, ate: periodo.ate });

  const ir = (de: string, ate: string) => {
    const [a, b] = de <= ate ? [de, ate] : [ate, de];
    const tudo = a === periodo.minimo && b === periodo.maximo;
    iniciar(() => router.push(`${pathname}${tudo ? "" : `?de=${a}&ate=${b}`}`));
  };
  const aplicarPreset = (p: Exclude<Preset, "personalizado">) => {
    const { minimo: mn, maximo: mx, hoje } = periodo;
    if (p === "tudo") return ir(mn, mx);
    if (p === "ontem") {
      const o = limitar(somarDias(hoje, -1), mn, mx);
      return ir(o, o);
    }
    ir(limitar(somarDias(hoje, -6), mn, mx), limitar(hoje, mn, mx));
  };

  return (
    <div className="flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-base font-semibold text-texto">{titulo}</h1>
        <p className="text-[11px] text-texto-3">
          {subtitulo ?? `${fmtData(periodo.de)} a ${fmtData(periodo.ate)} · valores em bruto`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {extra}
        <div
          className="flex items-center rounded-full border border-borda bg-white p-0.5"
          role="group"
          aria-label="Períodos rápidos"
        >
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => aplicarPreset(p.id)}
              aria-pressed={periodo.preset === p.id}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                periodo.preset === p.id ? "bg-azul text-white" : "text-texto-2 hover:text-texto"
              }`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <form
            className="flex items-center gap-1 rounded-full border border-borda bg-white py-0.5 pl-3 pr-1"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (rascunho.de && rascunho.ate) ir(rascunho.de, rascunho.ate);
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
              className="num w-[7.4rem] bg-transparent text-xs text-texto outline-none"
            />
            <span className="text-texto-3">–</span>
            <input
              type="date"
              aria-label="Data final"
              value={rascunho.ate}
              min={periodo.minimo}
              max={periodo.maximo}
              onChange={(e) => setRascunho((r) => ({ ...r, ate: e.target.value }))}
              className="num w-[7.4rem] bg-transparent text-xs text-texto outline-none"
            />
            <button
              type="submit"
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-azul hover:bg-azul-suave disabled:text-texto-3 disabled:hover:bg-transparent"
              disabled={rascunho.de === periodo.de && rascunho.ate === periodo.ate}
            >
              Aplicar
            </button>
          </form>

          <button
            type="button"
            onClick={() => iniciar(() => router.refresh())}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-borda bg-white text-texto-2 hover:text-azul"
            aria-label="Atualizar dados"
            title="Atualizar"
          >
            <svg
              viewBox="0 0 20 20"
              className={`h-3.5 w-3.5 ${carregando ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6M16.5 3.5v3.9h-3.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
