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
  /** texto sobre o degradê laranja (contraste ≥ 7:1 no amarelo e no laranja) */
  sobreLaranja: "#3A1A05",
} as const;

/** Degradês críticos (inline, sem depender de variável CSS). */
export const DEGRADE = {
  /** fundo da página: amarelo-ouro → laranja → laranja-queimado */
  fundo: "linear-gradient(180deg, #F3C34A 0%, #EF9D3B 38%, #E5762E 70%, #C9551F 100%)",
  /** raios de sol sutis a partir do topo */
  raios: "repeating-conic-gradient(from -90deg at 50% -6%, rgba(255,255,255,0.045) 0deg 5deg, transparent 5deg 13deg)",
  brilho: "radial-gradient(ellipse 90% 55% at 50% -8%, rgba(255,246,214,0.5), transparent 62%)",
  /** banner azul royal liso */
  azul: "linear-gradient(110deg, #1E4E9C 0%, #2F6DB5 100%)",
  /** tile do logo (mesmo fundo do print) */
  tileLogo: "linear-gradient(180deg, #E8B141 0%, #E58038 100%)",
} as const;

/** Gênero: par validado (CVD + contraste; texto branco ≥ 4,2:1); "Não identificado" neutro. */
export const COR_GENERO: Record<string, string> = {
  FEMALE: COR.azul,
  MALE: COR.laranjaEscuro,
  UNDETERMINED: COR.neutro,
};
