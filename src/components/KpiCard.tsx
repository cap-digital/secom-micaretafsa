import type { ReactNode } from "react";

export function KpiCard({
  rotulo,
  valor,
  detalhe,
  destaque = false,
}: {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  destaque?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col justify-between rounded-xl border px-4 py-3 ${
        destaque ? "border-preto bg-limao shadow-[4px_4px_0_var(--preto)]" : "border-borda bg-white"
      }`}
    >
      <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${destaque ? "text-preto" : "text-texto-2"}`}>
        {rotulo}
      </p>
      <p className="titulo-display num mt-1 truncate text-[1.7rem] text-preto xl:text-3xl">{valor}</p>
      {detalhe && <p className={`mt-0.5 truncate text-xs ${destaque ? "text-preto/80" : "text-texto-3"}`}>{detalhe}</p>}
    </div>
  );
}
