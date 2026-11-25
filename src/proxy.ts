import { NextResponse, type NextRequest } from "next/server";
import { ipFromHeaders } from "@/lib/ip";

// Límite general de lectura por IP (las acciones sensibles tienen además su límite en Postgres).
// shortcut: el contador vive en la memoria de cada instancia; en Vercel sumar una regla de rate limit del firewall para un límite global.
const WINDOW_MS = 60_000;
// Incluye los prefetch de Next: una persona navegando rápido no llega ni a 100. Las e2e (todo desde una IP) lo suben.
// Alto a propósito: las líneas móviles argentinas comparten IP (CGNAT) entre muchos usuarios.
const MAX_PER_WINDOW = Number(process.env.RATE_LIMIT_PER_MIN) || 600;
const hits = new Map<string, { start: number; n: number }>();

function allowed(ip: string, now = Date.now()) {
  const h = hits.get(ip);
  if (!h || now - h.start > WINDOW_MS) {
    if (hits.size > 10_000) hits.clear(); // no crecer sin límite
    hits.set(ip, { start: now, n: 1 });
    return true;
  }
  return ++h.n <= MAX_PER_WINDOW;
}

export function proxy(request: NextRequest) {
  const ip = ipFromHeaders(request.headers);
  if (!allowed(ip)) {
    return new NextResponse("Hiciste demasiados pedidos seguidos. Esperá un minuto y volvé a intentar.", {
      status: 429,
      headers: { "Retry-After": "60", "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const res = NextResponse.next();
  // Cookie anónima para asociar contactos a un visitante sin cuenta (necesaria para reseñar después).
  if (!request.cookies.has("changa_visita")) {
    res.cookies.set("changa_visita", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

export const config = { matcher: ["/((?!_next/|api/img/|favicon|icon|robots|sitemap).*)"] };
