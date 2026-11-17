import type { ReactNode } from "react";
import type { DashboardPayload } from "@/lib/tipos";
import { COR } from "@/lib/cores";
import { fmtBRL, fmtBRL0, fmtData, fmtInt, fmtPct } from "@/lib/formato";
import { BarraProgresso } from "./BarraProgresso";
import { Numero } from "./Numero";
import { Badge } from "./Painel";

/** Card de destaque: altura vem do grid; conteúdo distribuído verticalmente. */
function CardHero({ rotulo, badge, children }: { rotulo: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <section className="card pad-card flex min-h-0 min-w-0 flex-col justify-between gap-[clamp(0.2rem,0.6vh,0.7rem)]">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <p className="rotulo">{rotulo}</p>
        {badge}
      </div>
      {children}
    </section>
  );
}

const sinal = (v: number) => `${v >= 0 ? "+" : "−"}${fmtPct(Math.abs(v))}`;

/** Linha de destaque (contrato): impressões × meta, investido × contratado, CPM e ritmo. */
export function Hero({ p, projeto }: { p: DashboardPayload["progresso"]; projeto: DashboardPayload["projeto"] }) {
  const unidade = p.kpi === "CPM" ? "impressões" : "resultados";
  const pctEntregaIdeal = p.meta > 0 ? (p.entregaIdealAteHoje / p.meta) * 100 : 0;
  const ritmoEntrega =
    p.entregue !== null && p.entregaIdealAteHoje > 0 ? (p.entregue / p.entregaIdealAteHoje - 1) * 100 : null;
  const superada = (p.pctMeta ?? 0) >= 100;
  const varCpm = p.cpmRealizado !== null && p.cpmContratado ? (p.cpmRealizado / p.cpmContratado - 1) * 100 : null;
  const ritmoInvest = p.idealAteHoje > 0 ? (p.investido / p.idealAteHoje) * 100 : null;
  const saldo = Math.max(0, p.contratado - p.investido);

  const badgeEntrega = superada ? (
    <Badge fundo={COR.amarelo} cor={COR.texto}>
      ★ Meta superada
    </Badge>
  ) : ritmoEntrega !== null ? (
    <Badge fundo={ritmoEntrega >= 0 ? COR.verdeSuave : COR.laranjaSuave} cor={ritmoEntrega >= 0 ? COR.verde : COR.laranjaEscuro}>
      {ritmoEntrega >= 0 ? "▲" : "▼"} {sinal(ritmoEntrega)} {ritmoEntrega >= 0 ? "acima" : "abaixo"} do ritmo
    </Badge>
  ) : null;

  // CPM abaixo do contratado é bom (verde); acima, alerta
  const badgeCpm =
    varCpm === null ? null : (
      <Badge fundo={varCpm <= 0 ? COR.verdeSuave : COR.vermelhoSuave} cor={varCpm <= 0 ? COR.verde : COR.vermelho}>
        {varCpm <= 0 ? "↘" : "↗"} {sinal(varCpm)}
      </Badge>
    );

  const corRitmo = p.status === "Abaixo" ? COR.laranjaEscuro : p.status === "Acima" ? COR.azul : COR.verde;
  const badgeRitmo =
    p.status === "No ritmo" ? (
      <Badge fundo={COR.amarelo} cor={COR.texto}>
        ● No ritmo
      </Badge>
    ) : (
      <Badge fundo={p.status === "Acima" ? COR.azulSuave : COR.laranjaSuave} cor={corRitmo}>
        {p.status === "Acima" ? "▲ Acima" : "▼ Abaixo"}
      </Badge>
    );

  return (
    <div className="gap-fluido grid min-h-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <CardHero rotulo={`${unidade} entregues`} badge={badgeEntrega}>
        <Numero valor={p.entregue} formato="int" className="font-display fs-kpi font-extrabold" style={{ color: COR.azul }} />
        <p className="num fs-mini text-texto-2">
          de {fmtInt(p.meta)} contratadas · <strong className="text-texto">{fmtPct(p.pctMeta)}</strong> da meta
        </p>
        <div>
          <BarraProgresso pct={p.pctMeta} pctIdeal={pctEntregaIdeal} cor={COR.azul} rotulo="Entrega da meta" />
          <p className="num fs-mini text-texto-3">
            <span aria-hidden className="mr-1 inline-block h-[0.8em] w-[3px] rounded-full align-[-1px]" style={{ background: COR.texto }} />
            ideal hoje {fmtInt(p.entregaIdealAteHoje)}
          </p>
        </div>
      </CardHero>

      <CardHero rotulo="Investido (bruto)">
        <Numero valor={p.investido} formato="brl" className="font-display fs-kpi font-extrabold" style={{ color: COR.laranjaEscuro }} />
        <p className="num fs-mini text-texto-2">
          de {fmtBRL0(p.contratado)} · saldo <strong className="text-texto">{fmtBRL(saldo)}</strong>
        </p>
        <div>
          <BarraProgresso pct={p.pctInvestido} pctIdeal={p.pctIdeal} cor={COR.laranja} rotulo="Investido do contratado" />
          <p className="num fs-mini flex flex-wrap justify-between gap-x-2 text-texto-3">
            <span>
              <strong className="text-texto">{fmtPct(p.pctInvestido)}</strong> do contratado
            </span>
            <span>ideal hoje {fmtBRL0(p.idealAteHoje)}</span>
          </p>
        </div>
      </CardHero>

      <CardHero rotulo="CPM bruto realizado" badge={badgeCpm}>
        <Numero valor={p.cpmRealizado} formato="brl" className="font-display fs-kpi font-extrabold text-texto" />
        <p className="num fs-mini text-texto-2">
          contratado <strong className="text-texto">{fmtBRL(p.cpmContratado)}</strong>
        </p>
        <p className="fs-mini text-texto-3">
          {varCpm === null ? "aguardando entrega" : varCpm <= 0 ? "abaixo do contratado: mais impressões por real" : "acima do contratado"}
        </p>
      </CardHero>

      <CardHero rotulo="Ritmo do investimento" badge={badgeRitmo}>
        <Numero valor={ritmoInvest} formato="pct0" className="font-display fs-kpi font-extrabold" style={{ color: corRitmo }} />
        <p className="num fs-mini text-texto-2">
          realizado {fmtBRL0(p.investido)} vs esperado {fmtBRL0(p.idealAteHoje)}
        </p>
        <p className="num fs-mini text-texto-3">
          {fmtData(projeto.dataInicio).slice(0, 5)} a {fmtData(projeto.dataFim).slice(0, 5)} · dia {p.diasPassados} de {p.diasTotais}
          {p.diasRestantes > 0 && ` · ${fmtBRL0(p.brutoPorDiaNecessario)}/dia`}
        </p>
      </CardHero>
    </div>
  );
}
