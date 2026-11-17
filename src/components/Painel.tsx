import type { ReactNode } from "react";

/** Card padrão: fundo branco, borda fina, cantos arredondados. */
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
    <section className={`flex min-h-0 min-w-0 flex-col rounded-xl border border-borda bg-card ${className}`}>
      {(titulo || acoes) && (
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 pt-3">
          <div className="min-w-0">
            {titulo && <h2 className="text-[13px] font-semibold text-texto">{titulo}</h2>}
            {subtitulo && <p className="text-[11px] text-texto-3">{subtitulo}</p>}
          </div>
          {acoes && <div className="flex items-center gap-2">{acoes}</div>}
        </header>
      )}
      <div className={`flex min-h-0 flex-1 flex-col px-4 pb-3 pt-2 ${corpoClassName}`}>{children}</div>
    </section>
  );
}

/** Controle segmentado pequeno (toggle). */
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
    <div className="flex items-center rounded-lg border border-borda bg-fundo p-0.5" role="group" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={valor === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
            valor === o.id ? "bg-white text-roxo shadow-sm" : "text-texto-2 hover:text-texto"
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
