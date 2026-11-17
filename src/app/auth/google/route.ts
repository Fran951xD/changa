import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { safeNext } from "@/lib/security";
import { google } from "@/lib/google";

export async function GET(request: Request) {
  const g = google();
  if (!g) return Response.redirect(new URL("/ingresar", request.url));
  const state = generateState();
  const verifier = generateCodeVerifier();
  const url = g.createAuthorizationURL(state, verifier, ["openid", "email", "profile"]);
  const jar = await cookies();
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: 600, path: "/" };
  jar.set("g_state", state, opts);
  jar.set("g_verifier", verifier, opts);
  jar.set("g_next", safeNext(new URL(request.url).searchParams.get("next")), opts);
  return Response.redirect(url);
}
