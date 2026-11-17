export function EstadoVazio({ titulo, mensagem }: { titulo: string; mensagem: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="card max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 h-1.5 w-20 rounded-full" style={{ background: "linear-gradient(90deg,#F0C848,#E0702A,#2F6DB5)" }} />
        <h1 className="font-display text-xl font-bold text-texto">{titulo}</h1>
        <p className="mt-1.5 text-xs text-texto-2">{mensagem}</p>
        <p className="mt-4 text-[11px] text-texto-3">Micareta de Feira 2026 · SECOM · Governo da Bahia</p>
      </div>
    </div>
  );
}

export function Carregando() {
  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col gap-4 px-4 py-5 lg:px-8" aria-busy="true">
      <div className="h-12 w-64 animate-pulse rounded-2xl bg-white/40" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-[22px] bg-white/45" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="h-80 animate-pulse rounded-[22px] bg-white/45 lg:col-span-3" />
        <div className="h-80 animate-pulse rounded-[22px] bg-white/45 lg:col-span-2" />
      </div>
      <span className="sr-only">Carregando dados…</span>
    </div>
  );
}
