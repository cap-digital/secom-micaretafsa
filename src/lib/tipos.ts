/**
 * Payload enviado ao browser. SOMENTE campos brutos (manual, seção 6).
 * Nunca adicione aqui orçamento de plataforma, gasto de plataforma,
 * id de conta ou id de campanha — o checklist (item 5) bloqueia.
 * Dinheiro em reais (já convertido para bruto).
 */

export type StatusRitmo = "No ritmo" | "Acima" | "Abaixo";
export type Preset = "ontem" | "7d" | "tudo" | "personalizado";

export interface Periodo {
  de: string;
  ate: string;
  preset: Preset;
  /** limites selecionáveis (período do projeto) */
  minimo: string;
  maximo: string;
  hoje: string;
}

export interface DiaSerie {
  data: string;
  investido: number | null;
  impressoes: number | null;
  cliques: number | null;
  futuro: boolean;
}

/** Linha de um recorte (gênero, idade, município). */
export interface LinhaRecorte {
  chave: string;
  rotulo: string;
  impressoes: number;
  cliques: number;
  investido: number;
  /** % das impressões do recorte */
  pct: number;
  cpm: number | null;
  ctr: number | null;
}

/** Resumo da área segmentada (aba "Locais" do Google): só entregas, sem dinheiro. */
export interface ResumoGeo {
  /** PRESENCE_OR_INTEREST | PRESENCE */
  tipoGeo: string | null;
  locais: { chave: string; rotulo: string; ativo: boolean; impressoes: number; cliques: number }[];
}

export interface CriativoPayload {
  chave: string;
  nome: string;
  formato: string;
  largura: number | null;
  altura: number | null;
  tipo: string;
  imagemUrl: string | null;
  imagemLocal: string | null;
  impressoes: number;
  cliques: number;
  ctr: number | null;
  investido: number;
}

export interface DashboardPayload {
  atualizadoEm: string;
  /** "HH:MM" no fuso da Bahia */
  atualizadoHora: string;
  periodo: Periodo;
  projeto: {
    nome: string;
    cliente: string;
    piIdentificador: string | null;
    dataInicio: string;
    dataFim: string;
    status: string;
    encerrado: boolean;
  };
  /** KPIs do intervalo filtrado */
  kpis: {
    investido: number;
    contratado: number;
    impressoes: number | null;
    cliques: number | null;
    cpmRealizado: number | null;
    cpmContratado: number | null;
    cpc: number | null;
    ctr: number | null;
    aguardandoDados: boolean;
  };
  /** Progresso da meta — sempre sobre o período inteiro */
  progresso: {
    kpi: string;
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
  /** dias do intervalo filtrado */
  serie: DiaSerie[];
  publico: { genero: LinhaRecorte[]; idade: LinhaRecorte[] };
  pracas: { linhas: LinhaRecorte[]; resumo: ResumoGeo | null };
  criativos: CriativoPayload[];
}

export type ResultadoDashboard =
  | { estado: "ok"; payload: DashboardPayload; aviso: string | null }
  | { estado: "vazio"; titulo: string; mensagem: string };
