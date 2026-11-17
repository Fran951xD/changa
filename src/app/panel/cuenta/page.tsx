import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { destroySession, requireUser } from "@/lib/auth";
import { refreshRating } from "@/lib/reviews";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };

async function deleteAccount(form: FormData) {
  "use server";
  const user = await requireUser("/panel/cuenta");
  if (String(form.get("confirm") ?? "").trim().toUpperCase() !== "BORRAR") redirect("/panel/cuenta?error=confirmar");

  const reviewed = await db.select({ workerId: schema.reviews.workerId }).from(schema.reviews).where(eq(schema.reviews.authorId, user.id));
  const [worker] = await db.select({ id: schema.workers.id }).from(schema.workers).where(eq(schema.workers.userId, user.id));
  await db.transaction(async (tx) => {
    // Fotos de pedidos de presupuesto que hizo como cliente (no tienen dueño en images).
    const quotes = await tx.select({ photoIds: schema.quoteRequests.photoIds }).from(schema.quoteRequests).where(eq(schema.quoteRequests.userId, user.id));
    const photoIds = quotes.flatMap((q) => q.photoIds);
    if (photoIds.length) await tx.delete(schema.images).where(inArray(schema.images.id, photoIds));
    await tx.delete(schema.quoteRequests).where(eq(schema.quoteRequests.userId, user.id));
    if (worker) await tx.delete(schema.reports).where(eq(schema.reports.targetId, worker.id));
    // El resto cae en cascada: sesiones, perfil, oficios, zonas, fotos, reseñas escritas y recibidas, contactos, visitas.
    await tx.delete(schema.users).where(eq(schema.users.id, user.id));
  });
  for (const id of new Set(reviewed.map((r) => r.workerId))) await refreshRating(id);
  await destroySession();
  (await cookies()).delete("changa_visita");
  redirect("/?cuenta=borrada");
}

export default async function Cuenta({ searchParams }: PageProps<"/panel/cuenta">) {
  const user = await requireUser("/panel/cuenta");
  const sp = await searchParams;
  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <h1>Tu cuenta</h1>
      <div className="panel stack">
        <p style={{ margin: 0 }}>Entraste como <strong>{user.email}</strong>. Tu email nunca se muestra en Changa.</p>
        <form action="/salir" method="post"><button className="btn btn-chico">Salir</button></form>
      </div>
      <section className="panel stack" style={{ marginTop: 20 }} aria-labelledby="borrar">
        <h2 id="borrar">Borrar mi cuenta</h2>
        <p>Se borran para siempre tu perfil, tus fotos, tus estadísticas, las reseñas que escribiste y recibiste y tus pedidos de presupuesto. No se puede deshacer. <Link href="/privacidad">Más sobre tus datos</Link>.</p>
        {sp.error === "confirmar" && <p className="aviso aviso-error" role="alert">Para confirmar, escribí BORRAR en el campo.</p>}
        <form action={deleteAccount} className="stack">
          <div className="field">
            <label htmlFor="confirm">Escribí BORRAR para confirmar</label>
            <input id="confirm" name="confirm" type="text" autoComplete="off" />
          </div>
          <button className="btn btn-rojo">Borrar mi cuenta y mis datos</button>
        </form>
      </section>
    </div>
  );
}
