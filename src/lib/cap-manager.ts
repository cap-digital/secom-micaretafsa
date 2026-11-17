import "server-only";
import { cacheLife } from "next/cache";

/**
 * Cliente da API pública do cap-manager (manual, seções 1–3).
 * Só roda no servidor. A resposta crua (com orcamento_plataforma, id_conta,
 * campaign_id) NUNCA é enviada ao browser — ver lib/dashboard.ts.
 */

export type StatusEstrategia =
  | "planejada"
  | "em_aprovacao"
  | "aguardando_material"
  | "ativa"
  | "pausada"
  | "finalizada"
  | "cancelada";

export interface EstrategiaCap {
  id: number;
  plataforma: string;
  plataforma_custom: string | null;
  nome_conta: string | null;
  id_conta: string | null;
  campaign_id: string | null;
  estrategia: string;
  kpi: string;
  status: StatusEstrategia | string;
  data_inicio: string;
  valor_bruto: number;
  orcamento_plataforma: number;
  entrega_contratada: number;
  falta_dados_conta_anuncio: boolean;
  /** campanhas extras da mesma estratégia (campo opcional da API) */
  campanhas_adicionais: string[];
}

export interface ProjetoCap {
  tipo: "td" | "fee";
  projeto: {
    id: number;
    nome: string;
    status: string;
    data_inicio: string;
    data_fim: string;
    campanha_finalizada: boolean;
    cliente: { nome: string } | null;
    agencia: { nome: string } | null;
  };
  pi: { identificador: string; valor_bruto: number } | null;
  estrategias: EstrategiaCap[];
}

export interface RespostaCap {
  dados: ProjetoCap;
  buscadoEm: string;
}

const num = (v: unknown): number => {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown): string | null => (v === null || v === undefined || v === "" ? null : String(v));

function idsAdicionais(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (typeof x === "string" || typeof x === "number") return String(x);
      if (x && typeof x === "object") {
        const o = x as Record<string, unknown>;
        return str(o.campaign_id ?? o.id);
      }
      return null;
    })
    .filter((x): x is string => !!x && /^\d+$/.test(x));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizar(j: any): ProjetoCap {
  if (!j?.projeto) throw new Error("cap-manager: resposta sem 'projeto'");
  return {
    tipo: j.tipo === "fee" ? "fee" : "td",
    projeto: {
      id: num(j.projeto.id),
      nome: String(j.projeto.nome ?? ""),
      status: String(j.projeto.status ?? ""),
      data_inicio: String(j.projeto.data_inicio).slice(0, 10),
      data_fim: String(j.projeto.data_fim).slice(0, 10),
      campanha_finalizada: j.projeto.campanha_finalizada === true,
      cliente: j.projeto.cliente ? { nome: String(j.projeto.cliente.nome ?? "") } : null,
      agencia: j.projeto.agencia ? { nome: String(j.projeto.agencia.nome ?? "") } : null,
    },
    pi: j.pi ? { identificador: String(j.pi.identificador ?? ""), valor_bruto: num(j.pi.valor_bruto) } : null,
    estrategias: (Array.isArray(j.estrategias) ? j.estrategias : []).map(
      (e: any): EstrategiaCap => ({
        id: num(e.id),
        plataforma: String(e.plataforma ?? "outro"),
        plataforma_custom: str(e.plataforma_custom),
        nome_conta: str(e.nome_conta),
        id_conta: str(e.id_conta)?.replace(/\D/g, "") ?? null,
        campaign_id: str(e.campaign_id),
        estrategia: String(e.estrategia ?? ""),
        kpi: String(e.kpi ?? "").toUpperCase(),
        status: String(e.status ?? ""),
        data_inicio: String(e.data_inicio ?? j.projeto.data_inicio).slice(0, 10),
        valor_bruto: num(e.valor_bruto),
        orcamento_plataforma: num(e.orcamento_plataforma),
        entrega_contratada: num(e.entrega_contratada),
        falta_dados_conta_anuncio: e.falta_dados_conta_anuncio === true || !e.id_conta || !e.campaign_id,
        campanhas_adicionais: idsAdicionais(e.campanhas_adicionais),
      }),
    ),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Busca o projeto no cap-manager. Cache de dados ("use cache") com idade
 * máxima de 5 min: revalida em segundo plano após 2 min e expira aos 5 min.
 * Erros não são cacheados (a função lança).
 */
export async function buscarProjetoCap(url: string, token: string): Promise<RespostaCap> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 300 });

  const res = await fetch(`${url}/api/public/projeto`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`cap-manager ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { dados: normalizar(await res.json()), buscadoEm: new Date().toISOString() };
}
