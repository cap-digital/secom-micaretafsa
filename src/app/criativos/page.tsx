import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { carregarDashboard } from "@/lib/dashboard";
import { Criativos } from "@/components/Criativos";
import { Carregando, EstadoVazio } from "@/components/EstadoVazio";

export const metadata: Metadata = { title: "Criativos · Micareta de Feira 2026" };

export default function Page() {
  return (
    <Suspense fallback={<Carregando />}>
      <PaginaCriativos />
    </Suspense>
  );
}

async function PaginaCriativos() {
  await connection();
  const r = await carregarDashboard();
  if (r.estado === "vazio") return <EstadoVazio titulo={r.titulo} mensagem={r.mensagem} />;
  const d = r.payload;

  return (
    <main className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col gap-4 px-4 py-5 lg:px-8">
      {r.aviso && <p className="shrink-0 rounded-xl bg-white/90 px-3 py-2 text-xs text-texto">{r.aviso}</p>}
      <Criativos criativos={d.criativos} periodo={d.periodo} kpis={d.kpis} />
    </main>
  );
}
