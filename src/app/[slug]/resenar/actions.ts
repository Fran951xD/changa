"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser, visitorId } from "@/lib/auth";
import { eligibilityFor, refreshRating } from "@/lib/reviews";
import { ReviewSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/security";
import { publicName } from "@/lib/review-rules";
import { isUniqueViolation } from "@/lib/db-errors";

export type ReviewState = { error?: string; fieldErrors?: Record<string, string> };

export async function createReview(_: ReviewState, form: FormData): Promise<ReviewState> {
  const user = await getUser();
  if (!user) redirect("/ingresar");
  const slug = String(form.get("slug") ?? "");
  const [worker] = await db.select({ id: schema.workers.id, userId: schema.workers.userId }).from(schema.workers)
    .where(and(eq(schema.workers.slug, slug), eq(schema.workers.status, "published")));
  if (!worker) return { error: "Este perfil ya no está disponible." };

  const eligible = await eligibilityFor(worker, user, await visitorId());
  if (!eligible?.ok) return { error: "Ya no podés dejar esta reseña. Recargá la página para ver por qué." };

  const name = String(form.get("authorName") ?? "").trim();
  if (name.length < 2) return { error: "Revisá los campos marcados.", fieldErrors: { authorName: "Escribí tu nombre." } };
  const parsed = ReviewSchema.safeParse({
    rating: form.get("rating"), text: form.get("text"),
    punctual: form.get("punctual") === "on", tidy: form.get("tidy") === "on", fairPrice: form.get("fairPrice") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Revisá los campos marcados.", fieldErrors };
  }
  if (!(await rateLimit("review", 10, 86_400, user.id))) return { error: "Dejaste muchas reseñas hoy. Probá mañana." };

  try {
    await db.insert(schema.reviews).values({ workerId: worker.id, authorId: user.id, authorName: publicName(name), ...parsed.data });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: "Ya dejaste una reseña para este trabajador." }; // índice único (worker, autor)
    throw e;
  }
  if (!user.name) await db.update(schema.users).set({ name }).where(eq(schema.users.id, user.id));
  await refreshRating(worker.id);
  revalidatePath(`/${slug}`);
  redirect(`/${slug}?resena=ok`);
}
