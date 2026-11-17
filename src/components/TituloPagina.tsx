import type { Periodo } from "@/lib/tipos";
import { fmtData } from "@/lib/formato";

/** Título da página sobre o fundo laranja, com o período da campanha exibido. */
export function TituloPagina({ titulo, periodo }: { titulo: string; periodo: Periodo }) {
  return (
    <div className="min-w-0">
      <h1 className="font-display text-2xl font-extrabold leading-tight text-sobre-laranja">{titulo}</h1>
      <p className="text-xs font-medium text-sobre-laranja/80">
        Campanha de {fmtData(periodo.de)} a {fmtData(periodo.ate)} · valores em bruto
      </p>
    </div>
  );
}
