import { DEGRADE } from "@/lib/cores";

/**
 * Fundo fixo da página: degradê quente (amarelo-ouro → laranja → laranja-queimado),
 * raios de sol sutis e confetes em baixa opacidade. Cores inline (não dependem de CSS).
 * Posições dos confetes são fixas (determinísticas) — nada de Math.random no render.
 */
const CONFETES: { x: number; y: number; r: number; w: number; h: number; c: string }[] = [
  { x: 6, y: 18, r: 24, w: 14, h: 6, c: "#ffffff" },
  { x: 14, y: 62, r: -18, w: 10, h: 5, c: "#2f6db5" },
  { x: 22, y: 34, r: 40, w: 12, h: 5, c: "#fff3c4" },
  { x: 31, y: 82, r: 12, w: 14, h: 6, c: "#ffffff" },
  { x: 38, y: 12, r: -32, w: 9, h: 4, c: "#47aae5" },
  { x: 47, y: 55, r: 65, w: 12, h: 5, c: "#ffffff" },
  { x: 55, y: 28, r: -8, w: 14, h: 6, c: "#fff3c4" },
  { x: 63, y: 74, r: 28, w: 10, h: 5, c: "#2f6db5" },
  { x: 71, y: 16, r: 52, w: 12, h: 5, c: "#ffffff" },
  { x: 79, y: 46, r: -40, w: 14, h: 6, c: "#fff3c4" },
  { x: 86, y: 88, r: 18, w: 10, h: 4, c: "#47aae5" },
  { x: 93, y: 30, r: -22, w: 13, h: 5, c: "#ffffff" },
  { x: 9, y: 92, r: 70, w: 11, h: 5, c: "#fff3c4" },
  { x: 58, y: 94, r: -60, w: 12, h: 5, c: "#ffffff" },
  { x: 97, y: 66, r: 35, w: 9, h: 4, c: "#2f6db5" },
];

export function FundoMicareta() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: `${DEGRADE.brilho}, ${DEGRADE.raios}, ${DEGRADE.fundo}` }}
    >
      <svg className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none">
        {CONFETES.map((c, i) => (
          <rect
            key={i}
            x={`${c.x}%`}
            y={`${c.y}%`}
            width={c.w}
            height={c.h}
            rx={2}
            fill={c.c}
            transform={`rotate(${c.r})`}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        ))}
      </svg>
    </div>
  );
}
