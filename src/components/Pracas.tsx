import type { LinhaRecorte, ResumoGeo } from "@/lib/tipos";
import { fmtBRL, fmtCompacto, fmtInt, fmtPct } from "@/lib/formato";
import { Painel } from "./Painel";

const AZUL = "#2f6db5";
const NEUTRO = "#c9ccd3";

const ROTULO_TIPO_GEO: Record<string, string> = {
  PRESENCE_OR_INTEREST: "Presença ou interesse",
  PRESENCE: "Presença",
  SEARCH_INTEREST: "Interesse",
};

/** "State of Bahia,Brazil" → "Bahia (estado)"; "Feira de Santana,Bahia,Brazil" → "Feira de Santana, Bahia" */
function nomeLocal(rotulo: string): string {
  const partes = rotulo.split(",").map((p) => p.trim()).filter((p) => p !== "Brazil");
  if (partes.length === 1 && /^State of /i.test(partes[0])) return `${partes[0].replace(/^State of /i, "")} (estado)`;
  return partes.map((p) => p.replace(/^State of /i, "")).join(", ");
}

const agrupada = (k: string) => k === "demais" || k === "outros-raio";

function Resumo({ resumo }: { resumo: ResumoGeo }) {
  return (
    <aside className="flex flex-col gap-2 rounded-lg bg-fundo p-3 text-[11px]">
      <p className="font-semibold text-texto">Área segmentada</p>
      {resumo.locais.map((l) => (
        <div key={l.chave} className="min-w-0">
          <p className={`break-words leading-snug ${l.ativo ? "text-texto" : "text-texto-3"}`}>
            {nomeLocal(l.rotulo)}
            {!l.ativo && " (inativo)"}
          </p>
          <p className="num text-texto-2">
            {fmtInt(l.impressoes)} impr. · {fmtInt(l.cliques)} cliques
          </p>
        </div>
      ))}
      {resumo.tipoGeo && (
        <p className="mt-auto text-texto-3">
          Segmentação: {ROTULO_TIPO_GEO[resumo.tipoGeo] ?? resumo.tipoGeo}
        </p>
      )}
    </aside>
  );
}

/**
 * Praças: municípios do raio segmentado em barras horizontais. Cada linha é uma
 * grade com colunas reservadas (nome | barra + rótulo de dados | CPM bruto), então
 * o rótulo "impressões · %" nunca encosta no CPM nem é cortado, em qualquer largura.
 */
export function Pracas({ linhas, resumo }: { linhas: LinhaRecorte[]; resumo: ResumoGeo | null }) {
  const max = Math.max(1, ...linhas.map((l) => l.impressoes));
  const colunas = "grid-cols-[minmax(84px,132px)_minmax(0,1fr)_64px]";

  return (
    <Painel titulo="Praças" subtitulo="impressões por município (localização do usuário)" className="h-full">
      {!linhas.length ? (
        <p className="m-auto text-xs text-texto-3">Aguardando dados</p>
      ) : (
        <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
          <div className="flex min-h-0 flex-col">
            <div className={`num grid ${colunas} gap-x-2 pb-1 text-[10px] text-texto-3`}>
              <span>Município</span>
              <span>Impressões · % do total</span>
              <span className="text-right">CPM bruto</span>
            </div>
            <ol className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
              {linhas.map((l) => (
                <li
                  key={l.chave}
                  className={`num grid ${colunas} items-center gap-x-2 text-[11px]`}
                  title={`${l.rotulo}: ${fmtInt(l.impressoes)} impressões · ${fmtInt(l.cliques)} cliques · investido ${fmtBRL(l.investido)}`}
                >
                  <span className={`break-words leading-tight ${agrupada(l.chave) ? "text-texto-3" : "text-texto-2"}`}>{l.rotulo}</span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="h-3 shrink-0 rounded-r-sm"
                      style={{
                        // reserva 104px para o rótulo de dados ao lado da barra
                        width: `calc((100% - 104px) * ${l.impressoes / max})`,
                        minWidth: 2,
                        background: agrupada(l.chave) ? NEUTRO : AZUL,
                      }}
                    />
                    <span className="shrink-0 whitespace-nowrap text-texto">
                      {fmtCompacto(l.impressoes)} · {fmtPct(l.pct)}
                    </span>
                  </span>
                  <span className="text-right text-texto-2">{fmtBRL(l.cpm)}</span>
                </li>
              ))}
            </ol>
          </div>
          {resumo && <Resumo resumo={resumo} />}
        </div>
      )}
    </Painel>
  );
}
