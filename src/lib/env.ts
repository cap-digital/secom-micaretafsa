import "server-only";

/**
 * Leitura das variáveis de ambiente (somente servidor).
 * Nenhuma variável usa prefixo NEXT_PUBLIC_.
 */

const CAP_VARS = ["CAP_MANAGER_URL", "CAP_TOKEN_MICARETA"] as const;
const GOOGLE_VARS = [
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
] as const;

const ultimoLog = new Map<string, number>();

/** Loga no servidor no máximo 1x a cada 5 min por mensagem, para não poluir o log. */
export function logServidor(nivel: "warn" | "error", msg: string) {
  const agora = Date.now();
  const ult = ultimoLog.get(msg) ?? 0;
  if (agora - ult < 5 * 60_000) return;
  ultimoLog.set(msg, agora);
  console[nivel](`[dashboard-micareta] ${msg}`);
}

function faltando(nomes: readonly string[]): string[] {
  return nomes.filter((n) => !process.env[n]?.trim());
}

export interface EnvCap {
  url: string;
  token: string;
}

export function envCap(): EnvCap | null {
  const f = faltando(CAP_VARS);
  if (f.length) {
    logServidor("error", `variável de ambiente ausente: ${f.join(", ")} — dashboard em estado vazio`);
    return null;
  }
  return {
    url: process.env.CAP_MANAGER_URL!.trim().replace(/\/+$/, ""),
    token: process.env.CAP_TOKEN_MICARETA!.trim(),
  };
}

export interface EnvGoogle {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  developerToken: string;
  loginCustomerId: string;
  apiVersion: string;
}

export function envGoogle(): EnvGoogle | null {
  const f = faltando(GOOGLE_VARS);
  if (f.length) {
    logServidor("error", `variável de ambiente ausente: ${f.join(", ")} — entrega do Google exibida como "aguardando dados"`);
    return null;
  }
  return {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID!.trim(),
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET!.trim(),
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN!.trim(),
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!.trim(),
    loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!.replace(/\D/g, ""),
    apiVersion: process.env.GOOGLE_ADS_API_VERSION?.trim() || "v25",
  };
}
