import type { ReactNode } from "react";

/** Card off-white flutuando sobre o laranja: cantos de 22px, sombra suave, borda branca translúcida. */
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
    <section className={`card flex min-w-0 flex-col ${className}`}>
      {(titulo || acoes) && (
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-2 px-5 pt-4">
          <div className="min-w-0">
            {titulo && <h2 className="font-display text-[17px] font-bold leading-tight text-texto">{titulo}</h2>}
            {subtitulo && <p className="mt-0.5 text-[11px] text-texto-3">{subtitulo}</p>}
          </div>
          {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
        </header>
      )}
      <div className={`flex min-h-0 flex-1 flex-col px-5 pb-4 pt-3 ${corpoClassName}`}>{children}</div>
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
          className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
            valor === o.id ? "bg-azul text-white shadow-sm" : "text-texto-2 hover:text-texto"
          }`}
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
      className="num inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: fundo, color: cor }}
    >
      {children}
    </span>
  );
}
