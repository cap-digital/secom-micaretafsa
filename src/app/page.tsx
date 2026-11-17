import { Suspense } from "react";
import { connection } from "next/server";
import { carregarDashboard } from "@/lib/dashboard";
import { fmtBRL, fmtBRL0, fmtCompacto, fmtInt, fmtPct } from "@/lib/formato";
import { CabecalhoProjeto } from "@/components/CabecalhoProjeto";
import { KpiCard } from "@/components/KpiCard";
import { ProgressoMeta } from "@/components/ProgressoMeta";
import { GraficoDiario } from "@/components/GraficoDiario";
import { CardEstrategia } from "@/components/CardEstrategia";
import { Carregando, EstadoVazio } from "@/components/EstadoVazio";

export default function Page() {
  return (
    <Suspense fallback={<Carregando />}>
      <VisaoGeral />
    </Suspense>
  );
}

async function VisaoGeral() {
  await connection(); // dados vivos: renderiza por requisição; cache só nos dados crus (≤ 5 min)
  const r = await carregarDashboard();
  if (r.estado === "vazio") return <EstadoVazio titulo={r.titulo} mensagem={r.mensagem} />;

  const d = r.payload;
  const k = d.kpis;
  const aguardando = k.aguardandoDados ? "Aguardando dados" : null;

  return (
    <div className="mx-auto flex w-full max-w-[1680px] min-h-0 flex-1 flex-col gap-3 p-4 lg:px-6 lg:py-4">
      <CabecalhoProjeto dados={d} aviso={r.aviso} />

      <section className="grid shrink-0 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Indicadores">
        <KpiCard rotulo="Investimento contratado" valor={fmtBRL0(k.contratado)} detalhe="valor bruto do PI" />
        <KpiCard
          rotulo="Investido"
          valor={fmtBRL0(k.investido)}
          detalhe={`${fmtPct(d.progresso.pctInvestido)} do contratado`}
          destaque
        />
        <KpiCard rotulo="Restante" valor={fmtBRL0(k.restante)} detalhe={`${d.progresso.diasRestantes} dias restantes`} />
        <KpiCard
          rotulo="Impressões"
          valor={aguardando ?? fmtInt(k.impressoes)}
          detalhe={
            k.alcance
              ? `alcance ${fmtCompacto(k.alcance)} · freq. ${k.frequencia?.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}`
              : k.impressoesVisiveis !== null
                ? `${fmtCompacto(k.impressoesVisiveis)} visíveis`
                : undefined
          }
        />
        <KpiCard
          rotulo="CPM bruto"
          valor={aguardando ?? fmtBRL(k.cpmRealizado)}
          detalhe={`contratado ${fmtBRL(k.cpmContratado)}`}
        />
        <KpiCard
          rotulo="Cliques / CTR"
          valor={aguardando ?? fmtInt(k.cliques)}
          detalhe={k.ctr !== null ? `CTR ${fmtPct(k.ctr, 2)}` : undefined}
        />
      </section>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-12">
        <div className="min-h-0 lg:col-span-4">
          <ProgressoMeta progresso={d.progresso} kpi={k.kpiPrincipal} />
        </div>
        <div className="flex min-h-0 flex-col gap-3 lg:col-span-8">
          <div className="min-h-0 flex-1">
            <GraficoDiario serie={d.serie} />
          </div>
          {d.estrategias.map((e) => (
            <CardEstrategia key={e.chave} e={e} />
          ))}
        </div>
      </div>
    </div>
  );
}
