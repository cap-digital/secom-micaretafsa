import type { DashboardPayload, StatusRitmo } from "@/lib/tipos";
import { fmtBRL, fmtBRL0, fmtCompacto, fmtInt, fmtPct } from "@/lib/formato";

const COR_RITMO: Record<StatusRitmo, { fundo: string; icone: string }> = {
  "No ritmo": { fundo: "bg-lima text-preto", icone: "●" },
  Acima: { fundo: "bg-laranja text-preto", icone: "▲" },
  Abaixo: { fundo: "bg-rosa text-white", icone: "▼" },
};

function Barra({
  rotulo,
  valorTexto,
  totalTexto,
  pct,
  pctIdeal,
  rotuloIdeal,
  cor,
}: {
  rotulo: string;
  valorTexto: string;
  totalTexto: string;
  pct: number | null;
  pctIdeal: number;
  rotuloIdeal: string;
  cor: string;
}) {
  const largura = Math.min(100, Math.max(0, pct ?? 0));
  const ideal = Math.min(100, Math.max(0, pctIdeal));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/85">{rotulo}</p>
        <p className="titulo-display num text-2xl text-limao">{fmtPct(pct)}</p>
      </div>
      <div
        className="relative mt-1.5 h-5 rounded-full bg-preto/35 ring-1 ring-white/15"
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(largura)}
      >
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${largura}%` }} />
        <div
          className="absolute -top-1.5 -bottom-1.5 w-0.5 rounded bg-white"
          style={{ left: `calc(${ideal}% - 1px)` }}
          title={rotuloIdeal}
        >
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
        </div>
      </div>
      <div className="mt-1 flex justify-between gap-2 text-xs text-white/85">
        <span className="num">
          <strong className="font-semibold text-white">{valorTexto}</strong> de {totalTexto}
        </span>
        <span className="num">{rotuloIdeal}</span>
      </div>
    </div>
  );
}

/**
 * Progresso da Meta — componente reutilizável.
 * Recebe o bloco `progresso` do payload (tudo em bruto).
 */
export function ProgressoMeta({ progresso, kpi = "CPM" }: { progresso: DashboardPayload["progresso"]; kpi?: string }) {
  const p = progresso;
  const ritmo = COR_RITMO[p.status];
  const unidade = kpi === "CPM" ? "impressões" : "resultados";
  const pctEntregaIdeal = p.meta > 0 ? (p.entregaIdealAteHoje / p.meta) * 100 : 0;

  return (
    <section className="listras relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-preto p-5 text-white shadow-[5px_5px_0_var(--preto)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-roxo/40 via-roxo/75 to-roxo-escuro/95" />
      <div className="relative flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">Progresso da meta</p>
            <h2 className="titulo-display mt-1 text-[2.6rem] text-white">
              <span className="num">{fmtCompacto(p.entregue)}</span>
              <span className="text-xl text-white/80"> / {fmtCompacto(p.meta)}</span>
            </h2>
            <p className="text-xs text-white/85">{unidade} entregues · meta contratada</p>
          </div>
          <span
            className={`titulo-display flex shrink-0 items-center gap-1.5 rounded-md border-2 border-preto px-2.5 py-1.5 text-base ${ritmo.fundo} shadow-[3px_3px_0_var(--preto)]`}
          >
            <span aria-hidden className="text-xs">
              {ritmo.icone}
            </span>
            {p.status}
          </span>
        </div>

        <Barra
          rotulo={`Meta de ${unidade}`}
          valorTexto={fmtInt(p.entregue)}
          totalTexto={fmtInt(p.meta)}
          pct={p.pctMeta}
          pctIdeal={pctEntregaIdeal}
          rotuloIdeal={`ideal hoje ${fmtCompacto(p.entregaIdealAteHoje)}`}
          cor="bg-limao"
        />
        <Barra
          rotulo="Investimento bruto"
          valorTexto={fmtBRL0(p.investido)}
          totalTexto={fmtBRL0(p.contratado)}
          pct={p.pctInvestido}
          pctIdeal={p.pctIdeal}
          rotuloIdeal={`ideal hoje ${fmtBRL0(p.idealAteHoje)}`}
          cor="bg-laranja"
        />

        <div className="mt-auto grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-white/95 px-3 py-2 text-preto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-texto-2">Dias restantes</p>
            <p className="titulo-display num text-2xl">{p.diasRestantes}</p>
            <p className="text-[10px] text-texto-3">
              dia {p.diasPassados} de {p.diasTotais}
            </p>
          </div>
          <div className="col-span-2 rounded-lg bg-white/95 px-3 py-2 text-preto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-texto-2">Bruto por dia necessário</p>
            <p className="titulo-display num text-2xl">{p.diasRestantes > 0 ? fmtBRL(p.brutoPorDiaNecessario) : "—"}</p>
            <p className="text-[10px] text-texto-3">
              ritmo: realizado {fmtBRL0(p.investido)} vs ideal {fmtBRL0(p.idealAteHoje)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
