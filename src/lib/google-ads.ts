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
// Tipos de retorno (servidor) — `custo` é GASTO DE PLATAFORMA: nunca exibir
// ---------------------------------------------------------------------------

export interface DiaGoogle {
  data: string;
  custo: number;
  impressoes: number;
  cliques: number;
}

export interface MetricasLinha {
  impressoes: number;
  cliques: number;
  custo: number;
}

export interface AnuncioGoogle extends MetricasLinha {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  imagemUrl: string | null;
  largura: number | null;
  altura: number | null;
}

export interface LinhaSegmento extends MetricasLinha {
  /** GENDER / AGE_RANGE enum do Google */
  tipo: string;
}

export interface CidadeGoogle extends MetricasLinha {
  /** resource name do geo_target_constant (null = não identificado) */
  geo: string | null;
  /** criterion id do país (2076 = Brasil) */
  pais: string | null;
  nome: string | null;
  canonico: string | null;
}

/** Critério de localização da campanha (aba "Locais"), com entrega do location_view. */
export interface LocalSegmentado {
  id: string;
  tipo: "PROXIMITY" | "LOCATION" | string;
  rotulo: string;
  ativo: boolean;
  impressoes: number;
  cliques: number;
}

export interface Raio {
  lat: number;
  lng: number;
  km: number;
  endereco: string | null;
}

export interface SegmentacaoGeo {
  /** PRESENCE_OR_INTEREST | PRESENCE | ... */
  tipoGeo: string | null;
  raios: Raio[];
  locais: LocalSegmentado[];
}

export interface DiarioGoogle {
  dias: DiaGoogle[];
  buscadoEm: string;
}

export interface RecortesGoogle {
  anuncios: AnuncioGoogle[];
  genero: LinhaSegmento[];
  idade: LinhaSegmento[];
  cidades: CidadeGoogle[];
  segmentacao: SegmentacaoGeo;
  buscadoEm: string;
}

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const metricas = (r: any): MetricasLinha => ({
  impressoes: n(r.metrics?.impressions),
  cliques: n(r.metrics?.clicks),
  custo: n(r.metrics?.costMicros) / 1_000_000,
});
const somar = (a: MetricasLinha, b: MetricasLinha) => {
  a.impressoes += b.impressoes;
  a.cliques += b.cliques;
  a.custo += b.custo;
};

const fmtKm = (km: number) => (Number.isInteger(km) ? String(km) : km.toFixed(1).replace(".", ","));

function dimensoesDoNome(nome: string): { w: number; h: number } | null {
  const m = nome.match(/(\d{2,4})\s*x\s*(\d{2,4})/i);
  return m ? { w: Number(m[1]), h: Number(m[2]) } : null;
}

function filtros(campaignIds: string[], desde: string, ate: string) {
  const ids = campaignIds.filter((c) => /^\d+$/.test(c));
  if (!ids.length) throw new Error("estratégia sem campaign_id numérico");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(ate)) throw new Error("datas inválidas");
  return { ids, where: `campaign.id IN (${ids.join(",")}) AND segments.date BETWEEN '${desde}' AND '${ate}'` };
}

function envObrigatorio(): EnvGoogle {
  const env = envGoogle();
  if (!env) throw new Error("credenciais do Google Ads ausentes");
  return env;
}

// ---------------------------------------------------------------------------
// Série diária — período inteiro da estratégia (base da regra 5.4)
// ---------------------------------------------------------------------------

