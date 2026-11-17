"use server";
import { randomInt } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { profileFromForm } from "@/lib/validation";
import { getWorkerForUser, missingForPublish, uniqueSlug } from "@/lib/workers";
import { AREA_BY_SLUG } from "@/data/areas";
import { TRADE_BY_SLUG } from "@/data/trades";
import { normalizeArPhone } from "@/lib/phone";
import { rateLimit, sha256 } from "@/lib/security";
import { sendSmsCode } from "@/lib/messaging";
import { saveImage, UploadError } from "@/lib/images";

export type FormState = { ok?: string; error?: string; fieldErrors?: Record<string, string>; demo?: string };

async function currentWorker() {
  const user = await requireUser("/panel/perfil");
  const worker = await getWorkerForUser(user.id);
  if (!worker) redirect("/panel");
  return { user, worker };
}

export async function createWorkerProfile() {
  const user = await requireUser("/panel");
  const existing = await getWorkerForUser(user.id);
  if (!existing) {
    const name = user.name ?? "";
    await db.insert(schema.workers).values({ userId: user.id, displayName: name, slug: await uniqueSlug(name || user.email.split("@")[0]) });
  }
  redirect("/panel/perfil");
}

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const { worker } = await currentWorker();
  const parsed = profileFromForm(form);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Revisá los campos marcados en rojo.", fieldErrors };
  }
  const p = parsed.data;
  if (p.zoneMode === "radius" && (p.baseLat == null || !p.radiusKm)) {
    return { error: "Revisá los campos marcados en rojo.", fieldErrors: { radiusKm: "Marcá el punto desde donde salís y cuántos km recorrés." } };
  }
  const firstArea = AREA_BY_SLUG.get(p.areas[0]);
  // El slug se arma una sola vez con nombre + oficio ("juan-perez-plomero") y después no cambia solo.
  const slug = worker.status === "draft" && p.trades[0]
    ? await uniqueSlug(`${p.displayName} ${TRADE_BY_SLUG.get(p.trades[0])!.person}`, worker.id)
    : worker.slug;

  await db.transaction(async (tx) => {
    await tx.update(schema.workers).set({
      slug,
      displayName: p.displayName,
      description: p.description,
      yearsExperience: p.yearsExperience,
      zoneMode: p.zoneMode,
      baseLat: p.zoneMode === "radius" ? p.baseLat : firstArea?.lat ?? null,
      baseLng: p.zoneMode === "radius" ? p.baseLng : firstArea?.lng ?? null,
      radiusKm: p.zoneMode === "radius" ? p.radiusKm : null,
      schedule: p.days.length && p.from && p.to ? { days: p.days, from: p.from, to: p.to } : null,
      urgencies: p.urgencies,
      paymentMethods: p.payments,
      licenseNumber: p.licenseNumber || null,
      updatedAt: new Date(),
    }).where(eq(schema.workers.id, worker.id));
    await tx.delete(schema.workerTrades).where(eq(schema.workerTrades.workerId, worker.id));
    if (p.trades.length) await tx.insert(schema.workerTrades).values([...new Set(p.trades)].map((trade) => ({ workerId: worker.id, trade })));
    await tx.delete(schema.workerAreas).where(eq(schema.workerAreas.workerId, worker.id));
    if (p.zoneMode === "areas" && p.areas.length) {
      await tx.insert(schema.workerAreas).values([...new Set(p.areas)].map((area) => {
        const a = AREA_BY_SLUG.get(area)!;
        return { workerId: worker.id, area, lat: a.lat, lng: a.lng };
      }));
    }
  });

  revalidatePath("/panel", "layout");
  if (form.get("intent") !== "publish") return { ok: "Guardamos los cambios." };

  const fresh = (await getWorkerForUser(worker.userId))!;
  const missing = missingForPublish(fresh);
  if (missing.length) return { error: `Para publicar te falta: ${missing.join(", ")}.` };
  if (fresh.status === "hidden") return { error: "Tu perfil está pausado por moderación. Escribinos para revisarlo." };
  await db.update(schema.workers).set({ status: "published" }).where(eq(schema.workers.id, worker.id));
  redirect("/panel?publicado=1");
}

export async function unpublish() {
  const { worker } = await currentWorker();
  if (worker.status === "published") await db.update(schema.workers).set({ status: "draft" }).where(eq(schema.workers.id, worker.id));
  revalidatePath("/panel", "layout");
}

