import { connection } from "next/server";
import { carregarDashboard, totaisRecortes } from "@/lib/dashboard";

/**
 * Verificação interna (somente em desenvolvimento): totais em centavos BRUTOS
 * de cada recorte do intervalo, para conferir que todos fecham com o investido.
 * Não expõe dado de plataforma. Em produção responde 404.
 */
export async function GET(req: Request) {
  await connection();
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const u = new URL(req.url);
  const r = await carregarDashboard({ de: u.searchParams.get("de") ?? undefined, ate: u.searchParams.get("ate") ?? undefined });
  if (r.estado !== "ok") return Response.json({ estado: r.estado, titulo: r.titulo });
  const t = totaisRecortes(r.payload);
  const fecha = Object.values(t).every((v) => v === t.investido);
  return Response.json({ periodo: r.payload.periodo, totaisCent: t, fecha });
}
