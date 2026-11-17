import type { LinhaRecorte } from "@/lib/tipos";
import { fmtBRL, fmtCompacto, fmtInt, fmtPct } from "@/lib/formato";
import { Painel } from "./Painel";

const COLUNAS = "grid-cols-[16px_minmax(0,1fr)_52px_40px_44px_56px]";

export function RankingPracas({ linhas }: { linhas: LinhaRecorte[] }) {
  const max = Math.max(1, ...linhas.map((l) => l.impressoes));
  return (
    <Painel titulo="Praças · Localidade" subtitulo="top 10 municípios por impressões" className="h-full">
      {!linhas.length ? (
        <p className="m-auto text-xs text-texto-3">Aguardando dados</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className={`num grid ${COLUNAS} gap-x-2 border-b border-borda pb-1 text-[10px] text-texto-3`}>
            <span>#</span>
            <span>Município</span>
            <span className="text-right">Impr.</span>
            <span className="text-right">Cliques</span>
            <span className="text-right">%</span>
            <span className="text-right">CPM bruto</span>
          </div>
          <ol className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto">
            {linhas.map((l, i) => {
              const agrupada = l.chave === "outras" || l.chave === "nao-identificado";
              return (
                <li key={l.chave} className={`num grid ${COLUNAS} items-center gap-x-2 py-px text-[11px]`}>
                  <span className="text-texto-3">{agrupada ? "" : i + 1}</span>
                  {/* barra horizontal como fundo do nome: mantém cada linha com uma altura só */}
                  <span className="relative min-w-0 py-0.5">
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 rounded"
                      style={{
                        width: `${(l.impressoes / max) * 100}%`,
                        background: agrupada ? "#ececef" : "var(--roxo-suave)",
                        borderLeft: `2px solid ${agrupada ? "var(--neutro)" : "var(--roxo)"}`,
                      }}
                    />
                    <span
                      className={`relative block truncate pl-1.5 ${agrupada ? "text-texto-3" : "text-texto"}`}
                      title={l.rotulo}
                    >
                      {l.rotulo}
                    </span>
                  </span>
                  <span className="text-right text-texto" title={fmtInt(l.impressoes)}>
                    {fmtCompacto(l.impressoes)}
                  </span>
                  <span className="text-right text-texto-2">{fmtInt(l.cliques)}</span>
                  <span className="text-right text-texto-2">{fmtPct(l.pct)}</span>
                  <span className="text-right text-texto-2">{fmtBRL(l.cpm)}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Painel>
  );
}
