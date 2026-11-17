import type { LinhaRecorte } from "@/lib/tipos";
import { COR } from "@/lib/cores";
import { fmtBRL, fmtCompacto, fmtPct } from "@/lib/formato";
import { Painel } from "./Painel";

/**
 * Barras horizontais por faixa etária num ÚNICO grid: todas as linhas usam as
 * mesmas colunas (faixa | barra | rótulo de dados | CPM bruto) e dividem a altura
 * do card (linhas em 1fr). Largura e cor das barras inline (hex).
 */
export function Idade({ linhas }: { linhas: LinhaRecorte[] }) {
  const max = Math.max(1, ...linhas.map((l) => l.impressoes));
  return (
    <Painel titulo="Idade" className="h-full">
      {!linhas.length ? (
        <p className="m-auto text-xs text-texto-3">Aguardando dados</p>
      ) : (
        <div
          className="num fs-mini grid min-h-0 flex-1 items-center gap-x-[clamp(0.4rem,0.6vw,0.9rem)]"
          style={{
            gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
            gridTemplateRows: `auto repeat(${linhas.length}, minmax(1.5rem, 1fr))`,
          }}
        >
          <span className="rotulo pb-1">Faixa</span>
          <span className="rotulo pb-1">Impressões</span>
          <span className="rotulo pb-1 text-right">Impr. · %</span>
          <span className="rotulo pb-1 text-right">CPM</span>
          {linhas.map((l) => {
            const nd = l.chave === "AGE_RANGE_UNDETERMINED";
            return [
              <span key={`${l.chave}-f`} className={`whitespace-nowrap ${nd ? "text-texto-3" : "font-semibold text-texto"}`}>
                {l.rotulo}
              </span>,
              <span key={`${l.chave}-b`} className="block h-[clamp(8px,1.2vh,16px)] min-w-0">
                <span
                  className="barra-anim block h-full rounded-full"
                  style={{ width: `${Math.max(1.5, (l.impressoes / max) * 100)}%`, background: nd ? COR.neutro : COR.azul }}
                />
              </span>,
              <span key={`${l.chave}-r`} className="whitespace-nowrap text-right text-texto">
                {fmtCompacto(l.impressoes)} · <span className="text-texto-2">{fmtPct(l.pct)}</span>
              </span>,
              <span key={`${l.chave}-c`} className="whitespace-nowrap text-right text-texto-2">
                {fmtBRL(l.cpm)}
              </span>,
            ];
          })}
        </div>
      )}
    </Painel>
  );
}
