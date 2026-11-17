import { Suspense } from "react";
import { carregarDashboard } from "@/lib/dashboard";
import { Topbar } from "@/components/Topbar";
import { Kpis } from "@/components/Kpis";
import { PorDia } from "@/components/PorDia";
import { ProgressoMeta } from "@/components/ProgressoMeta";
import { Publico } from "@/components/Publico";
import { MapaPracas } from "@/components/MapaPracas";
import { RankingPracas } from "@/components/RankingPracas";
import { Carregando, EstadoVazio } from "@/components/EstadoVazio";

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
      <VisaoGeral searchParams={searchParams} />
    </Suspense>
  );
}

async function VisaoGeral({ searchParams }: { searchParams: Busca }) {
  const sp = await searchParams; // por requisição; cache só nos dados crus (≤ 5 min)
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
        <Kpis k={d.kpis} />

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-3">
          <div className="min-h-0 lg:col-span-2">
            <PorDia serie={d.serie} aguardando={d.kpis.aguardandoDados} />
          </div>
          <div className="min-h-0">
            <ProgressoMeta progresso={d.progresso} />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-3">
          <Publico genero={d.publico.genero} idade={d.publico.idade} />
          <MapaPracas pracas={d.pracas.mapa} />
          <RankingPracas linhas={d.pracas.ranking} />
        </div>
      </main>
    </>
  );
}
