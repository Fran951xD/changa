import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { randomToken, sha256 } from "./security";

const SESSION_COOKIE = "changa_sesion";
export const VISITOR_COOKIE = "changa_visita";
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(schema.sessions).values({ tokenHash: sha256(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  // Los contactos que hizo sin cuenta pasan a su usuario: así puede reseñar.
  const visitor = await visitorId();
  if (visitor) {
    await db.update(schema.contacts).set({ userId })
      .where(and(eq(schema.contacts.visitorId, visitor), isNull(schema.contacts.userId)));
  }
}

export const getUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name, isAdmin: schema.users.isAdmin })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.tokenHash, sha256(token)), gt(schema.sessions.expiresAt, new Date())));
  return row ?? null;
});

export async function requireUser(next = "/panel") {
  const user = await getUser();
  if (!user) redirect(`/ingresar?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!user.isAdmin) redirect("/");
  return user;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

export async function visitorId() {
  return (await cookies()).get(VISITOR_COOKIE)?.value ?? null;
}

/** Busca o crea el usuario por email (enlace mágico o Google). */
export async function upsertUser(email: string, extra: { googleId?: string; name?: string } = {}) {
  const normalized = email.trim().toLowerCase();
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, normalized));
  if (existing) {
    if (extra.googleId && !existing.googleId) {
      await db.update(schema.users).set({ googleId: extra.googleId }).where(eq(schema.users.id, existing.id));
    }
    return existing;
  }
  const [created] = await db.insert(schema.users).values({ email: normalized, ...extra }).returning();
  return created;
}
