import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { carregarDashboard } from "@/lib/dashboard";
import { CabecalhoProjeto } from "@/components/CabecalhoProjeto";
import { GridCriativos } from "@/components/GridCriativos";
import { Carregando, EstadoVazio } from "@/components/EstadoVazio";

export const metadata: Metadata = { title: "Criativos · Micareta de Feira 2026" };

export default function Page() {
  return (
    <Suspense fallback={<Carregando />}>
      <Criativos />
    </Suspense>
  );
}

async function Criativos() {
  await connection();
  const r = await carregarDashboard();
  if (r.estado === "vazio") return <EstadoVazio titulo={r.titulo} mensagem={r.mensagem} />;
  const d = r.payload;

  return (
    <div className="mx-auto flex w-full max-w-[1680px] min-h-0 flex-1 flex-col gap-3 p-4 lg:px-6 lg:py-4">
      <CabecalhoProjeto dados={d} aviso={r.aviso} />
      {d.criativos.length ? (
        <GridCriativos criativos={d.criativos} />
      ) : (
        <EstadoVazio
          titulo="Aguardando dados"
          mensagem="Os criativos aparecem aqui assim que a plataforma registrar veiculação."
        />
      )}
    </div>
  );
}
