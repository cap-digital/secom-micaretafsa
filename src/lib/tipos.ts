/**
 * Payload enviado ao browser. SOMENTE campos brutos (manual, seção 6).
 * Nunca adicione aqui orçamento de plataforma, gasto de plataforma,
 * id de conta ou id de campanha — o checklist (item 5) bloqueia.
 * Dinheiro em reais (já convertido para bruto).
 */

export type StatusRitmo = "No ritmo" | "Acima" | "Abaixo";

export interface DiaSerie {
  data: string;
  investido: number | null;
  impressoes: number | null;
  futuro: boolean;
}

export interface EstrategiaPayload {
  chave: string;
  plataforma: string;
  plataformaRotulo: string;
  nome: string;
  kpi: string;
  status: string;
  dataInicio: string;
  valorBruto: number;
  investido: number;
  restante: number;
  meta: number;
  entregue: number | null;
  pctMeta: number | null;
  custoContratado: number | null;
  custoRealizado: number | null;
  aguardandoDados: boolean;
  segmentacao: string | null;
}

export interface CriativoPayload {
  chave: string;
  nome: string;
  formato: string;
  largura: number | null;
  altura: number | null;
  tipo: string;
  status: string;
  imagemUrl: string | null;
  imagemLocal: string | null;
  impressoes: number;
  cliques: number;
  ctr: number | null;
  investido: number;
  cpm: number | null;
}

export interface DashboardPayload {
  atualizadoEm: string;
  hoje: string;
  projeto: {
    nome: string;
    cliente: string;
    agencia: string | null;
    piIdentificador: string | null;
    dataInicio: string;
    dataFim: string;
    status: string;
    encerrado: boolean;
  };
  kpis: {
    contratado: number;
    investido: number;
    restante: number;
    kpiPrincipal: string;
    impressoes: number | null;
    impressoesVisiveis: number | null;
    alcance: number | null;
    frequencia: number | null;
    cliques: number | null;
    ctr: number | null;
    cpmContratado: number | null;
    cpmRealizado: number | null;
    aguardandoDados: boolean;
  };
  progresso: {
    meta: number;
    entregue: number | null;
    pctMeta: number | null;
    entregaIdealAteHoje: number;
    contratado: number;
    investido: number;
    pctInvestido: number;
    idealAteHoje: number;
    pctIdeal: number;
    status: StatusRitmo;
    diasTotais: number;
    diasPassados: number;
    diasRestantes: number;
    brutoPorDiaNecessario: number;
  };
  serie: DiaSerie[];
  estrategias: EstrategiaPayload[];
  criativos: CriativoPayload[];
}

export type ResultadoDashboard =
  | { estado: "ok"; payload: DashboardPayload; aviso: string | null }
  | { estado: "vazio"; titulo: string; mensagem: string };
