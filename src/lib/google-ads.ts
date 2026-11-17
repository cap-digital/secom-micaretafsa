import "server-only";
import { cacheLife } from "next/cache";
import { envGoogle, type EnvGoogle } from "./env";

/**
 * Google Ads API (REST) — OAuth com refresh token, login pela MCC.
 * IDs de conta/campanha vêm SEMPRE do cap-manager (argumentos).
 * O custo (cost_micros) devolvido aqui é GASTO DE PLATAFORMA: fica no servidor
 * e só é usado na regra de 3 em lib/dashboard.ts.
 */

// ---------------------------------------------------------------------------
// OAuth: troca do refresh token, com cache em memória até expirar
// ---------------------------------------------------------------------------

let tokenEmCache: { valor: string; expiraEm: number; chave: string } | null = null;
let tokenEmVoo: Promise<string> | null = null;

async function accessToken(env: EnvGoogle): Promise<string> {
  const chave = `${env.clientId}:${env.refreshToken.slice(-8)}`;
  if (tokenEmCache && tokenEmCache.chave === chave && tokenEmCache.expiraEm - 60_000 > Date.now()) {
    return tokenEmCache.valor;
  }
  if (tokenEmVoo) return tokenEmVoo;
  tokenEmVoo = (async () => {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: env.clientId,
        client_secret: env.clientSecret,
        refresh_token: env.refreshToken,
      }),
      cache: "no-store",
    });
    const j = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };
    if (!res.ok || !j.access_token) {
      throw new Error(`OAuth Google ${res.status}: ${j.error ?? ""} ${j.error_description ?? ""}`.trim());
    }
    tokenEmCache = { valor: j.access_token, expiraEm: Date.now() + (j.expires_in ?? 3600) * 1000, chave };
    return j.access_token;
  })();
  try {
    return await tokenEmVoo;
  } finally {
    tokenEmVoo = null;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function gaql(env: EnvGoogle, customerId: string, query: string): Promise<any[]> {
  const token = await accessToken(env);
  const res = await fetch(
    `https://googleads.googleapis.com/${env.apiVersion}/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "developer-token": env.developerToken,
        "login-customer-id": env.loginCustomerId,
        "content-type": "application/json",
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google Ads ${res.status}: ${txt.slice(0, 400)}`);
  }
  const lotes = (await res.json()) as { results?: any[] }[];
  return lotes.flatMap((l) => l.results ?? []);
}

// ---------------------------------------------------------------------------
// Tipos de retorno (servidor)
// ---------------------------------------------------------------------------

export interface DiaGoogle {
  data: string;
  /** gasto de plataforma em reais — NÃO exibir */
  custo: number;
  impressoes: number;
  cliques: number;
  impressoesVisiveis: number | null;
}

export interface AnuncioGoogle {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  imagemUrl: string | null;
  largura: number | null;
  altura: number | null;
  impressoes: number;
  cliques: number;
  /** gasto de plataforma em reais — NÃO exibir */
  custo: number;
}

export interface DadosGoogle {
  dias: DiaGoogle[];
  alcance: { usuarios: number; frequencia: number } | null;
  anuncios: AnuncioGoogle[];
  buscadoEm: string;
}

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

function dimensoesDoNome(nome: string): { w: number; h: number } | null {
  const m = nome.match(/(\d{2,4})\s*x\s*(\d{2,4})/i);
  return m ? { w: Number(m[1]), h: Number(m[2]) } : null;
}

// ---------------------------------------------------------------------------
// Busca (cache de no máximo 5 min)
// ---------------------------------------------------------------------------

/**
 * Busca dia a dia, alcance e anúncios das campanhas de uma estratégia.
 * `env` não entra como argumento do cache (segredos); é lido de novo dentro.
 */
