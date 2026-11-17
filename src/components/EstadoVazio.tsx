export function EstadoVazio({ titulo, mensagem }: { titulo: string; mensagem: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-sm rounded-xl border border-borda bg-card p-8 text-center">
        <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-gradient-to-r from-roxo to-magenta" />
        <h1 className="text-[15px] font-semibold text-texto">{titulo}</h1>
        <p className="mt-1.5 text-xs text-texto-2">{mensagem}</p>
        <p className="mt-4 text-[11px] text-texto-3">Micareta de Feira 2026 · Governo da Bahia</p>
      </div>
    </div>
  );
}

export function Carregando() {
  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col gap-3 p-4 lg:px-6" aria-busy="true">
      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-xl border border-borda bg-card" />
        ))}
      </div>
      <div className="grid min-h-48 flex-1 gap-3 lg:grid-cols-3">
        <div className="animate-pulse rounded-xl border border-borda bg-card lg:col-span-2" />
        <div className="animate-pulse rounded-xl border border-borda bg-card" />
      </div>
      <div className="grid min-h-48 flex-1 gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-borda bg-card" />
        ))}
      </div>
      <span className="sr-only">Carregando dados…</span>
    </div>
  );
}
