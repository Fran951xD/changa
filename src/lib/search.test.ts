import { beforeAll, describe, expect, it } from "vitest";
import { createDb, schema, type DB } from "@/db";
import { runMigrations } from "@/db/migrate";
import { AREA_BY_SLUG } from "@/data/areas";
import { parseSearch, searchHref, searchOrigin, searchWorkers } from "./search";

// Base Postgres real en memoria (PGlite): prueba el SQL tal cual corre en producción.
let db: DB;
const now = new Date("2026-06-15T15:00:00Z");

async function addWorker(name: string, opts: {
  trade?: string; areas?: string[]; radius?: { area: string; km: number }; available?: boolean;
  rating?: [number, number]; urgencies?: boolean; license?: boolean; payments?: string[]; status?: "published" | "draft";
}) {
  const [u] = await db.insert(schema.users).values({ email: `${name}@t.test` }).returning();
  const base = AREA_BY_SLUG.get(opts.radius?.area ?? opts.areas![0])!;
  const [w] = await db.insert(schema.workers).values({
    userId: u.id, slug: name, displayName: name, status: opts.status ?? "published",
    zoneMode: opts.radius ? "radius" : "areas", baseLat: base.lat, baseLng: base.lng, radiusKm: opts.radius?.km,
    availableUntil: opts.available ? new Date(now.getTime() + 3600_000) : new Date(now.getTime() - 3600_000),
    ratingAvg: opts.rating?.[0] ?? 0, ratingCount: opts.rating?.[1] ?? 0,
    urgencies: opts.urgencies ?? false, licenseNumber: opts.license ? "M-1" : null, paymentMethods: opts.payments ?? ["efectivo"],
  }).returning();
  await db.insert(schema.workerTrades).values({ workerId: w.id, trade: opts.trade ?? "electricidad" });
  for (const a of opts.areas ?? []) {
    const area = AREA_BY_SLUG.get(a)!;
    await db.insert(schema.workerAreas).values({ workerId: w.id, area: a, lat: area.lat, lng: area.lng });
  }
}

const search = (q: Record<string, string | string[]>) => searchWorkers(db, parseSearch(q), now).then((r) => r.rows.map((x) => x.slug));

beforeAll(async () => {
  db = createDb("memory");
  await runMigrations(db, "memory");
  await addWorker("palermo-disponible", { areas: ["palermo"], available: true, rating: [4.2, 5] });
  await addWorker("palermo-estrella", { areas: ["palermo", "colegiales"], rating: [4.9, 40], license: true, payments: ["efectivo", "mercadopago"] });
  await addWorker("villa-crespo", { areas: ["villa-crespo"], urgencies: true, rating: [5, 1] }); // ~2,5 km de Palermo
  await addWorker("quilmes", { areas: ["quilmes"] });
  await addWorker("radio-belgrano", { radius: { area: "belgrano", km: 5 } }); // Palermo queda a ~3,6 km
  await addWorker("radio-chico-flores", { radius: { area: "flores", km: 2 } });
  await addWorker("plomero-palermo", { areas: ["palermo"], trade: "plomeria" });
  await addWorker("borrador-palermo", { areas: ["palermo"], status: "draft" });
});

describe("searchWorkers", () => {
  it("encuentra por oficio y zona, incluido el radio en km, y deja afuera lo lejano o no publicado", async () => {
    const r = await search({ oficio: "electricidad", zona: "palermo" });
    expect(r.sort()).toEqual(["palermo-disponible", "palermo-estrella", "radio-belgrano", "villa-crespo"]);
  });

  it("por defecto pone primero a quien está disponible ahora", async () => {
    expect((await search({ oficio: "electricidad", zona: "palermo" }))[0]).toBe("palermo-disponible");
  });

  it("ordena por calificación con promedio bayesiano (1 reseña de 5 no gana a 40 de 4,9)", async () => {
    const r = await search({ oficio: "electricidad", zona: "palermo", orden: "calificacion" });
    expect(r.indexOf("palermo-estrella")).toBeLessThan(r.indexOf("villa-crespo"));
  });

  it("ordena por cercanía", async () => {
    const r = await search({ oficio: "electricidad", zona: "palermo", orden: "cerca" });
    expect(r.slice(-1)).toEqual(["radio-belgrano"]);
  });

  it("aplica filtros: disponible, urgencias, matrícula, calificación mínima y medios de pago", async () => {
    expect(await search({ oficio: "electricidad", zona: "palermo", ahora: "1" })).toEqual(["palermo-disponible"]);
    expect(await search({ oficio: "electricidad", zona: "palermo", urgencias: "1" })).toEqual(["villa-crespo"]);
    expect(await search({ oficio: "electricidad", zona: "palermo", matricula: "1" })).toEqual(["palermo-estrella"]);
    expect(await search({ oficio: "electricidad", zona: "palermo", min: "5" })).toEqual(["villa-crespo"]);
    expect(await search({ oficio: "electricidad", zona: "palermo", pago: ["mercadopago"] })).toEqual(["palermo-estrella"]);
  });

  it("busca desde la ubicación del celular", async () => {
    const q = AREA_BY_SLUG.get("quilmes")!;
    expect(await search({ oficio: "electricidad", lat: String(q.lat), lng: String(q.lng) })).toEqual(["quilmes"]);
  });

  it("no publica la ubicación exacta en el mapa", async () => {
    const { rows } = await searchWorkers(db, parseSearch({ oficio: "electricidad", zona: "belgrano" }), now);
    const r = rows.find((x) => x.slug === "radio-belgrano")!;
    expect(String(r.mapLat).split(".")[1].length).toBeLessThanOrEqual(2);
  });
});

describe("parseSearch", () => {
  it("ignora valores inválidos en vez de fallar", () => {
    const s = parseSearch({ oficio: "astronauta", zona: "marte", orden: "pagar-para-aparecer", min: "9", pagina: "-3" });
    expect(s).toMatchObject({ oficio: "plomeria", zona: undefined, orden: "disponible", min: undefined, pagina: 1 });
    expect(searchOrigin(s)).toBeNull();
  });

  it("ubicaciones fuera del GBA no tienen origen", () => {
    expect(searchOrigin(parseSearch({ lat: "40.4", lng: "-3.7" }))).toBeNull();
  });

  it("arma URLs conservando filtros", () => {
    const s = parseSearch({ oficio: "gas", zona: "flores", matricula: "1", pago: ["efectivo", "debito"] });
    expect(searchHref(s, { vista: "mapa" })).toBe("/buscar?oficio=gas&zona=flores&matricula=1&pago=efectivo&pago=debito&vista=mapa");
  });
});
