import type { ReactNode } from "react";
import type { DashboardPayload, StatusRitmo } from "@/lib/tipos";
import { fmtBRL, fmtCompacto, fmtInt, fmtPct } from "@/lib/formato";
import { Painel } from "./Painel";

const BADGE_RITMO: Record<StatusRitmo, { classe: string; icone: string }> = {
  "No ritmo": { classe: "bg-amarelo text-texto", icone: "●" },
  Acima: { classe: "bg-azul-suave text-azul", icone: "▲" },
  Abaixo: { classe: "bg-laranja-suave text-laranja-escuro", icone: "▼" },
};

/**
 * Barra de progresso em largura total: trilho cinza claro, preenchimento
 * colorido e marcador "ideal hoje" (traço escuro que passa um pouco do
 * trilho, sem encostar nos textos, que ficam acima e abaixo com folga).
 */
function Barra({
  rotulo,
  pct,
  pctIdeal,
  cor,
  esquerda,
  direita,
}: {
  rotulo: string;
  pct: number | null;
  pctIdeal: number;
  cor: string;
  esquerda: ReactNode;
  direita: ReactNode;
}) {
  const w = Math.min(100, Math.max(0, pct ?? 0));
  const ideal = Math.min(100, Math.max(0, pctIdeal));
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-2">
        <span className="rotulo">{rotulo}</span>
        <span className="num text-[15px] font-semibold text-texto">{fmtPct(pct)}</span>
      </div>
      <div className="relative mt-1.5 py-1">
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-trilho"
          role="progressbar"
          aria-label={rotulo}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(w)}
        >
          <div className="h-full rounded-full" style={{ width: `${w}%`, background: cor }} />
        </div>
        <span
          aria-hidden
          className="absolute top-0 bottom-0 w-[3px] -translate-x-1/2 rounded-full bg-texto ring-2 ring-white"
          style={{ left: `${ideal}%` }}
        />
      </div>
      <div className="num mt-1 flex flex-wrap justify-between gap-x-3 text-[11px] text-texto-3">
        <span>{esquerda}</span>
        <span>{direita}</span>
      </div>
    </div>
  );
}

/** Progresso da meta — sempre sobre o período inteiro (independe do filtro). */
export function ProgressoMeta({ progresso: p }: { progresso: DashboardPayload["progresso"] }) {
  const badge = BADGE_RITMO[p.status];
  const unidade = p.kpi === "CPM" ? "Impressões" : "Resultados";
  const superada = (p.pctMeta ?? 0) >= 100;
  const pctEntregaIdeal = p.meta > 0 ? (p.entregaIdealAteHoje / p.meta) * 100 : 0;

  return (
    <Painel
      titulo="Progresso da meta"
      subtitulo="período completo do contrato"
      className="h-full"
      acoes={
        <div className="flex items-center gap-1.5">
          {superada && (
            <span className="rounded-full bg-amarelo px-2 py-0.5 text-[11px] font-semibold text-texto">Meta superada</span>
          )}
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.classe}`}>
            <span aria-hidden className="text-[8px]">
              {badge.icone}
            </span>
            {p.status}
          </span>
        </div>
      }
      corpoClassName="justify-between gap-2"
    >
      <p className="num text-2xl font-semibold leading-none tracking-tight text-texto">
        {fmtCompacto(p.entregue)}
        <span className="text-sm font-normal text-texto-3">
          {" "}
          / {fmtCompacto(p.meta)} {unidade.toLowerCase()}
        </span>
      </p>

      <Barra
        rotulo={`${unidade} entregues × meta`}
        pct={p.pctMeta}
        pctIdeal={pctEntregaIdeal}
        cor="var(--azul)"
        esquerda={`${fmtInt(p.entregue)} de ${fmtInt(p.meta)}`}
        direita={`ideal hoje ${fmtCompacto(p.entregaIdealAteHoje)}`}
      />
      <Barra
        rotulo="Investido × contratado"
        pct={p.pctInvestido}
        pctIdeal={p.pctIdeal}
        cor="var(--laranja)"
        esquerda={`${fmtBRL(p.investido)} de ${fmtBRL(p.contratado)}`}
        direita={`ideal hoje ${fmtBRL(p.idealAteHoje)}`}
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-fundo px-3 py-1.5">
          <p className="rotulo">Dias restantes</p>
          <p className="num text-base font-semibold leading-tight text-texto">{p.diasRestantes}</p>
          <p className="text-[10px] text-texto-3">
            dia {p.diasPassados} de {p.diasTotais}
          </p>
        </div>
        <div className="rounded-lg bg-fundo px-3 py-1.5">
          <p className="rotulo">Bruto por dia necessário</p>
          <p className="num text-base font-semibold leading-tight text-texto">
            {p.diasRestantes > 0 ? fmtBRL(p.brutoPorDiaNecessario) : "—"}
          </p>
          <p className="flex items-center gap-1 text-[10px] text-texto-3">
            <span aria-hidden className="inline-block h-2.5 w-[3px] rounded-full bg-texto" /> = ideal até hoje
          </p>
        </div>
      </div>
    </Painel>
  );
}
