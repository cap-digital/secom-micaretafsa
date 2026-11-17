import { COR } from "@/lib/cores";

/**
 * Barra de progresso em largura total. Largura e cores SEMPRE inline (hex):
 * nada depende de variável CSS ou classe gerada. O marcador de "ideal hoje"
 * é um traço escuro com aro branco, centrado no trilho, sem cobrir textos.
 */
export function BarraProgresso({
  pct,
  pctIdeal,
  cor,
  rotulo,
  altura = "clamp(8px, 1.1vh, 14px)",
}: {
  pct: number | null;
  pctIdeal?: number | null;
  cor: string;
  rotulo: string;
  altura?: number | string;
}) {
  const w = Math.min(100, Math.max(0, pct ?? 0));
  const ideal = pctIdeal === null || pctIdeal === undefined ? null : Math.min(100, Math.max(0, pctIdeal));
  return (
    <div className="relative py-[3px]">
      <div
        className="w-full overflow-hidden rounded-full"
        style={{ height: altura, background: COR.trilho }}
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(w)}
      >
        <div className="barra-anim h-full rounded-full" style={{ width: `${w}%`, background: cor }} />
      </div>
      {ideal !== null && (
        <span
          aria-hidden
          title="Ideal até hoje"
          className="absolute top-0 bottom-0 w-[3px] -translate-x-1/2 rounded-full"
          style={{ left: `${ideal}%`, background: COR.texto, boxShadow: "0 0 0 2px #fff" }}
        />
      )}
    </div>
  );
}
