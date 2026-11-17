export function EstadoVazio({ titulo, mensagem }: { titulo: string; mensagem: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="listras-suaves max-w-md rounded-2xl border border-borda bg-white p-8 text-center">
        <div className="mx-auto mb-4 h-2 w-24 rounded-full bg-gradient-to-r from-laranja via-rosa to-agua" />
        <h1 className="titulo-display text-3xl text-preto">{titulo}</h1>
        <p className="mt-2 text-sm text-texto-2">{mensagem}</p>
        <p className="mt-4 text-xs text-texto-3">Micareta de Feira 2026 · Governo da Bahia</p>
      </div>
    </div>
  );
}

export function Carregando() {
  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col gap-3 p-4 lg:p-6" aria-busy="true">
      <div className="h-12 w-2/3 animate-pulse rounded-xl bg-borda/70" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-borda/60" />
        ))}
      </div>
      <div className="grid min-h-64 flex-1 gap-3 lg:grid-cols-12">
        <div className="animate-pulse rounded-2xl bg-roxo/20 lg:col-span-4" />
        <div className="animate-pulse rounded-2xl bg-borda/60 lg:col-span-8" />
      </div>
      <span className="sr-only">Carregando dados…</span>
    </div>
  );
}
