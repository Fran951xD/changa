import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { TRADE_BY_SLUG } from "@/data/trades";
import { AREA_BY_SLUG, normalizeText } from "@/data/areas";

export const RESERVED_SLUGS = new Set([
  "buscar", "ingresar", "panel", "admin", "auth", "salir", "privacidad", "trabajadores", "api", "i",
  "sitemap", "robots", "presupuesto", "terminos", "ayuda", "changa", "contactar", "denunciar", "visita",
]);

export function slugify(s: string) {
  return normalizeText(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export async function uniqueSlug(base: string, ignoreWorkerId?: string) {
  const root = slugify(base) || "trabajador";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    if (RESERVED_SLUGS.has(candidate)) continue;
    const [taken] = await db.select({ id: schema.workers.id }).from(schema.workers).where(eq(schema.workers.slug, candidate));
    if (!taken || taken.id === ignoreWorkerId) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function getWorkerForUser(userId: string) {
  const [w] = await db.select().from(schema.workers).where(eq(schema.workers.userId, userId));
  if (!w) return null;
  return { ...w, ...(await workerRelations(w.id)) };
}

export async function getWorkerBySlug(slug: string) {
  const [w] = await db.select().from(schema.workers).where(eq(schema.workers.slug, slug));
  if (!w) return null;
  return { ...w, ...(await workerRelations(w.id)) };
}

async function workerRelations(workerId: string) {
  const [trades, areas, photos] = await Promise.all([
    db.select({ trade: schema.workerTrades.trade }).from(schema.workerTrades).where(eq(schema.workerTrades.workerId, workerId)),
    db.select({ area: schema.workerAreas.area }).from(schema.workerAreas).where(eq(schema.workerAreas.workerId, workerId)),
    db.select({ id: schema.workerPhotos.imageId }).from(schema.workerPhotos).where(eq(schema.workerPhotos.workerId, workerId)).orderBy(asc(schema.workerPhotos.position)),
  ]);
  return {
    trades: trades.map((t) => t.trade).filter((t) => TRADE_BY_SLUG.has(t)),
    areas: areas.map((a) => a.area).filter((a) => AREA_BY_SLUG.has(a)),
    photos: photos.map((p) => p.id),
  };
}

export type WorkerFull = NonNullable<Awaited<ReturnType<typeof getWorkerBySlug>>>;

export const isAvailable = (w: { availableUntil: Date | null }) => !!w.availableUntil && w.availableUntil > new Date();

/** Qué le falta al perfil para poder publicarse, en palabras del trabajador. */
export function missingForPublish(w: Pick<WorkerFull, "displayName" | "trades" | "areas" | "zoneMode" | "baseLat" | "radiusKm" | "phoneVerifiedAt">) {
  const missing: string[] = [];
  if (!w.displayName?.trim()) missing.push("tu nombre");
  if (w.trades.length === 0) missing.push("al menos un oficio");
  if (w.zoneMode === "areas" ? w.areas.length === 0 : w.baseLat == null || !w.radiusKm) missing.push("dónde trabajás");
  if (!w.phoneVerifiedAt) missing.push("verificar tu celular");
  return missing;
}

export function zoneLabel(w: Pick<WorkerFull, "zoneMode" | "areas" | "radiusKm">, baseName?: string) {
  if (w.zoneMode === "radius") return `Hasta ${w.radiusKm} km${baseName ? ` de ${baseName}` : ""}`;
  const names = w.areas.map((a) => AREA_BY_SLUG.get(a)!.name);
  return names.length > 3 ? `${names.slice(0, 3).join(", ")} y ${names.length - 3} más` : names.join(", ");
}
