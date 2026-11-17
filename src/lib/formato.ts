/** Formatadores pt-BR (seguros para client e server). */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const int = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export const fmtBRL = (v: number | null | undefined) => (v === null || v === undefined ? "—" : brl.format(v));
export const fmtBRL0 = (v: number | null | undefined) => (v === null || v === undefined ? "—" : brl0.format(v));
export const fmtInt = (v: number | null | undefined) => (v === null || v === undefined ? "—" : int.format(v));
export const fmtCompacto = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : compacto.format(v);
export const fmtPct = (v: number | null | undefined, casas = 1) =>
  v === null || v === undefined || !Number.isFinite(v)
    ? "—"
    : `${v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;

/** "2026-11-16" → "16/11" */
export const fmtDiaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
/** "2026-11-16" → "16/11/2026" */
export const fmtData = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

const ROTULO_STATUS: Record<string, string> = {
  planejada: "Planejada",
  em_aprovacao: "Em aprovação",
  aguardando_material: "Aguardando material",
  ativa: "Ativa",
  ativo: "Ativo",
  pausada: "Pausada",
  finalizada: "Finalizada",
  encerrado: "Encerrado",
  cancelada: "Cancelada",
};
export const rotuloStatus = (s: string) =>
  ROTULO_STATUS[s] ?? s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
