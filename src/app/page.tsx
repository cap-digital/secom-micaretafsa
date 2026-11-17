import { Suspense } from "react";
import { connection } from "next/server";
import { carregarDashboard } from "@/lib/dashboard";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { PorDia } from "@/components/PorDia";
import { Complementares } from "@/components/Complementares";
import { RitmoMeta } from "@/components/RitmoMeta";
import { Genero } from "@/components/Genero";
import { Idade } from "@/components/Idade";
import { Carregando, EstadoVazio } from "@/components/EstadoVazio";

export default function Page() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <Carregando />
        </>
      }
    >
      <VisaoGeral />
    </Suspense>
  );
}

async function VisaoGeral() {
  await connection(); // por requisição; cache só nos dados crus (≤ 5 min)
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
      {/*
        ≥ lg: grid de altura total (hero 0.9fr · meio 1.6fr · baixo 1.5fr), sem scroll.
        < lg: blocos empilhados com scroll normal.
      */}
      <main className="pad-tela gap-fluido grid w-full flex-1 grid-cols-1 lg:min-h-0 lg:grid-rows-[0.9fr_1.6fr_1.5fr]">
        <Hero p={d.progresso} projeto={d.projeto} />

        <div className="gap-fluido grid min-h-0 grid-cols-1 lg:grid-cols-5">
          <div className="flex min-h-0 min-w-0 flex-col lg:col-span-3">
            <PorDia serie={d.serie} aguardando={d.kpis.aguardandoDados} />
          </div>
          <div className="flex min-h-0 min-w-0 flex-col lg:col-span-2">
            <Complementares c={d.complementares} />
          </div>
        </div>

        <div className="gap-fluido grid min-h-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex min-h-0 min-w-0 flex-col md:col-span-2 lg:col-span-1">
            <RitmoMeta ritmo={d.ritmo} />
          </div>
          <div className="flex min-h-0 min-w-0 flex-col">
            <Genero linhas={d.publico.genero} medias={{ cpm: d.kpis.cpmRealizado, cpc: d.kpis.cpc }} />
          </div>
          <div className="flex min-h-0 min-w-0 flex-col">
            <Idade linhas={d.publico.idade} medias={{ cpm: d.kpis.cpmRealizado, cpc: d.kpis.cpc }} />
          </div>
        </div>
      </main>
    </>
  );
}
