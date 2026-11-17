import { decodeIdToken } from "arctic";
import { cookies } from "next/headers";
import { createSession, upsertUser } from "@/lib/auth";
import { safeNext } from "@/lib/security";
import { google } from "@/lib/google";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fail = Response.redirect(new URL("/ingresar?error=google", request.url));
  const jar = await cookies();
  const g = google();
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!g || !code || !state || state !== jar.get("g_state")?.value) return fail;
  try {
    const tokens = await g.validateAuthorizationCode(code, jar.get("g_verifier")?.value ?? "");
    const claims = decodeIdToken(tokens.idToken()) as { sub: string; email?: string; email_verified?: boolean; name?: string };
    if (!claims.email || !claims.email_verified) return fail;
    const user = await upsertUser(claims.email, { googleId: claims.sub, name: claims.name });
    await createSession(user.id);
    const next = safeNext(jar.get("g_next")?.value);
    for (const c of ["g_state", "g_verifier", "g_next"]) jar.delete(c);
    return Response.redirect(new URL(next, request.url));
  } catch {
    return fail;
  }
}
