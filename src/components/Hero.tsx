import type { ReactNode } from "react";
import type { DashboardPayload } from "@/lib/tipos";
import { COR } from "@/lib/cores";
import { fmtBRL, fmtBRL0, fmtData, fmtInt, fmtPct } from "@/lib/formato";
import { BarraProgresso } from "./BarraProgresso";
import { Numero } from "./Numero";
import { Badge } from "./Painel";

function CardHero({
  rotulo,
  badge,
  children,
}: {
  rotulo: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card flex min-w-0 flex-col gap-2 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="rotulo">{rotulo}</p>
        {badge}
      </div>
      {children}
    </section>
  );
}

const sinal = (v: number) => `${v >= 0 ? "+" : "−"}${fmtPct(Math.abs(v))}`;

/**
 * Linha de destaque (contrato, período completo):
 * impressões × meta, investido × contratado, CPM real × contratado e ritmo.
 */
export function Hero({ p, projeto }: { p: DashboardPayload["progresso"]; projeto: DashboardPayload["projeto"] }) {
  const unidade = p.kpi === "CPM" ? "impressões" : "resultados";
  const pctEntregaIdeal = p.meta > 0 ? (p.entregaIdealAteHoje / p.meta) * 100 : 0;
  const ritmoEntrega =
    p.entregue !== null && p.entregaIdealAteHoje > 0 ? (p.entregue / p.entregaIdealAteHoje - 1) * 100 : null;
  const superada = (p.pctMeta ?? 0) >= 100;
  const varCpm =
    p.cpmRealizado !== null && p.cpmContratado ? (p.cpmRealizado / p.cpmContratado - 1) * 100 : null;
  const ritmoInvest = p.idealAteHoje > 0 ? (p.investido / p.idealAteHoje) * 100 : null;
  const saldo = Math.max(0, p.contratado - p.investido);

  const badgeEntrega = superada ? (
    <Badge fundo={COR.amarelo} cor={COR.texto}>
      ★ Meta superada
    </Badge>
  ) : ritmoEntrega !== null ? (
    <Badge
      fundo={ritmoEntrega >= 0 ? COR.verdeSuave : COR.laranjaSuave}
      cor={ritmoEntrega >= 0 ? COR.verde : COR.laranjaEscuro}
    >
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
    <div className="grid shrink-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CardHero rotulo={`${unidade} entregues`} badge={badgeEntrega}>
        <Numero valor={p.entregue} formato="int" className="font-display text-[34px] font-extrabold leading-none" style={{ color: COR.azul }} />
        <p className="num text-xs text-texto-2">
          de {fmtInt(p.meta)} contratadas · <strong className="text-texto">{fmtPct(p.pctMeta)}</strong> da meta
        </p>
        <div className="mt-auto">
          <BarraProgresso pct={p.pctMeta} pctIdeal={pctEntregaIdeal} cor={COR.azul} rotulo="Entrega da meta" />
          <p className="num mt-1 text-[11px] text-texto-3">
            <span aria-hidden className="mr-1 inline-block h-2.5 w-[3px] rounded-full align-[-1px]" style={{ background: COR.texto }} />
            ideal hoje {fmtInt(p.entregaIdealAteHoje)}
          </p>
        </div>
      </CardHero>

      <CardHero rotulo="Investido (bruto)">
        <Numero valor={p.investido} formato="brl" className="font-display text-[34px] font-extrabold leading-none" style={{ color: COR.laranjaEscuro }} />
        <p className="num text-xs text-texto-2">
          de {fmtBRL0(p.contratado)} · saldo <strong className="text-texto">{fmtBRL(saldo)}</strong>
        </p>
        <div className="mt-auto">
          <BarraProgresso pct={p.pctInvestido} pctIdeal={p.pctIdeal} cor={COR.laranja} rotulo="Investido do contratado" />
          <p className="num mt-1 flex justify-between gap-2 text-[11px] text-texto-3">
            <span>
              <strong className="text-texto">{fmtPct(p.pctInvestido)}</strong> do contratado
            </span>
            <span>ideal hoje {fmtBRL0(p.idealAteHoje)}</span>
          </p>
        </div>
      </CardHero>

      <CardHero rotulo="CPM bruto realizado" badge={badgeCpm}>
        <Numero valor={p.cpmRealizado} formato="brl" className="font-display text-[34px] font-extrabold leading-none text-texto" />
        <p className="num text-xs text-texto-2">
          contratado <strong className="text-texto">{fmtBRL(p.cpmContratado)}</strong>
        </p>
        <p className="mt-auto text-[11px] leading-snug text-texto-3">
          {varCpm === null
            ? "aguardando entrega"
            : varCpm <= 0
              ? "abaixo do contratado: mais impressões por real investido"
              : "acima do contratado"}
        </p>
      </CardHero>

      <CardHero rotulo="Ritmo do investimento" badge={badgeRitmo}>
        <p className="font-display text-[34px] font-extrabold leading-none" style={{ color: corRitmo }}>
          <Numero valor={ritmoInvest} formato="pct0" />
        </p>
        <p className="num text-xs text-texto-2">
          realizado {fmtBRL0(p.investido)} vs esperado {fmtBRL0(p.idealAteHoje)}
        </p>
        <p className="num mt-auto text-[11px] leading-snug text-texto-3">
          veiculação de {fmtData(projeto.dataInicio).slice(0, 5)} a {fmtData(projeto.dataFim).slice(0, 5)} · dia {p.diasPassados}{" "}
          de {p.diasTotais}
          {p.diasRestantes > 0 && ` · ${fmtBRL0(p.brutoPorDiaNecessario)}/dia necessário`}
        </p>
      </CardHero>
    </div>
  );
}
