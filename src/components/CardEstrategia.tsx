import type { EstrategiaPayload } from "@/lib/tipos";
import { fmtBRL, fmtBRL0, fmtCompacto, fmtData, fmtPct, rotuloStatus } from "@/lib/formato";

export function CardEstrategia({ e }: { e: EstrategiaPayload }) {
  const custo = e.kpi === "CPM" ? "CPM" : `Custo por ${e.kpi.replace(/^CP/, "").toLowerCase() || "resultado"}`;
  return (
    <article className="listras-suaves rounded-2xl border border-borda bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-violeta px-2 py-0.5 text-[11px] font-semibold text-white">{e.plataformaRotulo}</span>
        <h3 className="titulo-display text-xl text-preto">{e.nome}</h3>
        <span className="rounded-md border border-preto px-1.5 py-0.5 text-[11px] font-bold text-preto">KPI {e.kpi}</span>
        <span className="rounded-md bg-limao px-2 py-0.5 text-[11px] font-bold uppercase text-preto">
          {rotuloStatus(e.status)}
        </span>
        <span className="text-xs text-texto-3">desde {fmtData(e.dataInicio)}</span>
      </div>
      {e.segmentacao && <p className="mt-1 text-xs text-texto-2">{e.segmentacao}</p>}

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-texto-3">Contratado</dt>
          <dd className="num font-semibold">{fmtBRL0(e.valorBruto)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-texto-3">Investido</dt>
          <dd className="num font-semibold">{e.aguardandoDados ? "Aguardando dados" : fmtBRL(e.investido)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-texto-3">Entrega / meta</dt>
          <dd className="num font-semibold">
            {e.aguardandoDados ? "Aguardando dados" : `${fmtCompacto(e.entregue)} / ${fmtCompacto(e.meta)}`}
            {!e.aguardandoDados && <span className="ml-1 text-xs text-roxo">({fmtPct(e.pctMeta)})</span>}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-texto-3">{custo} bruto</dt>
          <dd className="num font-semibold">
            {e.aguardandoDados ? "—" : fmtBRL(e.custoRealizado)}
            <span className="ml-1 text-xs font-normal text-texto-3">contratado {fmtBRL(e.custoContratado)}</span>
          </dd>
        </div>
      </dl>
    </article>
  );
}
