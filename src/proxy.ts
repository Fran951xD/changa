import { NextResponse, type NextRequest } from "next/server";

// Cookie anónima para asociar contactos a un visitante sin cuenta (necesaria para reseñar después).
export function proxy(request: NextRequest) {
  const res = NextResponse.next();
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

export const config = { matcher: ["/((?!_next/|i/|favicon|robots|sitemap).*)"] };
