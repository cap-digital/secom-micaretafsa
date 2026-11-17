export function EstadoVazio({ titulo, mensagem }: { titulo: string; mensagem: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="card max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 h-1.5 w-20 rounded-full" style={{ background: "linear-gradient(90deg,#F0C848,#E0702A,#2F6DB5)" }} />
        <h1 className="font-display text-xl font-bold" style={{ color: "#1F1A17" }}>
          {titulo}
        </h1>
        <p className="mt-1.5 text-xs" style={{ color: "#5E5750" }}>
          {mensagem}
        </p>
        <p className="mt-4 text-[11px]" style={{ color: "#8A847C" }}>
          Micareta de Feira 2026 · SECOM · Governo da Bahia
        </p>
      </div>
    </div>
  );
}

/** Esqueleto com a mesma estrutura de altura total da Visão Geral. */
export function Carregando() {
  const bloco = "animate-pulse rounded-[clamp(16px,1.2vw,26px)] bg-white/45 min-h-32 lg:min-h-0";
  return (
    <div className="pad-tela gap-fluido grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-rows-[0.9fr_1.6fr_1.5fr]" aria-busy="true">
      <div className="gap-fluido grid min-h-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={bloco} />
        ))}
      </div>
      <div className="gap-fluido grid min-h-0 grid-cols-1 lg:grid-cols-5">
        <div className={`${bloco} lg:col-span-3`} />
        <div className={`${bloco} lg:col-span-2`} />
      </div>
      <div className="gap-fluido grid min-h-0 grid-cols-1 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={bloco} />
        ))}
      </div>
      <span className="sr-only">Carregando dados…</span>
    </div>
  );
}
