"use client";

import { useState } from "react";
import type { LinhaRecorte } from "@/lib/tipos";
import { fmtBRL, fmtCompacto, fmtInt, fmtPct } from "@/lib/formato";
import { Painel, Segmentado } from "./Painel";

// par validado (CVD + contraste; texto branco ≥ 4,2:1); "Não identificado" sempre neutro
const COR_GENERO: Record<string, { fundo: string; texto: string }> = {
  FEMALE: { fundo: "var(--azul)", texto: "#ffffff" },
  MALE: { fundo: "var(--laranja-escuro)", texto: "#ffffff" },
  UNDETERMINED: { fundo: "var(--neutro)", texto: "var(--texto)" },
};
const corDe = (k: string) => COR_GENERO[k] ?? COR_GENERO.UNDETERMINED;
/** abaixo disso o rótulo não cabe dentro do segmento e vai para fora (abaixo da barra) */
const MIN_PCT_DENTRO = 14;

function Genero({ linhas }: { linhas: LinhaRecorte[] }) {
  // centro de cada segmento = soma dos anteriores + metade do próprio
  const centros = linhas.map((l, i) => linhas.slice(0, i).reduce((a, x) => a + x.pct, 0) + l.pct / 2);
  const temEstreito = linhas.some((l) => l.pct < MIN_PCT_DENTRO);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div>
        <div className="flex h-9 w-full gap-0.5 overflow-hidden rounded-lg" role="img" aria-label="Impressões por gênero">
          {linhas.map((l) => (
            <div
              key={l.chave}
              className="num flex h-full min-w-0 items-center justify-center overflow-hidden whitespace-nowrap px-1 text-xs font-semibold"
              style={{ width: `${l.pct}%`, background: corDe(l.chave).fundo, color: corDe(l.chave).texto }}
              title={`${l.rotulo}: ${fmtPct(l.pct)}`}
            >
              {l.pct >= MIN_PCT_DENTRO ? fmtPct(l.pct, 0) : ""}
            </div>
          ))}
        </div>
        {temEstreito && (
          <div className="relative mt-1 h-4 text-[11px] text-texto-2">
            {linhas.map((l, i) =>
              l.pct < MIN_PCT_DENTRO ? (
                <span
                  key={l.chave}
                  className="num absolute -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${Math.min(94, Math.max(6, centros[i]))}%` }}
                >
                  {fmtPct(l.pct, 0)}
                </span>
              ) : null,
            )}
          </div>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
        {linhas.map((l) => (
          <div key={l.chave} className="flex flex-col justify-center gap-2 rounded-lg border border-borda px-3 py-2">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-texto-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: corDe(l.chave).fundo }} />
                <span className="truncate">{l.rotulo}</span>
              </p>
              <p className="num mt-1 text-xl font-semibold leading-none text-texto">{fmtPct(l.pct)}</p>
            </div>
            <dl className="num grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px]">
              <dt className="text-texto-3">Impressões</dt>
              <dd className="text-right text-texto">{fmtCompacto(l.impressoes)}</dd>
              <dt className="text-texto-3">Cliques</dt>
              <dd className="text-right text-texto">{fmtInt(l.cliques)}</dd>
              <dt className="text-texto-3">Investido bruto</dt>
              <dd className="text-right text-texto">{fmtBRL(l.investido)}</dd>
              <dt className="text-texto-3">CPM bruto</dt>
              <dd className="text-right text-texto">{fmtBRL(l.cpm)}</dd>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function Idade({ linhas }: { linhas: LinhaRecorte[] }) {
  const max = Math.max(1, ...linhas.map((l) => l.impressoes));
  const colunas = "grid-cols-[96px_minmax(0,1fr)_48px_64px]";
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between gap-1">
      <div className={`num grid ${colunas} gap-x-2 text-[10px] text-texto-3`}>
        <span>Faixa</span>
        <span>Impressões</span>
        <span className="text-right">%</span>
        <span className="text-right">CPM bruto</span>
      </div>
      {linhas.map((l) => (
        <div key={l.chave} className={`num grid ${colunas} items-center gap-x-2 text-[11px]`}>
          <span className="truncate text-texto-2" title={l.rotulo}>
            {l.rotulo}
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className="h-2.5 shrink-0 rounded-sm"
              style={{
                // reserva ~56px para o rótulo de dados ao lado da barra
                width: `calc((100% - 56px) * ${l.impressoes / max})`,
                minWidth: 2,
                background: l.chave === "AGE_RANGE_UNDETERMINED" ? "var(--neutro)" : "var(--azul)",
              }}
            />
            <span className="shrink-0 text-texto">{fmtCompacto(l.impressoes)}</span>
          </span>
          <span className="text-right text-texto-2">{fmtPct(l.pct)}</span>
          <span className="text-right text-texto-2">{fmtBRL(l.cpm)}</span>
        </div>
      ))}
    </div>
  );
}

export function Publico({ genero, idade }: { genero: LinhaRecorte[]; idade: LinhaRecorte[] }) {
  const [aba, setAba] = useState<"genero" | "idade">("genero");
  const linhas = aba === "genero" ? genero : idade;
  const total = linhas.reduce((a, l) => a + l.impressoes, 0);
  return (
    <Painel
      titulo="Público"
      subtitulo={linhas.length ? `${fmtInt(total)} impressões no período` : "sem dados no período"}
      className="h-full"
      acoes={
        <Segmentado
          rotulo="Recorte de público"
          valor={aba}
          onChange={setAba}
          opcoes={[
            { id: "genero", rotulo: "Gênero" },
            { id: "idade", rotulo: "Idade" },
          ]}
        />
      }
    >
      {!linhas.length ? (
        <p className="m-auto text-xs text-texto-3">Aguardando dados</p>
      ) : aba === "genero" ? (
        <Genero linhas={genero} />
      ) : (
        <Idade linhas={idade} />
      )}
    </Painel>
  );
}