// ---------- Celular ----------
export async function sendPhoneCode(_: FormState, form: FormData): Promise<FormState> {
  const { worker } = await currentWorker();
  const phone = normalizeArPhone(String(form.get("phone") ?? ""));
  if (!phone) return { error: "No entendimos el número. Escribilo con el código de área, por ejemplo 11 2345-6789." };
  if (!(await rateLimit("sms", 5, 3600, worker.id))) return { error: "Pediste muchos códigos. Esperá una hora y probá de nuevo." };
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.update(schema.workers).set({
    pendingPhone: phone,
    phoneCodeHash: sha256(code + worker.id),
    phoneCodeExpiresAt: new Date(Date.now() + 10 * 60_000),
    phoneCodeAttempts: 0,
  }).where(eq(schema.workers.id, worker.id));
  try {
    const sent = await sendSmsCode(phone, code);
    return { ok: "Te mandamos un SMS con un código de 6 números.", demo: sent.demo };
  } catch (e) {
    console.error(e);
    return { error: "No pudimos mandar el SMS. Revisá el número o probá en unos minutos." };
  }
}

export async function verifyPhoneCode(_: FormState, form: FormData): Promise<FormState> {
  const { worker } = await currentWorker();
  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  if (!worker.pendingPhone || !worker.phoneCodeHash || !worker.phoneCodeExpiresAt || worker.phoneCodeExpiresAt < new Date()) {
    return { error: "El código venció. Pedí uno nuevo." };
  }
  if (worker.phoneCodeAttempts >= 5) return { error: "Probaste muchas veces. Pedí un código nuevo." };
  if (sha256(code + worker.id) !== worker.phoneCodeHash) {
    await db.update(schema.workers).set({ phoneCodeAttempts: sql`${schema.workers.phoneCodeAttempts} + 1` }).where(eq(schema.workers.id, worker.id));
    return { error: "El código no coincide. Revisá el SMS y escribilo de nuevo." };
  }
  await db.update(schema.workers).set({
    phone: worker.pendingPhone, phoneVerifiedAt: new Date(), pendingPhone: null, phoneCodeHash: null, phoneCodeExpiresAt: null,
  }).where(eq(schema.workers.id, worker.id));
  revalidatePath("/panel", "layout");
  return { ok: "¡Listo! Tu celular quedó verificado." };
}

// ---------- Fotos ----------
export async function uploadProfilePhoto(_: FormState, form: FormData): Promise<FormState> {
  const { user, worker } = await currentWorker();
  try {
    const id = await saveImage(form.get("photo") as File, user.id);
    await db.update(schema.workers).set({ photoId: id }).where(eq(schema.workers.id, worker.id));
    if (worker.photoId) await db.delete(schema.images).where(eq(schema.images.id, worker.photoId));
  } catch (e) {
    return { error: e instanceof UploadError ? e.message : "No pudimos subir la foto. Probá de nuevo." };
  }
  revalidatePath("/panel", "layout");
  return { ok: "Foto actualizada." };
}

export async function addWorkPhoto(_: FormState, form: FormData): Promise<FormState> {
  const { user, worker } = await currentWorker();
  if (worker.photos.length >= 8) return { error: "Ya tenés 8 fotos. Borrá una para subir otra." };
  try {
    const id = await saveImage(form.get("photo") as File, user.id);
    await db.insert(schema.workerPhotos).values({ workerId: worker.id, imageId: id, position: worker.photos.length });
  } catch (e) {
    return { error: e instanceof UploadError ? e.message : "No pudimos subir la foto. Probá de nuevo." };
  }
  revalidatePath("/panel", "layout");
  return { ok: "Foto agregada." };
}

export async function removeWorkPhoto(form: FormData) {
  const { worker } = await currentWorker();
  const imageId = String(form.get("imageId"));
  if (!worker.photos.includes(imageId)) return;
  await db.delete(schema.workerPhotos).where(and(eq(schema.workerPhotos.workerId, worker.id), eq(schema.workerPhotos.imageId, imageId)));
  await db.delete(schema.images).where(eq(schema.images.id, imageId));
  revalidatePath("/panel", "layout");
}

// ---------- Disponible ahora ----------
export async function setAvailable(form: FormData) {
  const { worker } = await currentWorker();
  const on = form.get("on") === "1";
  // Se apaga solo a las 8 horas: así nadie queda "disponible" toda la semana por olvido.
  await db.update(schema.workers).set({ availableUntil: on ? new Date(Date.now() + 8 * 3600_000) : null }).where(eq(schema.workers.id, worker.id));
  revalidatePath("/panel", "layout");
}
