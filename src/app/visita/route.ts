import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { rateLimit } from "@/lib/security";

// Visita al perfil: la manda el navegador con JS (los robots que no ejecutan JS no suman).
// Una por IP y perfil cada 6 horas; el dueño mirando su perfil no cuenta.
export async function POST(request: Request) {
  const slug = (await request.text()).slice(0, 80);
  const [w] = await db.select({ id: schema.workers.id, userId: schema.workers.userId }).from(schema.workers)
    .where(and(eq(schema.workers.slug, slug), eq(schema.workers.status, "published")));
  if (!w) return new Response(null, { status: 204 });
  if ((await getUser())?.id === w.userId) return new Response(null, { status: 204 });
  if (!(await rateLimit(`view:${w.id}`, 1, 6 * 3600))) return new Response(null, { status: 204 });
  const day = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
  await db.insert(schema.profileViews).values({ workerId: w.id, day, count: 1 })
    .onConflictDoUpdate({ target: [schema.profileViews.workerId, schema.profileViews.day], set: { count: sql`${schema.profileViews.count} + 1` } });
  return new Response(null, { status: 204 });
}
