import type { LinhaRecorte } from "@/lib/tipos";
import { COR } from "@/lib/cores";
import { fmtBRL, fmtCompacto, fmtPct } from "@/lib/formato";
import { Painel } from "./Painel";

/**
 * Barras horizontais por faixa etária. Largura e cor inline (hex). A barra usa a
 * coluna inteira e o rótulo "impressões · %" fica logo abaixo dela.
 */
export function Idade({ linhas }: { linhas: LinhaRecorte[] }) {
  const max = Math.max(1, ...linhas.map((l) => l.impressoes));
  const colunas = "grid-cols-[minmax(0,92px)_minmax(0,1fr)_64px]";
  return (
    <Painel titulo="Idade" subtitulo="impressões da campanha até hoje" className="h-full">
      {!linhas.length ? (
        <p className="m-auto text-xs text-texto-3">Aguardando dados</p>
      ) : (
        <div className="flex flex-1 flex-col justify-between gap-2">
          <div className={`grid ${colunas} gap-x-3`}>
            <span className="rotulo">Faixa</span>
            <span className="rotulo">Impressões · %</span>
            <span className="rotulo text-right">CPM bruto</span>
          </div>
          {linhas.map((l) => {
            const nd = l.chave === "AGE_RANGE_UNDETERMINED";
            return (
              <div key={l.chave} className={`num grid ${colunas} items-center gap-x-3 text-xs`}>
                <span className={`leading-tight ${nd ? "text-texto-3" : "font-semibold text-texto"}`}>{l.rotulo}</span>
                {/* barra na largura toda da coluna; rótulo de dados logo abaixo (nunca disputa espaço) */}
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="block h-3 w-full">
                    <span
                      className="barra-anim block h-full rounded-full"
                      style={{ width: `${Math.max(1.5, (l.impressoes / max) * 100)}%`, background: nd ? COR.neutro : COR.azul }}
                    />
                  </span>
                  <span className="whitespace-nowrap text-[11px] text-texto">
                    {fmtCompacto(l.impressoes)} · <span className="text-texto-2">{fmtPct(l.pct)}</span>
                  </span>
                </span>
                <span className="text-right text-texto-2">{fmtBRL(l.cpm)}</span>
              </div>
            );
          })}
        </div>
      )}
    </Painel>
  );
}
