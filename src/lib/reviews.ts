import "server-only";
import { and, avg, count, desc, eq, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { reviewEligibility } from "./review-rules";

export async function visibleReviews(workerId: string) {
  return db.select().from(schema.reviews)
    .where(and(eq(schema.reviews.workerId, workerId), eq(schema.reviews.status, "visible")))
    .orderBy(desc(schema.reviews.createdAt)).limit(50);
}

export async function criteriaSummary(workerId: string) {
  const r = schema.reviews;
  const [row] = await db.select({
    punctual: sql<number>`count(*) filter (where ${r.punctual})::int`,
    tidy: sql<number>`count(*) filter (where ${r.tidy})::int`,
    fairPrice: sql<number>`count(*) filter (where ${r.fairPrice})::int`,
  }).from(r).where(and(eq(r.workerId, workerId), eq(r.status, "visible")));
  return row;
}

/** Recalcula el promedio cacheado en workers (se llama al crear, ocultar o borrar reseñas). */
export async function refreshRating(workerId: string) {
  const [s] = await db.select({ a: avg(schema.reviews.rating), c: count() }).from(schema.reviews)
    .where(and(eq(schema.reviews.workerId, workerId), eq(schema.reviews.status, "visible")));
  await db.update(schema.workers).set({ ratingAvg: Number(s.a ?? 0), ratingCount: s.c }).where(eq(schema.workers.id, workerId));
}

/** Arma la entrada para las reglas puras de review-rules.ts con lo que hay en la base. */
export async function eligibilityFor(worker: { id: string; userId: string }, user: { id: string } | null, visitorId: string | null, now = new Date()) {
  if (!user) return null;
  const contacts = await db.select({ at: schema.contacts.createdAt }).from(schema.contacts).where(and(
    eq(schema.contacts.workerId, worker.id),
    visitorId ? or(eq(schema.contacts.userId, user.id), eq(schema.contacts.visitorId, visitorId)) : eq(schema.contacts.userId, user.id),
  ));
  const [existing] = await db.select({ id: schema.reviews.id }).from(schema.reviews)
    .where(and(eq(schema.reviews.workerId, worker.id), eq(schema.reviews.authorId, user.id)));
  return reviewEligibility({ contactDates: contacts.map((c) => c.at), now, alreadyReviewed: !!existing, isOwnProfile: worker.userId === user.id });
}
