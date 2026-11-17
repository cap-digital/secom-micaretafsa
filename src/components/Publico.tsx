"use client";

import { useState } from "react";
import type { LinhaRecorte } from "@/lib/tipos";
import { fmtBRL, fmtCompacto, fmtInt, fmtPct } from "@/lib/formato";
import { Painel, Segmentado } from "./Painel";

// pares validados (CVD + contraste); "Não identificado" sempre neutro
const COR_GENERO: Record<string, string> = {
  FEMALE: "var(--roxo-cat)",
  MALE: "var(--magenta-cat)",
  UNDETERMINED: "var(--neutro)",
};

function Genero({ linhas }: { linhas: LinhaRecorte[] }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center gap-2">
      <p className="text-[11px] text-texto-3">Impressões por gênero</p>
      <div className="mb-2 flex h-7 w-full gap-0.5 overflow-hidden rounded-md" role="img" aria-label="Distribuição de impressões por gênero">
        {linhas.map((l) => (
          <div
            key={l.chave}
            className="flex h-full items-center justify-center text-[11px] font-semibold"
            style={{
              width: `${l.pct}%`,
              background: COR_GENERO[l.chave] ?? "var(--neutro)",
              color: l.chave === "UNDETERMINED" ? "var(--texto-2)" : "#fff",
            }}
            title={`${l.rotulo}: ${fmtPct(l.pct)}`}
          >
            {l.pct >= 9 ? fmtPct(l.pct, 0) : ""}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {linhas.map((l) => (
          <div key={l.chave} className="rounded-lg border border-borda px-2.5 py-2">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-texto-2">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: COR_GENERO[l.chave] ?? "var(--neutro)" }} />
              <span className="truncate">{l.rotulo}</span>
            </p>
            <p className="num mt-1 text-lg font-semibold leading-none text-texto">{fmtPct(l.pct)}</p>
            <p className="num mt-1 text-[11px] text-texto-3">{fmtCompacto(l.impressoes)} impr.</p>
            <p className="num text-[11px] text-texto-3">CPM {fmtBRL(l.cpm)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Idade({ linhas }: { linhas: LinhaRecorte[] }) {
  const max = Math.max(1, ...linhas.map((l) => l.impressoes));
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between">
      <div className="num grid grid-cols-[96px_1fr_44px_60px] gap-x-2 pb-1 text-[10px] text-texto-3">
        <span>Faixa</span>
        <span>Impressões</span>
        <span className="text-right">%</span>
        <span className="text-right">CPM bruto</span>
      </div>
      {linhas.map((l) => (
        <div key={l.chave} className="num grid grid-cols-[96px_1fr_44px_60px] items-center gap-x-2 text-[11px]">
          <span className="truncate text-texto-2">{l.rotulo}</span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 rounded-sm"
              style={{
                width: `${(l.impressoes / max) * 100}%`,
                minWidth: 2,
                background: l.chave === "AGE_RANGE_UNDETERMINED" ? "var(--neutro)" : "var(--roxo)",
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
