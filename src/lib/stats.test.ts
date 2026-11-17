import { beforeAll, describe, expect, it } from "vitest";
import { createDb, schema, type DB } from "@/db";
import { runMigrations } from "@/db/migrate";
import { last7Days, weekStart, weeklyStats } from "./stats";

let db: DB;
let workerId: string;
const now = new Date("2026-06-17T15:00:00Z"); // miércoles

beforeAll(async () => {
  db = createDb("memory");
  await runMigrations(db, "memory");
  const [u] = await db.insert(schema.users).values({ email: "s@t.test" }).returning();
  const [w] = await db.insert(schema.workers).values({ userId: u.id, slug: "s", displayName: "S" }).returning();
  workerId = w.id;
  await db.insert(schema.profileViews).values([
    { workerId, day: "2026-06-15", count: 4 }, { workerId, day: "2026-06-17", count: 3 }, // esta semana: 7
    { workerId, day: "2026-06-08", count: 5 }, // semana anterior
    { workerId, day: "2026-01-01", count: 99 }, // fuera del rango
  ]);
  await db.insert(schema.contacts).values([
    { workerId, visitorId: "a", channel: "whatsapp", createdAt: new Date("2026-06-16T12:00:00Z") },
    { workerId, visitorId: "b", channel: "whatsapp", createdAt: new Date("2026-06-16T13:00:00Z") },
    { workerId, visitorId: "c", channel: "call", createdAt: new Date("2026-06-10T13:00:00Z") },
    // Domingo 14/6 a las 23:30 en Buenos Aires (lunes 02:30 UTC): cuenta en la semana anterior.
    { workerId, visitorId: "d", channel: "quote", createdAt: new Date("2026-06-15T02:30:00Z") },
  ]);
});

describe("weeklyStats", () => {
  it("agrupa visitas y contactos por semana (lunes a domingo, hora argentina)", async () => {
    const s = await weeklyStats(db, workerId, 8, now);
    expect(s).toHaveLength(8);
    expect(s[7]).toEqual({ week: "2026-06-15", views: 7, whatsapp: 2, calls: 0, quotes: 0 });
    expect(s[6]).toEqual({ week: "2026-06-08", views: 5, whatsapp: 0, calls: 1, quotes: 1 });
    expect(s[0].views).toBe(0);
  });

  it("compara los últimos 7 días con los 7 anteriores", async () => {
    const r = await last7Days(db, workerId, now);
    expect(r.views).toEqual([7, 5]);
    expect(r.whatsapp).toEqual([2, 0]);
    expect(r.calls).toEqual([0, 1]);
  });

  it("weekStart devuelve el lunes", () => {
    expect(weekStart(now)).toBe("2026-06-15");
    expect(weekStart(new Date("2026-06-15T02:30:00Z"))).toBe("2026-06-08");
  });
});
