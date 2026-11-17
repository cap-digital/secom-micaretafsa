/**
 * Payload enviado ao browser. SOMENTE campos brutos (manual, seção 6).
 * Nunca adicione aqui orçamento de plataforma, gasto de plataforma,
 * id de conta ou id de campanha — o checklist (item 5) bloqueia.
 * Dinheiro em reais (já convertido para bruto).
 */

export type StatusRitmo = "No ritmo" | "Acima" | "Abaixo";
/** Período exibido: sempre a campanha inteira (início da estratégia → hoje ou data_fim). */
export interface Periodo {
  de: string;
  ate: string;
}

export interface DiaSerie {
  data: string;
  investido: number;
  impressoes: number | null;
  cliques: number | null;
}

/** Ritmo: impressões acumuladas × meta esperada acumulada (período inteiro). */
export interface PontoRitmo {
  data: string;
  acumulado: number | null;
  esperado: number;
}

/** Linha de um recorte (gênero, idade). */
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

export interface CriativoPayload {
  chave: string;
  /** nome limpo (sem prefixo de PI e sem extensão) */
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
  cpc: number | null;
  cpm: number | null;
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
  /** KPIs da campanha até hoje */
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
  /** Métricas complementares da campanha até hoje */
  complementares: {
    alcance: number | null;
    frequencia: number | null;
    cliques: number | null;
    ctr: number | null;
    cpc: number | null;
    impressoesVisiveis: number | null;
    /** visíveis ÷ mensuráveis × 100 */
    taxaVisibilidade: number | null;
    /** investido bruto ÷ (alcance ÷ 1000) */
    cpmAlcance: number | null;
  };
  /** Contrato — meta, pacing e saldo sobre o período contratado */
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
    cpmRealizado: number | null;
    cpmContratado: number | null;
  };
  /** dias da campanha até hoje (regra 5.4) */
  serie: DiaSerie[];
  /** ritmo de impressões acumuladas no período inteiro */
  ritmo: PontoRitmo[];
  publico: { genero: LinhaRecorte[]; idade: LinhaRecorte[] };
  criativos: CriativoPayload[];
}

export type ResultadoDashboard =
  | { estado: "ok"; payload: DashboardPayload; aviso: string | null }
  | { estado: "vazio"; titulo: string; mensagem: string };
