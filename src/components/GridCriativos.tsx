import type { CriativoPayload } from "@/lib/tipos";
import { fmtBRL, fmtCompacto, fmtInt, fmtPct } from "@/lib/formato";
import { CriativoImagem } from "./CriativoImagem";

function Metricas({ c, grande = false }: { c: CriativoPayload; grande?: boolean }) {
  // 6 colunas: 1ª linha com 3 métricas de entrega, 2ª com as 2 de dinheiro (mais largas)
  const itens = [
    { r: "Impressões", v: grande ? fmtInt(c.impressoes) : fmtCompacto(c.impressoes), span: "col-span-2" },
    { r: "Cliques", v: fmtInt(c.cliques), span: "col-span-2" },
    { r: "CTR", v: fmtPct(c.ctr, 2), span: "col-span-2" },
    { r: "Investido", v: fmtBRL(c.investido), span: "col-span-3" },
    { r: "CPM bruto", v: fmtBRL(c.cpm), span: "col-span-3" },
  ];
  return (
    <dl className="grid grid-cols-6 gap-x-3 gap-y-1">
      {itens.map((i) => (
        <div key={i.r} className={`min-w-0 ${i.span}`}>
          <dt className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-texto-3">{i.r}</dt>
          <dd className={`num truncate font-semibold text-preto ${grande ? "text-base" : "text-sm"}`}>{i.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function GridCriativos({ criativos }: { criativos: CriativoPayload[] }) {
  const melhor = criativos.reduce<CriativoPayload | null>(
    (m, c) => (c.ctr !== null && (m === null || (m.ctr ?? -1) < c.ctr) ? c : m),
    null,
  );
  const ordenados = [...criativos].sort((a, b) => b.impressoes - a.impressoes);

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-12">
      {melhor && (
        <section className="listras relative flex min-h-0 flex-col overflow-hidden rounded-2xl border-2 border-preto p-4 text-white shadow-[5px_5px_0_var(--preto)] lg:col-span-4">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-roxo/40 to-roxo-escuro/90" />
          <div className="relative flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="titulo-display text-2xl">Melhor CTR</p>
              <span className="titulo-display rounded-md border-2 border-preto bg-limao px-2 py-1 text-xl text-preto shadow-[3px_3px_0_var(--preto)]">
                {fmtPct(melhor.ctr, 2)}
              </span>
            </div>
            <div className="flex h-64 min-h-0 items-center justify-center rounded-xl bg-white/95 p-3 lg:h-auto lg:flex-1">
              <CriativoImagem
                remota={melhor.imagemUrl}
                local={melhor.imagemLocal}
                alt={`Criativo ${melhor.formato}`}
                formato={melhor.formato}
              />
            </div>
            <div className="rounded-xl bg-white/95 p-3">
              <p className="mb-2 text-xs font-semibold text-texto-2">
                Formato <span className="text-preto">{melhor.formato}</span>
              </p>
              <Metricas c={melhor} grande />
            </div>
          </div>
        </section>
      )}

      <section
        className={`grid min-h-0 auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:overflow-y-auto ${
          melhor ? "lg:col-span-8" : "lg:col-span-12"
        }`}
        aria-label="Todos os criativos"
      >
        {ordenados.map((c) => {
          const destaque = c === melhor;
          return (
            <article
              key={c.chave}
              className={`flex min-h-0 flex-col gap-2 rounded-2xl border bg-white p-3 ${
                destaque ? "border-roxo ring-2 ring-roxo/30" : "border-borda"
              }`}
            >
              <div className="flex h-36 min-h-0 items-center justify-center rounded-lg bg-papel p-2 lg:h-auto lg:min-h-28 lg:flex-1">
                <CriativoImagem remota={c.imagemUrl} local={c.imagemLocal} alt={`Criativo ${c.formato}`} formato={c.formato} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="titulo-display text-lg text-preto">{c.formato}</span>
                {destaque ? (
                  <span className="rounded bg-limao px-1.5 py-0.5 text-[10px] font-bold uppercase text-preto">
                    ★ Melhor CTR
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wide text-texto-3">
                    {c.tipo === "IMAGE_AD" ? "Imagem" : c.tipo === "RESPONSIVE_DISPLAY_AD" ? "Responsivo" : c.tipo}
                  </span>
                )}
              </div>
              <Metricas c={c} />
            </article>
          );
        })}
      </section>
    </div>
  );
}
