"use client";

import { useState } from "react";

/** Preview com fallback: imagem da API do Google → criativo local → placeholder. */
export function CriativoImagem({
  remota,
  local,
  alt,
  formato,
}: {
  remota: string | null;
  local: string | null;
  alt: string;
  formato: string;
}) {
  const fontes = [remota, local].filter((s): s is string => !!s);
  const [idx, setIdx] = useState(0);
  const src = fontes[idx];

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-md bg-papel text-xs text-texto-3">
        {formato}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- previews externos do Google (domínio dinâmico)
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setIdx((i) => i + 1)}
      className="h-full w-full object-contain"
    />
  );
}
