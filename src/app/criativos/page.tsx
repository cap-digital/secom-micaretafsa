import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { carregarDashboard } from "@/lib/dashboard";
import { Header } from "@/components/Header";
import { Criativos } from "@/components/Criativos";
import { EstadoVazio } from "@/components/EstadoVazio";

export const metadata: Metadata = { title: "Criativos · Micareta de Feira 2026 · Dashboard" };

export default function Page() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <div className="pad-tela flex-1" aria-busy="true">
            <div className="h-full min-h-64 animate-pulse rounded-[clamp(16px,1.2vw,26px)] bg-white/45" />
          </div>
        </>
      }
    >
      <PaginaCriativos />
    </Suspense>
  );
}

async function PaginaCriativos() {
  await connection();
  const r = await carregarDashboard();
  if (r.estado === "vazio") {
    return (
      <>
        <Header />
        <EstadoVazio titulo={r.titulo} mensagem={r.mensagem} />
      </>
    );
  }
  const d = r.payload;

  return (
    <>
      <Header periodo={d.periodo} aviso={r.aviso} />
      <main className="pad-tela flex w-full flex-1 flex-col lg:min-h-0">
        <Criativos criativos={d.criativos} periodo={d.periodo} kpis={d.kpis} />
      </main>
    </>
  );
}
