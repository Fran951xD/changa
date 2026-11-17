import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { TRADE_BY_SLUG } from "@/data/trades";
import { AREA_BY_SLUG, nearestArea } from "@/data/areas";
import { siteUrl } from "@/lib/share";

export const dynamic = "force-dynamic"; // lee la base: no se puede generar en el build

/** Perfiles publicados + páginas oficio/zona que tienen al menos un trabajador (sin páginas vacías). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const w = schema.workers;
  const [workers, trades, areas] = await Promise.all([
    db.select({ id: w.id, slug: w.slug, updatedAt: w.updatedAt, zoneMode: w.zoneMode, lat: w.baseLat, lng: w.baseLng }).from(w).where(eq(w.status, "published")),
    db.select().from(schema.workerTrades),
    db.select({ workerId: schema.workerAreas.workerId, area: schema.workerAreas.area }).from(schema.workerAreas),
  ]);
  const combos = new Set<string>();
  for (const wk of workers) {
    const wAreas = wk.zoneMode === "areas" ? areas.filter((a) => a.workerId === wk.id).map((a) => a.area) : wk.lat != null ? [nearestArea(wk.lat, wk.lng!).slug] : [];
    for (const t of trades.filter((t) => t.workerId === wk.id)) {
      const plural = TRADE_BY_SLUG.get(t.trade)?.plural;
      for (const a of wAreas) if (plural && AREA_BY_SLUG.has(a)) combos.add(`${plural}/${a}`);
    }
  }
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/trabajadores`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.1 },
    ...[...combos].map((c) => ({ url: `${base}/${c}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...workers.map((wk) => ({ url: `${base}/${wk.slug}`, lastModified: wk.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
