import { z } from "zod";
import { and, eq, gt, gte, sql, type SQL } from "drizzle-orm";
import { schema, type DB } from "@/db";
import { TRADE_BY_SLUG, PAYMENT_SLUGS } from "@/data/trades";
import { AREA_BY_SLUG } from "@/data/areas";
import { fuzz, isInServiceArea } from "./geo";

/** Un trabajador "por barrios" aparece si alguno de sus barrios está a menos de esto del punto buscado. */
export const NEAR_KM = 3;
export const PAGE_SIZE = 30;

const flag = z.preprocess((v) => v === "1" || v === "on" || v === "true", z.boolean());
const one = (v: unknown) => (Array.isArray(v) ? v[0] : v);

export const SearchParams = z.object({
  oficio: z.preprocess(one, z.string().refine((s) => TRADE_BY_SLUG.has(s)).catch("plomeria")),
  zona: z.preprocess(one, z.string().refine((s) => AREA_BY_SLUG.has(s)).optional().catch(undefined)),
  lat: z.preprocess(one, z.coerce.number().min(-90).max(90).optional().catch(undefined)),
  lng: z.preprocess(one, z.coerce.number().min(-180).max(180).optional().catch(undefined)),
  ahora: z.preprocess(one, flag),
  urgencias: z.preprocess(one, flag),
  matricula: z.preprocess(one, flag),
  min: z.preprocess(one, z.coerce.number().int().min(1).max(5).optional().catch(undefined)),
  pago: z.preprocess((v) => (v == null ? [] : Array.isArray(v) ? v : [v]), z.array(z.enum(PAYMENT_SLUGS)).catch([])),
  orden: z.preprocess(one, z.enum(["disponible", "cerca", "calificacion"]).catch("disponible")),
  vista: z.preprocess(one, z.enum(["lista", "mapa"]).catch("lista")),
  pagina: z.preprocess(one, z.coerce.number().int().min(1).max(50).catch(1)),
});
export type Search = z.infer<typeof SearchParams>;

/** Lee los parámetros de la URL; lo inválido se ignora en vez de romper la página. */
export function parseSearch(params: Record<string, string | string[] | undefined>): Search {
  return SearchParams.parse(params);
}

/** El punto desde donde se mide la distancia: el barrio elegido o la ubicación del celular. */
export function searchOrigin(s: Search) {
  if (s.zona) {
    const a = AREA_BY_SLUG.get(s.zona)!;
    return { lat: a.lat, lng: a.lng, label: a.name };
  }
  if (s.lat != null && s.lng != null && isInServiceArea(s.lat, s.lng)) return { lat: s.lat, lng: s.lng, label: "tu ubicación" };
  return null;
}

/** Arma la URL de búsqueda conservando filtros. */
export function searchHref(s: Partial<Search>, patch: Partial<Search> = {}) {
  const m = { ...s, ...patch };
  const q = new URLSearchParams();
  if (m.oficio) q.set("oficio", m.oficio);
  if (m.zona) q.set("zona", m.zona);
  else if (m.lat != null && m.lng != null) { q.set("lat", String(m.lat)); q.set("lng", String(m.lng)); }
  if (m.ahora) q.set("ahora", "1");
  if (m.urgencias) q.set("urgencias", "1");
  if (m.matricula) q.set("matricula", "1");
  if (m.min) q.set("min", String(m.min));
  for (const p of m.pago ?? []) q.append("pago", p);
  if (m.orden && m.orden !== "disponible") q.set("orden", m.orden);
  if (m.vista === "mapa") q.set("vista", "mapa");
  if (m.pagina && m.pagina > 1) q.set("pagina", String(m.pagina));
  return `/buscar?${q}`;
}

const hav = (lat: number, lng: number, lat2: SQL | unknown, lng2: SQL | unknown) => sql<number>`(6371 * 2 * asin(sqrt(
  power(sin(radians(${lat2} - ${lat}) / 2), 2) +
  cos(radians(${lat})) * cos(radians(${lat2})) * power(sin(radians(${lng2} - ${lng}) / 2), 2))))`;

export type SearchResult = Awaited<ReturnType<typeof searchWorkers>>["rows"][number];

/**
 * Búsqueda por oficio y distancia en SQL plano (sin PostGIS).
 * shortcut: recorre todos los publicados del oficio; con decenas de miles sumar un recuadro lat/lng que use workers_geo_idx.
 */
