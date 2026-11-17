import type { DashboardPayload } from "@/lib/tipos";
import { fmtData, rotuloStatus } from "@/lib/formato";
import { AtualizadoHa } from "./AtualizadoHa";

export function CabecalhoProjeto({ dados, aviso }: { dados: DashboardPayload; aviso?: string | null }) {
  const p = dados.projeto;
  return (
    <section className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-roxo">
          {p.cliente}
          {p.agencia && !p.cliente.toUpperCase().includes(p.agencia.toUpperCase()) ? ` · ${p.agencia}` : ""}
        </p>
        <h1 className="titulo-display truncate text-3xl text-preto lg:text-4xl">{p.nome}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {p.piIdentificador && (
          <span className="rounded-md bg-preto px-2.5 py-1 text-xs font-semibold text-white">{p.piIdentificador}</span>
        )}
        <span className="rounded-md border border-borda bg-white px-2.5 py-1 text-xs font-medium text-texto-2">
          {fmtData(p.dataInicio)} a {fmtData(p.dataFim)}
        </span>
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
            p.encerrado ? "bg-preto/10 text-preto" : "bg-limao text-preto"
          }`}
        >
          {rotuloStatus(p.status)}
        </span>
        <AtualizadoHa em={dados.atualizadoEm} />
        {aviso && (
          <span className="rounded-md bg-laranja/30 px-2.5 py-1 text-xs font-medium text-preto">{aviso}</span>
        )}
      </div>
    </section>
  );
}
