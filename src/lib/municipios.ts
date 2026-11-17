import "server-only";
import municipios from "@/config/municipios-br.json";

/**
 * Coordenadas dos municípios brasileiros (base pública IBGE, via
 * github.com/kelvins/municipios-brasileiros). Chave: "estado|municipio"
 * normalizados (minúsculas, sem acento). Fica só no servidor.
 */
const BASE = municipios as unknown as Record<string, [string, string, number, number]>;

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export interface Municipio {
  nome: string;
  uf: string;
  lat: number;
  lng: number;
}

/** Resolve a partir do canonical_name do Google: "Feira de Santana,State of Bahia,Brazil". */
export function localizarMunicipio(nome: string | null, canonico: string | null): Municipio | null {
  if (!nome || !canonico) return null;
  const partes = canonico.split(",").map((p) => p.trim());
  if (partes[partes.length - 1] !== "Brazil" || partes.length < 3) return null;
  let estado = normalizar(partes[partes.length - 2].replace(/^State of /i, ""));
  if (estado === "federal district") estado = "distrito federal";
  const m = BASE[`${estado}|${normalizar(nome)}`];
  return m ? { nome: m[0], uf: m[1], lat: m[2], lng: m[3] } : null;
}
