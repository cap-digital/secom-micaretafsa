/**
 * Configuração de exibição que a API não fornece.
 * NÃO coloque aqui valores, metas, datas, status ou IDs — esses vêm sempre da API.
 */

/** Criativos locais em public/criativos (fallback de preview por dimensão). */
export const CRIATIVOS_LOCAIS: Record<string, string> = {
  "300x250": "/criativos/300x250.gif",
  "160x600": "/criativos/160x600.gif",
};

/**
 * Praças: mostrar ao cliente a linha "Demais localidades" (impressões fora do
 * raio segmentado — a campanha usa presença OU interesse). O dinheiro dessa
 * linha continua contando no fechamento com o investido, mesmo oculta.
 */
export const mostrarDemaisLocalidades = true;

/** Praças: máximo de municípios do raio listados um a um (o resto vira "Outros municípios do raio"). */
export const MAX_MUNICIPIOS_RAIO = 9;
