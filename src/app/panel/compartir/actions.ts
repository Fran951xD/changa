"use server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getWorkerForUser, RESERVED_SLUGS } from "@/lib/workers";

export type SlugState = { ok?: string; error?: string };

const Slug = z.string().trim().toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "Usá solo letras sin tilde, números y guiones. Ej.: juan-plomero" })
  .min(3, { error: "Tiene que tener al menos 3 letras." }).max(40, { error: "Hasta 40 letras." });

export async function changeSlug(_: SlugState, form: FormData): Promise<SlugState> {
  const user = await requireUser("/panel/compartir");
  const w = await getWorkerForUser(user.id);
  if (!w) return { error: "Primero armá tu tarjeta." };
  const parsed = Slug.safeParse(form.get("slug"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const slug = parsed.data;
  if (slug === w.slug) return { ok: "Ese ya es tu link." };
  if (RESERVED_SLUGS.has(slug)) return { error: "Ese link está reservado. Probá con otro, por ejemplo agregando tu oficio." };
  const [taken] = await db.select({ id: schema.workers.id }).from(schema.workers).where(eq(schema.workers.slug, slug));
  if (taken) return { error: "Ese link ya lo usa otra persona. Probá agregando tu barrio o tu apellido." };
  await db.update(schema.workers).set({ slug }).where(eq(schema.workers.id, w.id));
  revalidatePath("/panel", "layout");
  return { ok: "¡Listo! Tu link nuevo ya funciona." };
}
