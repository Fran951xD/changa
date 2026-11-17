"use server";
import { z } from "zod";
import { headers } from "next/headers";
import { db, schema } from "@/db";
import { randomToken, rateLimit, safeNext, sha256, verifyTurnstile } from "@/lib/security";
import { sendLoginEmail } from "@/lib/messaging";

export type LoginState = { error?: string; sent?: string; demoUrl?: string };

const Email = z.email({ error: "Revisá el email: parece que le falta algo (por ejemplo, la @)." });

export async function requestLogin(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = Email.safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const email = parsed.data;

  if (!(await verifyTurnstile(form.get("cf-turnstile-response")))) {
    return { error: "No pudimos confirmar que no sos un robot. Recargá la página y probá de nuevo." };
  }
  if (!(await rateLimit("login-ip", 10, 3600)) || !(await rateLimit("login-email", 5, 3600, email))) {
    return { error: "Pediste muchos enlaces seguidos. Esperá unos minutos y volvé a intentar." };
  }

  const token = randomToken();
  await db.insert(schema.loginTokens).values({
    tokenHash: sha256(token),
    email,
    next: safeNext(form.get("next")),
    expiresAt: new Date(Date.now() + 15 * 60_000),
  });

  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  try {
    const sent = await sendLoginEmail(email, `${origin}/auth/verificar?t=${token}`);
    return { sent: email, demoUrl: sent.demo };
  } catch (e) {
    console.error(e);
    return { error: "No pudimos mandar el mail ahora. Probá de nuevo en un rato o entrá con Google." };
  }
}
