import type { ReactNode } from "react";

/**
 * Card off-white flutuando sobre o laranja. Sempre flex-column com min-h-0:
 * o corpo (flex-1 min-h-0) ocupa o que sobrar da altura que o grid der ao card.
 */
export function Painel({
  titulo,
  subtitulo,
  acoes,
  children,
  className = "",
  corpoClassName = "",
}: {
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
  corpoClassName?: string;
}) {
  return (
    <section className={`card pad-card flex min-h-0 min-w-0 flex-col gap-[clamp(0.35rem,0.8vh,0.9rem)] ${className}`}>
      {(titulo || acoes) && (
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <div className="min-w-0">
            {titulo && <h2 className="font-display fs-titulo font-bold text-texto">{titulo}</h2>}
            {subtitulo && <p className="fs-mini text-texto-3">{subtitulo}</p>}
          </div>
          {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
        </header>
      )}
      <div className={`flex min-h-0 flex-1 flex-col ${corpoClassName}`}>{children}</div>
    </section>
  );
}

/** Controle segmentado em pílula (ativo em azul royal). */
export function Segmentado<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
}: {
  opcoes: { id: T; rotulo: string }[];
  valor: T;
  onChange: (v: T) => void;
  rotulo: string;
}) {
  return (
    <div className="flex items-center rounded-full bg-white p-0.5 ring-1 ring-black/5" role="group" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={valor === o.id}
          onClick={() => onChange(o.id)}
          className="fs-mini whitespace-nowrap rounded-full px-[clamp(0.5rem,0.7vw,0.9rem)] py-[clamp(0.15rem,0.35vh,0.35rem)] font-semibold transition-colors"
          style={valor === o.id ? { background: "#2F6DB5", color: "#FFFFFF" } : { color: "#5E5750" }}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

/** Badge em pílula. */
export function Badge({ children, fundo, cor }: { children: ReactNode; fundo: string; cor: string }) {
  return (
    <span
      className="num fs-mini inline-flex items-center gap-1 whitespace-nowrap rounded-full px-[clamp(0.4rem,0.6vw,0.75rem)] py-[clamp(0.1rem,0.3vh,0.3rem)] font-semibold"
      style={{ background: fundo, color: cor }}
    >
      {children}
    </span>
  );
}
