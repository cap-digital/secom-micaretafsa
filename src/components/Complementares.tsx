import type { DashboardPayload } from "@/lib/tipos";
import { COR } from "@/lib/cores";
import { Numero, type FormatoNumero } from "./Numero";
import { Painel } from "./Painel";

interface Item {
  rotulo: string;
  valor: number | null;
  formato: FormatoNumero;
  nota: string;
  cor?: string;
}

/**
 * Grid 4×2 compacto (2 colunas abaixo de sm) que encolhe com o card.
 * A explicação de cada métrica fica no tooltip (title) para não ocupar altura.
 */
export function Complementares({ c }: { c: DashboardPayload["complementares"] }) {
  const itens: Item[] = [
    { rotulo: "Alcance", valor: c.alcance, formato: "compacto", nota: "pessoas únicas alcançadas", cor: COR.azul },
    { rotulo: "Frequência", valor: c.frequencia, formato: "dec1", nota: "impressões por pessoa", cor: COR.azul },
    { rotulo: "Cliques", valor: c.cliques, formato: "int", nota: "cliques até hoje" },
    { rotulo: "CTR", valor: c.ctr, formato: "pct2", nota: "cliques ÷ impressões" },
    { rotulo: "CPC bruto", valor: c.cpc, formato: "brl", nota: "investido bruto ÷ cliques", cor: COR.laranjaEscuro },
    { rotulo: "Impr. visíveis", valor: c.impressoesVisiveis, formato: "compacto", nota: "Active View: impressões visíveis" },
    { rotulo: "Visibilidade", valor: c.taxaVisibilidade, formato: "pct", nota: "visíveis ÷ mensuráveis (Active View)" },
    { rotulo: "CPM alcance", valor: c.cpmAlcance, formato: "brl", nota: "investido bruto por mil pessoas alcançadas", cor: COR.laranjaEscuro },
  ];
  return (
    <Painel titulo="Métricas complementares" className="h-full">
      <dl className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-[clamp(0.35rem,0.5vw,0.75rem)] sm:grid-cols-4">
        {itens.map((i) => (
          <div
            key={i.rotulo}
            title={i.nota}
            className="flex min-h-0 min-w-0 flex-col justify-center rounded-[clamp(10px,0.8vw,16px)] bg-white px-[clamp(0.5rem,0.6vw,1rem)] py-[clamp(0.3rem,0.7vh,0.8rem)] ring-1 ring-black/[0.04]"
          >
            <dt className="rotulo">{i.rotulo}</dt>
            <dd className="mt-[0.2em]">
              <Numero valor={i.valor} formato={i.formato} className="font-display fs-num block font-bold" style={{ color: i.cor ?? COR.texto }} />
            </dd>
          </div>
        ))}
      </dl>
    </Painel>
  );
}
