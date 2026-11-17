import { and, eq, gte, sql } from "drizzle-orm";
import { schema, type DB } from "@/db";

export type WeekStat = { week: string; views: number; whatsapp: number; calls: number; quotes: number };

/** Lunes (AAAA-MM-DD) de la semana de una fecha, en hora de Buenos Aires. */
export function weekStart(d: Date) {
  const local = new Date(d.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  local.setDate(local.getDate() - ((local.getDay() + 6) % 7));
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
}

/** Últimos 7 días contra los 7 anteriores (comparar una semana a medias con una completa engaña). */
export async function last7Days(db: DB, workerId: string, now = new Date()) {
  const day = (offset: number) => new Date(now.getTime() - offset * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
  const [cur, prev] = [day(6), day(13)];
  const c = schema.contacts;
  const [[v], [k]] = await Promise.all([
    db.select({
      now: sql<number>`coalesce(sum(${schema.profileViews.count}) filter (where ${schema.profileViews.day} >= ${cur}), 0)::int`,
      before: sql<number>`coalesce(sum(${schema.profileViews.count}) filter (where ${schema.profileViews.day} < ${cur}), 0)::int`,
    }).from(schema.profileViews).where(and(eq(schema.profileViews.workerId, workerId), gte(schema.profileViews.day, prev))),
    db.select({
      waNow: sql<number>`count(*) filter (where ${c.channel} = 'whatsapp' and ${c.createdAt} >= ${new Date(now.getTime() - 7 * 86_400_000).toISOString()}::timestamptz)::int`,
      waBefore: sql<number>`count(*) filter (where ${c.channel} = 'whatsapp' and ${c.createdAt} < ${new Date(now.getTime() - 7 * 86_400_000).toISOString()}::timestamptz)::int`,
      callNow: sql<number>`count(*) filter (where ${c.channel} = 'call' and ${c.createdAt} >= ${new Date(now.getTime() - 7 * 86_400_000).toISOString()}::timestamptz)::int`,
      callBefore: sql<number>`count(*) filter (where ${c.channel} = 'call' and ${c.createdAt} < ${new Date(now.getTime() - 7 * 86_400_000).toISOString()}::timestamptz)::int`,
    }).from(c).where(and(eq(c.workerId, workerId), gte(c.createdAt, new Date(now.getTime() - 14 * 86_400_000)))),
  ]);
  return { views: [v.now, v.before], whatsapp: [k.waNow, k.waBefore], calls: [k.callNow, k.callBefore] } as const;
}

/** Últimas `weeks` semanas, de la más vieja a la actual, con ceros donde no hubo movimiento. */
export async function weeklyStats(db: DB, workerId: string, weeks = 8, now = new Date()): Promise<WeekStat[]> {
  const labels = Array.from({ length: weeks }, (_, i) => weekStart(new Date(now.getTime() - (weeks - 1 - i) * 7 * 86_400_000)));
  const since = labels[0];
  const tz = sql.raw(`'America/Argentina/Buenos_Aires'`);

  const [views, contacts] = await Promise.all([
    db.select({ week: sql<string>`to_char(date_trunc('week', ${schema.profileViews.day}), 'YYYY-MM-DD')`, n: sql<number>`sum(${schema.profileViews.count})::int` })
      .from(schema.profileViews).where(and(eq(schema.profileViews.workerId, workerId), gte(schema.profileViews.day, since)))
      .groupBy(sql`1`),
    db.select({
      week: sql<string>`to_char(date_trunc('week', ${schema.contacts.createdAt} at time zone ${tz}), 'YYYY-MM-DD')`,
      channel: schema.contacts.channel, n: sql<number>`count(*)::int`,
    }).from(schema.contacts)
      .where(and(eq(schema.contacts.workerId, workerId), sql`(${schema.contacts.createdAt} at time zone ${tz})::date >= ${since}::date`))
      .groupBy(sql`1`, schema.contacts.channel),
  ]);

  return labels.map((week) => ({
    week,
    views: views.find((v) => v.week === week)?.n ?? 0,
    whatsapp: contacts.find((c) => c.week === week && c.channel === "whatsapp")?.n ?? 0,
    calls: contacts.find((c) => c.week === week && c.channel === "call")?.n ?? 0,
    quotes: contacts.find((c) => c.week === week && c.channel === "quote")?.n ?? 0,
  }));
}