export async function searchWorkers(db: DB, s: Search, now = new Date()) {
  const o = searchOrigin(s);
  if (!o) return { rows: [], total: 0 };
  const w = schema.workers;
  const minAreaDist = sql<number>`(select min(${hav(o.lat, o.lng, schema.workerAreas.lat, schema.workerAreas.lng)}) from ${schema.workerAreas} where ${schema.workerAreas.workerId} = ${w.id})`;
  const distance = sql<number>`case when ${w.zoneMode} = 'radius' then ${hav(o.lat, o.lng, w.baseLat, w.baseLng)} else ${minAreaDist} end`;
  const available = sql<boolean>`coalesce(${w.availableUntil} > ${now.toISOString()}::timestamptz, false)`;
  // Promedio bayesiano: 1 reseña de 5 estrellas no le gana a 40 reseñas de 4,8.
  const score = sql<number>`(${w.ratingAvg} * ${w.ratingCount} + 4 * 3) / (${w.ratingCount} + 3)`;

  const filters: (SQL | undefined)[] = [
    eq(w.status, "published"),
    sql`exists (select 1 from ${schema.workerTrades} where ${schema.workerTrades.workerId} = ${w.id} and ${schema.workerTrades.trade} = ${s.oficio})`,
    sql`(case when ${w.zoneMode} = 'radius' then ${hav(o.lat, o.lng, w.baseLat, w.baseLng)} <= ${w.radiusKm}
      else exists (select 1 from ${schema.workerAreas} where ${schema.workerAreas.workerId} = ${w.id}
        and (${schema.workerAreas.area} = ${s.zona ?? ""} or ${hav(o.lat, o.lng, schema.workerAreas.lat, schema.workerAreas.lng)} <= ${NEAR_KM})) end)`,
    s.ahora ? gt(w.availableUntil, now) : undefined,
    s.urgencias ? eq(w.urgencies, true) : undefined,
    s.matricula ? sql`${w.licenseNumber} is not null` : undefined,
    s.min ? and(gte(w.ratingAvg, s.min), gt(w.ratingCount, 0)) : undefined,
    // sql.raw es seguro acá: `pago` ya pasó por z.enum(PAYMENT_SLUGS), solo puede traer slugs conocidos.
    s.pago.length ? sql`${w.paymentMethods} @> ${sql.raw(`ARRAY[${s.pago.map((p) => `'${p}'`).join(",")}]::text[]`)}` : undefined,
  ];
  const where = and(...filters);

  const order = {
    disponible: [sql`${available} desc`, sql`${distance} asc`],
    cerca: [sql`${distance} asc`],
    calificacion: [sql`${score} desc`, sql`${distance} asc`],
  }[s.orden];

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: w.id, slug: w.slug, displayName: w.displayName, photoId: w.photoId,
      ratingAvg: w.ratingAvg, ratingCount: w.ratingCount, urgencies: w.urgencies,
      hasLicense: sql<boolean>`${w.licenseNumber} is not null`, available, distance,
      zoneMode: w.zoneMode, radiusKm: w.radiusKm, baseLat: w.baseLat, baseLng: w.baseLng,
      trades: sql<string[]>`array(select ${schema.workerTrades.trade} from ${schema.workerTrades} where ${schema.workerTrades.workerId} = ${w.id})`,
      // El barrio más cercano a la búsqueda va primero: es el que se lee en la tarjeta.
      areas: sql<string[]>`array(select ${schema.workerAreas.area} from ${schema.workerAreas} where ${schema.workerAreas.workerId} = ${w.id}
        order by ${hav(o.lat, o.lng, schema.workerAreas.lat, schema.workerAreas.lng)})`,
    }).from(w).where(where).orderBy(...order, w.id).limit(PAGE_SIZE).offset((s.pagina - 1) * PAGE_SIZE),
    db.select({ total: sql<number>`count(*)::int` }).from(w).where(where),
  ]);

  return {
    total,
    rows: rows.map(({ baseLat, baseLng, ...r }) => ({
      ...r,
      distance: Number(r.distance),
      // En el mapa nunca va el punto exacto: ~1 km de precisión.
      mapLat: baseLat == null ? null : fuzz(baseLat),
      mapLng: baseLng == null ? null : fuzz(baseLng),
    })),
  };
}
