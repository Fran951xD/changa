import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { getUser, VISITOR_COOKIE } from "@/lib/auth";
import { rateLimit } from "@/lib/security";
import { formatArPhone, whatsappLink } from "@/lib/phone";
import { contactMessage } from "@/lib/contact";

/** Revela el contacto (WhatsApp o llamada), registra el contacto y aplica límites contra robots. */
export async function POST(request: Request) {
  const form = await request.formData();
  const wantsJson = request.headers.get("accept")?.includes("application/json");
  const channel = form.get("channel") === "call" ? "call" : "whatsapp";

  if (!(await rateLimit("contact-min", 8, 60)) || !(await rateLimit("contact-day", 60, 86_400))) {
    return wantsJson
      ? Response.json({ error: "rate" }, { status: 429 })
      : new Response("Hiciste muchos pedidos seguidos. Esperá un minuto y volvé a intentar.", { status: 429, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const [w] = await db
    .select({ id: schema.workers.id, name: schema.workers.displayName, phone: schema.workers.phone, userId: schema.workers.userId })
    .from(schema.workers)
    .where(and(eq(schema.workers.slug, String(form.get("slug") ?? "")), eq(schema.workers.status, "published")));
  if (!w?.phone) return new Response("Este perfil ya no está disponible.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });

  const jar = await cookies();
  let visitor = jar.get(VISITOR_COOKIE)?.value;
  if (!visitor) {
    visitor = crypto.randomUUID();
    jar.set(VISITOR_COOKIE, visitor, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 31_536_000 });
  }
  const user = await getUser();
  if (user?.id !== w.userId) {
    await db.insert(schema.contacts).values({ workerId: w.id, visitorId: visitor, userId: user?.id ?? null, channel });
  }

  if (channel === "call") {
    const data = { display: formatArPhone(w.phone), tel: `tel:+${w.phone}` };
    if (wantsJson) return Response.json(data, { headers: { "Cache-Control": "no-store" } });
    // Sin JavaScript: una página mínima con el número.
    return new Response(
      `<!doctype html><html lang="es-AR"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>Llamar a ${escapeHtml(w.name)}</title><body style="font-family:system-ui;padding:24px"><p>Llamá a ${escapeHtml(w.name)}:</p><p><a href="${data.tel}" style="font-size:1.6rem">${data.display}</a></p></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }

  const text = contactMessage(w.name, String(form.get("trade") ?? ""), String(form.get("area") ?? ""));
  return new Response(null, { status: 303, headers: { Location: whatsappLink(w.phone, text), "Cache-Control": "no-store" } });
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
