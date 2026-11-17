import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getWorkerForUser } from "@/lib/workers";
import { Stars } from "@/components/Stars";

export const metadata: Metadata = { title: "Mis reseñas", robots: { index: false } };

async function reply(form: FormData) {
  "use server";
  const user = await requireUser("/panel/resenas");
  const w = await getWorkerForUser(user.id);
  if (!w) return;
  const text = z.string().trim().max(600).safeParse(form.get("reply"));
  if (!text.success) return;
  // Solo puede responder reseñas de su propio perfil; responder vacío borra la respuesta, nunca la reseña.
  await db.update(schema.reviews)
    .set({ reply: text.data || null, repliedAt: text.data ? new Date() : null })
    .where(and(eq(schema.reviews.id, String(form.get("id"))), eq(schema.reviews.workerId, w.id)));
  revalidatePath("/panel/resenas");
  revalidatePath(`/${w.slug}`);
}

export default async function Resenas({ searchParams }: PageProps<"/panel/resenas">) {
  const denuncia = (await searchParams).denuncia === "ok";
  const user = await requireUser("/panel/resenas");
  const w = await getWorkerForUser(user.id);
  if (!w) redirect("/panel");
  const reviews = await db.select().from(schema.reviews).where(eq(schema.reviews.workerId, w.id)).orderBy(desc(schema.reviews.createdAt));

  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <h1>Tus reseñas</h1>
      {denuncia && <p className="aviso aviso-ok" role="status">Recibimos tu denuncia. La revisamos en menos de 48 horas; mientras tanto la reseña sigue visible.</p>}
      <p><Stars avg={w.ratingAvg} count={w.ratingCount} /></p>
      <p className="muted">Podés responder cada reseña en público. Si una reseña es falsa u ofensiva, denunciala y la revisamos: no se pueden borrar.</p>
      {reviews.length === 0 ? (
        <div className="panel" role="status"><p style={{ margin: 0 }}>Todavía no tenés reseñas. Las dejan los clientes que te contactaron desde Changa, a partir del día siguiente. Compartí tu link con tus clientes para sumar las primeras.</p></div>
      ) : (
        <ul className="stack" style={{ listStyle: "none", padding: 0 }}>
          {reviews.map((r) => (
            <li key={r.id} className="panel stack">
              <p style={{ margin: 0 }}>
                <strong>{r.authorName}</strong> · <span role="img" aria-label={`${r.rating} de 5 estrellas`} style={{ color: "#a87300" }}>{"★".repeat(r.rating)}</span>
                {r.status === "hidden" && <span className="sello" style={{ marginLeft: 8 }}>Oculta por moderación</span>}
              </p>
              <p style={{ margin: 0 }}>{r.text}</p>
              <form action={reply} className="stack">
                <input type="hidden" name="id" value={r.id} />
                <label htmlFor={`reply-${r.id}`}>{r.reply ? "Tu respuesta (podés editarla)" : "Responder en público"}</label>
                <textarea id={`reply-${r.id}`} name="reply" defaultValue={r.reply ?? ""} maxLength={600} style={{ minHeight: 80 }} />
                <div className="row">
                  <button className="btn btn-chico">{r.reply ? "Guardar respuesta" : "Publicar respuesta"}</button>
                  <Link className="small" href={`/denunciar?tipo=review&id=${r.id}&volver=/panel/resenas`}>Denunciar esta reseña</Link>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
