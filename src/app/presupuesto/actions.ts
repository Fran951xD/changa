"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { getUser, VISITOR_COOKIE } from "@/lib/auth";
import { normalizeArPhone } from "@/lib/phone";
import { rateLimit, verifyTurnstile } from "@/lib/security";
import { saveImage, UploadError } from "@/lib/images";
import { TRADE_BY_SLUG } from "@/data/trades";
import { AREA_BY_SLUG } from "@/data/areas";

export type QuoteState = { error?: string; fieldErrors?: Record<string, string> };

const QuoteSchema = z.object({
  trade: z.string().refine((t) => TRADE_BY_SLUG.has(t), { error: "Elegí un oficio." }),
  area: z.string().refine((a) => AREA_BY_SLUG.has(a), { error: "Elegí tu barrio de la lista." }),
  description: z.string().trim().min(15, { error: "Contá un poco más del trabajo: al menos 15 letras." }).max(1500, { error: "Hasta 1500 letras." }),
  name: z.string().trim().min(2, { error: "Escribí tu nombre." }).max(60),
  phone: z.string().transform((p, ctx) => normalizeArPhone(p) ?? (ctx.addIssue({ code: "custom", message: "Revisá el celular: escribilo con código de área, por ejemplo 11 2345-6789." }), z.NEVER)),
  workers: z.array(z.uuid()).min(1, { error: "Elegí al menos un trabajador." }).max(3, { error: "Podés elegir hasta 3." }),
});

export async function createQuote(_: QuoteState, form: FormData): Promise<QuoteState> {
  const parsed = QuoteSchema.safeParse({
    trade: form.get("trade"), area: form.get("area"), description: form.get("description") ?? "",
    name: form.get("name") ?? "", phone: form.get("phone") ?? "", workers: form.getAll("workers"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Revisá los campos marcados.", fieldErrors };
  }
  if (!(await verifyTurnstile(form.get("cf-turnstile-response")))) return { error: "No pudimos confirmar que no sos un robot. Recargá la página y probá de nuevo." };
  if (!(await rateLimit("quote", 5, 3600))) return { error: "Mandaste muchos pedidos seguidos. Esperá un rato y probá de nuevo." };
  const q = parsed.data;

  // Solo trabajadores publicados que hacen ese oficio.
  const valid = await db.select({ id: schema.workers.id }).from(schema.workers)
    .innerJoin(schema.workerTrades, eq(schema.workerTrades.workerId, schema.workers.id))
    .where(and(inArray(schema.workers.id, q.workers), eq(schema.workers.status, "published"), eq(schema.workerTrades.trade, q.trade)));
  if (valid.length === 0) return { error: "Los trabajadores que elegiste ya no están disponibles. Volvé a elegir." };

  const photoIds: string[] = [];
  try {
    for (const f of form.getAll("photos").slice(0, 3)) {
      if (f instanceof File && f.size > 0) photoIds.push(await saveImage(f, null));
    }
  } catch (e) {
    return { error: e instanceof UploadError ? e.message : "No pudimos subir las fotos. Probá sin fotos o con otras." };
  }

  const jar = await cookies();
  const visitor = jar.get(VISITOR_COOKIE)?.value ?? crypto.randomUUID();
  const user = await getUser();
  await db.transaction(async (tx) => {
    const [quote] = await tx.insert(schema.quoteRequests).values({
      visitorId: visitor, userId: user?.id, name: q.name, phone: q.phone, trade: q.trade, area: q.area, description: q.description, photoIds,
    }).returning({ id: schema.quoteRequests.id });
    await tx.insert(schema.quoteRecipients).values(valid.map((w) => ({ quoteId: quote.id, workerId: w.id })));
    // Cuenta como contacto iniciado desde Changa: habilita la reseña después.
    await tx.insert(schema.contacts).values(valid.map((w) => ({ workerId: w.id, visitorId: visitor, userId: user?.id, channel: "quote" as const })));
  });
  redirect(`/presupuesto/enviado?n=${valid.length}`);
}
