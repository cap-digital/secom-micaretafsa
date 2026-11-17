/**
 * Paleta Micareta de Feira 2026 (extraída dos prints oficiais) em HEX.
 * Use estas constantes em `style` inline sempre que cor ou largura forem
 * dinâmicas: não dependem de variável CSS nem de classe Tailwind gerada
 * (um CSS desatualizado no dev server deixava barras transparentes).
 */
export const COR = {
  azul: "#2F6DB5",
  azulEscuro: "#1E4E9C",
  azulCeu: "#47AAE5",
  azulSuave: "#E6EEF8",
  laranja: "#E0702A",
  laranjaEscuro: "#C85A1E",
  laranjaSuave: "#FCE9DC",
  amarelo: "#F0C848",
  amareloSuave: "#FCF1CF",
  verde: "#1F8A4C",
  verdeSuave: "#DDF2E5",
  vermelho: "#B4232A",
  vermelhoSuave: "#FBE3E2",
  trilho: "#E7E3DD",
  neutro: "#C9C5BE",
  grade: "#ECE8E2",
  eixo: "#8A847C",
  texto: "#1F1A17",
  texto2: "#5E5750",
  card: "#F6F5F3",
} as const;

/** Gênero: par validado (CVD + contraste; texto branco ≥ 4,2:1); "Não identificado" neutro. */
export const COR_GENERO: Record<string, string> = {
  FEMALE: COR.azul,
  MALE: COR.laranjaEscuro,
  UNDETERMINED: COR.neutro,
};