export async function buscarGoogleEstrategia(
  customerId: string,
  campaignIds: string[],
  desde: string,
  ate: string,
): Promise<DadosGoogle> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 300 });

  const env = envGoogle();
  if (!env) throw new Error("credenciais do Google Ads ausentes");

  const ids = campaignIds.filter((c) => /^\d+$/.test(c));
  if (!ids.length) throw new Error("estratégia sem campaign_id numérico");
  const filtroCampanha = `campaign.id IN (${ids.join(",")})`;
  const filtroData = `segments.date BETWEEN '${desde}' AND '${ate}'`;

  // --- Por dia (com fallback se active_view não estiver disponível) ---
  let linhasDia: any[];
  let comVisiveis = true;
  try {
    linhasDia = await gaql(
      env,
      customerId,
      `SELECT segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.active_view_impressions
       FROM campaign WHERE ${filtroCampanha} AND ${filtroData}`,
    );
  } catch {
    comVisiveis = false;
    linhasDia = await gaql(
      env,
      customerId,
      `SELECT segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks
       FROM campaign WHERE ${filtroCampanha} AND ${filtroData}`,
    );
  }
  const porDia = new Map<string, DiaGoogle>();
  for (const r of linhasDia) {
    const data = r.segments?.date as string;
    const d = porDia.get(data) ?? { data, custo: 0, impressoes: 0, cliques: 0, impressoesVisiveis: comVisiveis ? 0 : null };
    d.custo += n(r.metrics?.costMicros) / 1_000_000;
    d.impressoes += n(r.metrics?.impressions);
    d.cliques += n(r.metrics?.clicks);
    if (d.impressoesVisiveis !== null) d.impressoesVisiveis += n(r.metrics?.activeViewImpressions);
    porDia.set(data, d);
  }

  // --- Alcance / frequência (opcional; só com 1 campanha, não é somável) ---
  let alcance: DadosGoogle["alcance"] = null;
  if (ids.length === 1) {
    try {
      const [r] = await gaql(
        env,
        customerId,
        `SELECT metrics.unique_users, metrics.average_impression_frequency_per_user
         FROM campaign WHERE ${filtroCampanha} AND ${filtroData}`,
      );
      if (r?.metrics?.uniqueUsers)
        alcance = { usuarios: n(r.metrics.uniqueUsers), frequencia: n(r.metrics.averageImpressionFrequencyPerUser) };
    } catch {
      alcance = null;
    }
  }

  // --- Por anúncio ---
  const linhasAd = await gaql(
    env,
    customerId,
    `SELECT ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type, ad_group_ad.status,
            ad_group_ad.ad.image_ad.image_url, ad_group_ad.ad.image_ad.pixel_width, ad_group_ad.ad.image_ad.pixel_height,
            ad_group_ad.ad.image_ad.name, ad_group_ad.ad.responsive_display_ad.marketing_images,
            ad_group_ad.ad.responsive_display_ad.square_marketing_images,
            metrics.impressions, metrics.clicks, metrics.ctr, metrics.cost_micros
     FROM ad_group_ad WHERE ${filtroCampanha} AND ${filtroData}`,
  );

  // Resolve os assets de imagem dos anúncios responsivos.
  const assetsPorAd = new Map<string, string[]>();
  for (const r of linhasAd) {
    const rda = r.adGroupAd?.ad?.responsiveDisplayAd;
    if (!rda) continue;
    const lista = [...(rda.marketingImages ?? []), ...(rda.squareMarketingImages ?? [])]
      .map((x: any) => x?.asset as string)
      .filter(Boolean);
    assetsPorAd.set(String(r.adGroupAd.ad.id), lista);
  }
  const todosAssets = [...new Set([...assetsPorAd.values()].flat())];
  const assetInfo = new Map<string, { url: string; w: number | null; h: number | null }>();
  if (todosAssets.length) {
    try {
      const linhasAsset = await gaql(
        env,
        customerId,
        `SELECT asset.resource_name, asset.image_asset.full_size.url,
                asset.image_asset.full_size.width_pixels, asset.image_asset.full_size.height_pixels
         FROM asset WHERE asset.resource_name IN (${todosAssets.map((a) => `'${a}'`).join(",")})`,
      );
      for (const a of linhasAsset) {
        const fs = a.asset?.imageAsset?.fullSize;
        if (fs?.url)
          assetInfo.set(a.asset.resourceName, {
            url: fs.url,
            w: fs.widthPixels ? n(fs.widthPixels) : null,
            h: fs.heightPixels ? n(fs.heightPixels) : null,
          });
      }
    } catch {
      /* sem preview: o dashboard usa o criativo local */
    }
  }

  const anuncios = new Map<string, AnuncioGoogle>();
  for (const r of linhasAd) {
    const ad = r.adGroupAd?.ad ?? {};
    const id = String(ad.id);
    const nome: string = ad.name || ad.imageAd?.name || `Anúncio ${id}`;
    let imagemUrl: string | null = ad.imageAd?.imageUrl ?? null;
    let largura: number | null = ad.imageAd?.pixelWidth ? n(ad.imageAd.pixelWidth) : null;
    let altura: number | null = ad.imageAd?.pixelHeight ? n(ad.imageAd.pixelHeight) : null;
    if (!imagemUrl) {
      const primeiro = (assetsPorAd.get(id) ?? []).map((a) => assetInfo.get(a)).find(Boolean);
      if (primeiro) {
        imagemUrl = primeiro.url;
        largura = largura ?? primeiro.w;
        altura = altura ?? primeiro.h;
      }
    }
    if (!largura || !altura) {
      const d = dimensoesDoNome(nome);
      if (d) {
        largura = d.w;
        altura = d.h;
      }
    }
    const atual = anuncios.get(id) ?? {
      id,
      nome,
      tipo: String(ad.type ?? ""),
      status: String(r.adGroupAd?.status ?? ""),
      imagemUrl,
      largura,
      altura,
      impressoes: 0,
      cliques: 0,
      custo: 0,
    };
    atual.impressoes += n(r.metrics?.impressions);
    atual.cliques += n(r.metrics?.clicks);
    atual.custo += n(r.metrics?.costMicros) / 1_000_000;
    anuncios.set(id, atual);
  }

  return {
    dias: [...porDia.values()].sort((a, b) => a.data.localeCompare(b.data)),
    alcance,
    anuncios: [...anuncios.values()],
    buscadoEm: new Date().toISOString(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
