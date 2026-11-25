import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { ipFromHeaders } from "./ip";

export const randomToken = () => randomBytes(32).toString("base64url");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function clientIp() {
  return ipFromHeaders(await headers());
}

/**
 * Ventana fija guardada en Postgres: sirve igual con una o con cien instancias serverless.
 * Devuelve true si todavía hay cupo.
 */
export async function rateLimit(name: string, limit: number, windowSec: number, id?: string) {
  const key = `${name}:${sha256((id ?? (await clientIp())) + (process.env.AUTH_SECRET ?? ""))}`;
  const expired = sql`${schema.rateLimits.windowStart} < now() - make_interval(secs => ${windowSec})`;
  const [row] = await db
    .insert(schema.rateLimits)
    .values({ key, windowStart: new Date(), count: 1 })
    .onConflictDoUpdate({
      target: schema.rateLimits.key,
      set: {
        count: sql`case when ${expired} then 1 else ${schema.rateLimits.count} + 1 end`,
        windowStart: sql`case when ${expired} then now() else ${schema.rateLimits.windowStart} end`,
      },
    })
    .returning({ count: schema.rateLimits.count });
  return row.count <= limit;
}

/** Cloudflare Turnstile. Sin TURNSTILE_SECRET_KEY (desarrollo) se omite. */
export async function verifyTurnstile(token: FormDataEntryValue | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token, remoteip: await clientIp() }),
  });
  return ((await res.json()) as { success: boolean }).success === true;
}

/** Solo rutas internas: evita redirecciones abiertas con ?next=https://otro-sitio. */
export function safeNext(next: unknown, fallback = "/panel") {
  return typeof next === "string" && /^\/(?![/\\])/.test(next) ? next : fallback;
}

// Solo con DEMO_MODE=1 explícito: si falta la variable, la app se cierra en vez de mostrar enlaces en pantalla.
export const isDemo = () => process.env.DEMO_MODE?.trim() === "1";
