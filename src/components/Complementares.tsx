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

/** Grid 2×4 de mini-cards com métricas da campanha até hoje (dinheiro em bruto). */
export function Complementares({ c }: { c: DashboardPayload["complementares"] }) {
  const itens: Item[] = [
    { rotulo: "Alcance", valor: c.alcance, formato: "compacto", nota: "pessoas únicas", cor: COR.azul },
    { rotulo: "Frequência", valor: c.frequencia, formato: "dec1", nota: "impressões por pessoa", cor: COR.azul },
    { rotulo: "Cliques", valor: c.cliques, formato: "int", nota: "até hoje" },
    { rotulo: "CTR", valor: c.ctr, formato: "pct2", nota: "cliques ÷ impressões" },
    { rotulo: "CPC bruto", valor: c.cpc, formato: "brl", nota: "custo por clique", cor: COR.laranjaEscuro },
    { rotulo: "Impressões visíveis", valor: c.impressoesVisiveis, formato: "compacto", nota: "Active View" },
    { rotulo: "Taxa de visibilidade", valor: c.taxaVisibilidade, formato: "pct", nota: "visíveis ÷ mensuráveis" },
    { rotulo: "CPM bruto por alcance", valor: c.cpmAlcance, formato: "brl", nota: "por mil pessoas alcançadas", cor: COR.laranjaEscuro },
  ];
  return (
    <Painel titulo="Métricas complementares" subtitulo="campanha até hoje · valores em bruto" className="h-full">
      <dl className="grid flex-1 grid-cols-2 gap-2.5">
        {itens.map((i) => (
          <div key={i.rotulo} className="flex min-w-0 flex-col justify-center rounded-2xl bg-white px-3.5 py-2.5 ring-1 ring-black/[0.04]">
            <dt className="rotulo leading-tight">{i.rotulo}</dt>
            <dd className="mt-1">
              <Numero
                valor={i.valor}
                formato={i.formato}
                className="font-display block text-[22px] font-bold leading-none"
                style={{ color: i.cor ?? COR.texto }}
              />
              <span className="mt-1 block text-[10.5px] leading-snug text-texto-3">{i.nota}</span>
            </dd>
          </div>
        ))}
      </dl>
    </Painel>
  );
}
