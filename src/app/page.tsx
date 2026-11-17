import { Suspense } from "react";
import { carregarDashboard } from "@/lib/dashboard";
import { BarraFiltros } from "@/components/BarraFiltros";
import { Kpis } from "@/components/Kpis";
import { PorDia } from "@/components/PorDia";
import { ProgressoMeta } from "@/components/ProgressoMeta";
import { Publico } from "@/components/Publico";
import { Pracas } from "@/components/Pracas";
import { Carregando, EstadoVazio } from "@/components/EstadoVazio";

type Busca = Promise<Record<string, string | string[] | undefined>>;
const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Desktop: tudo cabe na altura da tela abaixo do header (h-24); mobile: scroll normal. */
const ALTURA_DESKTOP = "lg:h-[calc(100dvh-6rem)] lg:flex-none lg:overflow-hidden";

export default function Page({ searchParams }: { searchParams: Busca }) {
  return (
    <Suspense fallback={<Carregando />}>
      <VisaoGeral searchParams={searchParams} />
    </Suspense>
  );
}

async function VisaoGeral({ searchParams }: { searchParams: Busca }) {
  const sp = await searchParams; // por requisição; cache só nos dados crus (≤ 5 min)
  const r = await carregarDashboard({ de: um(sp.de), ate: um(sp.ate) });
  if (r.estado === "vazio") return <EstadoVazio titulo={r.titulo} mensagem={r.mensagem} />;
  const d = r.payload;

  return (
    <main className={`mx-auto flex w-full max-w-[1680px] min-h-0 flex-1 flex-col gap-3 p-4 lg:px-6 lg:py-3 ${ALTURA_DESKTOP}`}>
      <BarraFiltros titulo="Visão Geral" periodo={d.periodo} />
      {r.aviso && <p className="shrink-0 rounded-lg bg-amarelo-suave px-3 py-1.5 text-xs text-texto">{r.aviso}</p>}
      <Kpis k={d.kpis} />

      <div className="grid min-h-0 grid-cols-1 gap-3 lg:flex-1 lg:grid-cols-3">
        <div className="min-h-0 lg:col-span-2">
          <PorDia serie={d.serie} aguardando={d.kpis.aguardandoDados} />
        </div>
        <div className="min-h-0">
          <ProgressoMeta progresso={d.progresso} />
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-3 lg:flex-1 lg:grid-cols-2">
        <Publico genero={d.publico.genero} idade={d.publico.idade} />
        <Pracas linhas={d.pracas.linhas} resumo={d.pracas.resumo} />
      </div>
    </main>
  );
}
