import type { ReactNode } from "react";
import type { DashboardPayload } from "@/lib/tipos";
import { fmtBRL, fmtInt, fmtPct } from "@/lib/formato";

function Kpi({ rotulo, valor, detalhe }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-borda bg-card px-4 py-2.5">
      <p className="rotulo truncate">{rotulo}</p>
      <p className="num mt-0.5 truncate text-[22px] font-semibold leading-tight tracking-tight text-texto">{valor}</p>
      <p className="num mt-0.5 truncate text-[11px] text-texto-3">{detalhe ?? " "}</p>
    </div>
  );
}

export function Kpis({ k }: { k: DashboardPayload["kpis"] }) {
  const ag = k.aguardandoDados ? "Aguardando dados" : null;
  return (
    <section className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" aria-label="Indicadores do período">
      <Kpi rotulo="Investido bruto" valor={fmtBRL(k.investido)} detalhe={`contratado ${fmtBRL(k.contratado)}`} />
      <Kpi rotulo="Impressões" valor={ag ?? fmtInt(k.impressoes)} />
      <Kpi rotulo="Cliques" valor={ag ?? fmtInt(k.cliques)} />
      <Kpi
        rotulo="CPM bruto"
        valor={ag ?? fmtBRL(k.cpmRealizado)}
        detalhe={
          <>
            real × contratado <span className="text-texto-2">{fmtBRL(k.cpmContratado)}</span>
          </>
        }
      />
      <Kpi rotulo="CPC bruto" valor={ag ?? fmtBRL(k.cpc)} />
      <Kpi rotulo="CTR" valor={ag ?? fmtPct(k.ctr, 2)} />
    </section>
  );
}
