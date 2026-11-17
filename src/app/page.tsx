import { Suspense } from "react";
import { connection } from "next/server";
import { carregarDashboard } from "@/lib/dashboard";
import { fmtData } from "@/lib/formato";
import { TituloPagina } from "@/components/TituloPagina";
import { Hero } from "@/components/Hero";
import { PorDia } from "@/components/PorDia";
import { Complementares } from "@/components/Complementares";
import { RitmoMeta } from "@/components/RitmoMeta";
import { Genero } from "@/components/Genero";
import { Idade } from "@/components/Idade";
import { Carregando, EstadoVazio } from "@/components/EstadoVazio";

function Secao({ children }: { children: React.ReactNode }) {
  return <p className="-mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-sobre-laranja/75">{children}</p>;
}

export default function Page() {
  return (
    <Suspense fallback={<Carregando />}>
      <VisaoGeral />
    </Suspense>
  );
}

async function VisaoGeral() {
  await connection(); // por requisição; cache só nos dados crus (≤ 5 min)
  const r = await carregarDashboard();
  if (r.estado === "vazio") return <EstadoVazio titulo={r.titulo} mensagem={r.mensagem} />;
  const d = r.payload;

  return (
    <main className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col gap-4 px-4 py-5 lg:px-8">
      <TituloPagina titulo="Visão Geral" periodo={d.periodo} />
      {r.aviso && <p className="rounded-xl bg-white/90 px-3 py-2 text-xs text-texto">{r.aviso}</p>}

      <Secao>
        Contrato · {fmtData(d.projeto.dataInicio)} a {fmtData(d.projeto.dataFim)}
      </Secao>
      <Hero p={d.progresso} projeto={d.projeto} />

      <Secao>
        Desempenho · {fmtData(d.periodo.de)} a {fmtData(d.periodo.ate)}
      </Secao>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <PorDia serie={d.serie} aguardando={d.kpis.aguardandoDados} />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <Complementares c={d.complementares} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0 md:col-span-2 xl:col-span-1">
          <RitmoMeta ritmo={d.ritmo} />
        </div>
        <Genero linhas={d.publico.genero} />
        <Idade linhas={d.publico.idade} />
      </div>
    </main>
  );
}
