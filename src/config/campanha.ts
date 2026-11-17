/**
 * Textos descritivos que a API do cap-manager não fornece.
 * NÃO coloque aqui valores, metas, datas, status ou IDs — esses vêm sempre da API.
 */

/** Segmentação exibida no card da estratégia, por nome de estratégia (minúsculas). */
export const SEGMENTACAO_POR_ESTRATEGIA: Record<string, string> = {
  alcance: "Demográfico + sitelist · Feira de Santana e região · AS 18+ ABCDE",
};

/** Rótulo de plataforma para o cliente. */
export const ROTULO_PLATAFORMA: Record<string, string> = {
  google: "Google Ads · Rede de Display",
  meta: "Meta Ads",
  tiktok: "TikTok Ads",
  linkedin: "LinkedIn Ads",
  spotify: "Spotify Ads",
  programatica: "Programática",
};

/** Criativos locais em public/criativos (fallback de preview por dimensão). */
export const CRIATIVOS_LOCAIS: Record<string, string> = {
  "300x250": "/criativos/300x250.gif",
  "160x600": "/criativos/160x600.gif",
};
