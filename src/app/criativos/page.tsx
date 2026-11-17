import type { Metadata } from "next";
import { Suspense } from "react";
import { carregarDashboard } from "@/lib/dashboard";
import { Topbar } from "@/components/Topbar";
import { Criativos } from "@/components/Criativos";
import { Carregando, EstadoVazio } from "@/components/EstadoVazio";

export const metadata: Metadata = { title: "Criativos · Micareta de Feira 2026" };

type Busca = Promise<Record<string, string | string[] | undefined>>;
const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function Page({ searchParams }: { searchParams: Busca }) {
  return (
    <Suspense
      fallback={
        <>
          <Topbar />
          <Carregando />
        </>
      }
    >
      <PaginaCriativos searchParams={searchParams} />
    </Suspense>
  );
}

async function PaginaCriativos({ searchParams }: { searchParams: Busca }) {
  const sp = await searchParams;
  const r = await carregarDashboard({ de: um(sp.de), ate: um(sp.ate) });
  if (r.estado === "vazio") {
    return (
      <>
        <Topbar />
        <EstadoVazio titulo={r.titulo} mensagem={r.mensagem} />
      </>
    );
  }
  const d = r.payload;

  return (
    <>
      <Topbar periodo={d.periodo} atualizadoHora={d.atualizadoHora} status={d.projeto.status} />
      <main className="mx-auto flex w-full max-w-[1680px] min-h-0 flex-1 flex-col gap-3 p-4 lg:px-6">
        {r.aviso && <p className="shrink-0 rounded-lg bg-magenta-suave px-3 py-1.5 text-xs text-texto">{r.aviso}</p>}
        {d.criativos.length ? (
          <Criativos criativos={d.criativos} />
        ) : (
          <EstadoVazio titulo="Sem veiculação no período" mensagem="Escolha outro intervalo de datas na barra superior." />
        )}
      </main>
    </>
  );
}