export async function buscarGoogleDiario(
  customerId: string,
  campaignIds: string[],
  desde: string,
  ate: string,
): Promise<DiarioGoogle> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 300 });

  const env = envObrigatorio();
  const { where } = filtros(campaignIds, desde, ate);
  const linhas = await gaql(
    env,
    customerId,
    `SELECT segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks FROM campaign WHERE ${where}`,
  );
  const porDia = new Map<string, DiaGoogle>();
  for (const r of linhas) {
    const data = r.segments?.date as string;
    const d = porDia.get(data) ?? { data, custo: 0, impressoes: 0, cliques: 0 };
    somar(d, metricas(r));
    porDia.set(data, d);
  }
  return {
    dias: [...porDia.values()].sort((a, b) => a.data.localeCompare(b.data)),
    buscadoEm: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Recortes — intervalo filtrado (criativos, gênero, idade, cidades)
// ---------------------------------------------------------------------------

const BRASIL = "2076";
/** geo_target_constant por consulta (IN) ao resolver nomes. */
const LOTE_GEO = 300;

export async function buscarGoogleRecortes(
  customerId: string,
  campaignIds: string[],
  desde: string,
  ate: string,
): Promise<RecortesGoogle> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 300 });

  const env = envObrigatorio();
  const { ids, where } = filtros(campaignIds, desde, ate);
  const soCampanha = `campaign.id IN (${ids.join(",")})`;

  const [linhasAd, linhasGenero, linhasIdade, linhasLocal, linhasConfig, linhasCriterios, linhasLocais] = await Promise.all([
    gaql(
      env,
      customerId,
      `SELECT ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type, ad_group_ad.status,
              ad_group_ad.ad.image_ad.image_url, ad_group_ad.ad.image_ad.pixel_width, ad_group_ad.ad.image_ad.pixel_height,
              ad_group_ad.ad.image_ad.name, ad_group_ad.ad.responsive_display_ad.marketing_images,
              ad_group_ad.ad.responsive_display_ad.square_marketing_images,
              metrics.impressions, metrics.clicks, metrics.cost_micros
       FROM ad_group_ad WHERE ${where}`,
    ),
    gaql(
      env,
      customerId,
      `SELECT ad_group_criterion.gender.type, metrics.impressions, metrics.clicks, metrics.cost_micros
       FROM gender_view WHERE ${where}`,
    ).catch(() => []),
    gaql(
      env,
      customerId,
      `SELECT ad_group_criterion.age_range.type, metrics.impressions, metrics.clicks, metrics.cost_micros
       FROM age_range_view WHERE ${where}`,
    ).catch(() => []),
    gaql(
      env,
      customerId,
      `SELECT campaign.id, user_location_view.country_criterion_id, segments.geo_target_city,
              metrics.impressions, metrics.clicks, metrics.cost_micros
       FROM user_location_view WHERE ${where}`,
    ).catch(() => []),
    gaql(
      env,
      customerId,
      `SELECT campaign.geo_target_type_setting.positive_geo_target_type FROM campaign WHERE ${soCampanha}`,
    ).catch(() => []),
    gaql(
      env,
      customerId,
      `SELECT campaign_criterion.criterion_id, campaign_criterion.type, campaign_criterion.negative,
              campaign_criterion.proximity.radius, campaign_criterion.proximity.radius_units,
              campaign_criterion.proximity.geo_point.latitude_in_micro_degrees,
              campaign_criterion.proximity.geo_point.longitude_in_micro_degrees,
              campaign_criterion.proximity.address.street_address, campaign_criterion.proximity.address.city_name,
              campaign_criterion.location.geo_target_constant
       FROM campaign_criterion
       WHERE ${soCampanha} AND campaign_criterion.type IN (LOCATION, PROXIMITY) AND campaign_criterion.status != REMOVED`,
    ).catch(() => []),
    gaql(
      env,
      customerId,
      `SELECT campaign_criterion.criterion_id, campaign_criterion.type, metrics.impressions, metrics.clicks
       FROM location_view WHERE ${where}`,
    ).catch(() => []),
  ]);

  // --- Gênero / idade (agrupados pelo tipo) ---
  const agrupar = (linhas: any[], campo: (r: any) => string | undefined) => {
    const m = new Map<string, LinhaSegmento>();
    for (const r of linhas) {
      const tipo = campo(r) ?? "UNDETERMINED";
      const l = m.get(tipo) ?? { tipo, impressoes: 0, cliques: 0, custo: 0 };
      somar(l, metricas(r));
      m.set(tipo, l);
    }
    return [...m.values()];
  };
  const genero = agrupar(linhasGenero, (r) => r.adGroupCriterion?.gender?.type);
  const idade = agrupar(linhasIdade, (r) => r.adGroupCriterion?.ageRange?.type);

  // --- Cidades (localização física do usuário) ---
  const porCidade = new Map<string, CidadeGoogle>();
  for (const r of linhasLocal) {
    const geo = (r.segments?.geoTargetCity as string | undefined) ?? null;
    const pais = r.userLocationView?.countryCriterionId ? String(r.userLocationView.countryCriterionId) : null;
    const k = geo ?? "—";
    const c = porCidade.get(k) ?? { geo, pais, nome: null, canonico: null, impressoes: 0, cliques: 0, custo: 0 };
    somar(c, metricas(r));
    porCidade.set(k, c);
  }
  const cidades = [...porCidade.values()].sort((a, b) => b.impressoes - a.impressoes);
  // --- Critérios de localização (raio / locais) e tipo de segmentação geográfica ---
  const tipoGeo: string | null =
    linhasConfig[0]?.campaign?.geoTargetTypeSetting?.positiveGeoTargetType ?? null;
  const raios: Raio[] = [];
  const ativos = new Map<string, { tipo: string; rotulo: string | null; geo: string | null }>();
  for (const r of linhasCriterios) {
    const cc = r.campaignCriterion ?? {};
    if (cc.negative) continue;
    const id = String(cc.criterionId);
    if (cc.type === "PROXIMITY" && cc.proximity) {
      const px = cc.proximity;
      const km = n(px.radius) * (px.radiusUnits === "MILES" ? 1.609344 : 1);
      const endereco = px.address?.streetAddress || px.address?.cityName || null;
      raios.push({
        lat: n(px.geoPoint?.latitudeInMicroDegrees) / 1e6,
        lng: n(px.geoPoint?.longitudeInMicroDegrees) / 1e6,
        km,
        endereco,
      });
      ativos.set(id, { tipo: "PROXIMITY", rotulo: `Raio de ${fmtKm(km)} km${endereco ? ` · ${endereco}` : ""}`, geo: null });
    } else if (cc.type === "LOCATION") {
      ativos.set(id, { tipo: "LOCATION", rotulo: null, geo: cc.location?.geoTargetConstant ?? `geoTargetConstants/${id}` });
    }
  }
  const locaisMap = new Map<string, LocalSegmentado>();
  for (const r of linhasLocais) {
    const cc = r.campaignCriterion ?? {};
    const id = String(cc.criterionId);
    const l = locaisMap.get(id) ?? {
      id,
      tipo: String(cc.type ?? ""),
      rotulo: ativos.get(id)?.rotulo ?? "",
      ativo: ativos.has(id),
      impressoes: 0,
      cliques: 0,
    };
    l.impressoes += n(r.metrics?.impressions);
    l.cliques += n(r.metrics?.clicks);
    locaisMap.set(id, l);
  }
  for (const [id, a] of ativos)
    if (!locaisMap.has(id)) locaisMap.set(id, { id, tipo: a.tipo, rotulo: a.rotulo ?? "", ativo: true, impressoes: 0, cliques: 0 });

  // --- Nomes: todas as cidades do Brasil + critérios LOCATION (lotes) ---
  const geosLocais = [...locaisMap.values()]
    .filter((l) => l.tipo === "LOCATION")
    .map((l) => ativos.get(l.id)?.geo ?? `geoTargetConstants/${l.id}`);
  const aResolver = [
    ...new Set([...cidades.filter((c) => c.geo && c.pais === BRASIL).map((c) => c.geo!), ...geosLocais]),
  ];
  const info = new Map<string, { name?: string; canonicalName?: string }>();
  for (let i = 0; i < aResolver.length; i += LOTE_GEO) {
    const lote = aResolver.slice(i, i + LOTE_GEO);
    try {
      const geos = await gaql(
        env,
        customerId,
        `SELECT geo_target_constant.resource_name, geo_target_constant.name, geo_target_constant.canonical_name
         FROM geo_target_constant
         WHERE geo_target_constant.resource_name IN (${lote.map((g) => `'${g}'`).join(",")})`,
      );
      for (const g of geos) info.set(g.geoTargetConstant?.resourceName, g.geoTargetConstant);
    } catch {
      /* lote sem nome: cidades entram em "Demais localidades" */
    }
  }
  for (const c of cidades) {
    const g = c.geo ? info.get(c.geo) : undefined;
    if (g) {
      c.nome = g.name ?? null;
      c.canonico = g.canonicalName ?? null;
    }
  }
  for (const l of locaisMap.values()) {
    if (l.tipo !== "LOCATION") continue;
    const g = info.get(ativos.get(l.id)?.geo ?? `geoTargetConstants/${l.id}`);
    l.rotulo = g?.canonicalName ?? g?.name ?? `Local ${l.id}`;
  }
  for (const l of locaisMap.values()) if (!l.rotulo) l.rotulo = l.tipo === "PROXIMITY" ? "Raio" : `Local ${l.id}`;
  const segmentacao: SegmentacaoGeo = {
    tipoGeo,
    raios,
    locais: [...locaisMap.values()].sort((a, b) => Number(b.ativo) - Number(a.ativo) || b.impressoes - a.impressoes),
  };

  // --- Anúncios (+ assets dos responsivos) ---
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
    if (!anuncios.has(id)) {
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
      anuncios.set(id, {
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
      });
    }
    somar(anuncios.get(id)!, metricas(r));
  }

  return {
    anuncios: [...anuncios.values()],
    genero,
    idade,
    cidades,
    segmentacao,
    buscadoEm: new Date().toISOString(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
