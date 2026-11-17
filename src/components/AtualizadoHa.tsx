"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

const INTERVALO_TICK = 30_000;
const INTERVALO_REFRESH = 5 * 60_000;

function assinar(cb: () => void) {
  const id = setInterval(cb, INTERVALO_TICK);
  return () => clearInterval(id);
}
const agora = () => Math.floor(Date.now() / INTERVALO_TICK) * INTERVALO_TICK;
const agoraServidor = () => null;

/** Selo "Atualizado há X min" + refresh automático (dashboard vivo). */
export function AtualizadoHa({ em }: { em: string }) {
  const router = useRouter();
  const ts = useSyncExternalStore(assinar, agora, agoraServidor);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), INTERVALO_REFRESH);
    return () => clearInterval(id);
  }, [router]);

  let texto = "Atualizado";
  if (ts !== null) {
    const min = Math.max(0, Math.floor((ts - new Date(em).getTime()) / 60_000));
    texto = min < 1 ? "Atualizado agora" : `Atualizado há ${min} min`;
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-borda bg-white px-2.5 py-1 text-xs font-medium text-texto-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lima opacity-75 motion-reduce:hidden" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4f9a1c]" />
      </span>
      {texto}
    </span>
  );
}
