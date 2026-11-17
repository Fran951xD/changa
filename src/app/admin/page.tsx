import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { refreshRating } from "@/lib/reviews";

export const metadata: Metadata = { title: "Moderación", robots: { index: false } };

const REASON: Record<string, string> = { falso: "Falso o engañoso", ofensivo: "Ofensivo", spam: "Spam", peligroso: "Riesgo / estafa", otro: "Otro" };

async function resolve(form: FormData) {
  "use server";
  await requireAdmin();
  const id = String(form.get("id"));
  const action = String(form.get("action"));
  const [report] = await db.select().from(schema.reports).where(eq(schema.reports.id, id));
  if (!report) return;
  if (action === "hide" || action === "restore") {
    const hidden = action === "hide";
    if (report.targetType === "review") {
      const [r] = await db.update(schema.reviews).set({ status: hidden ? "hidden" : "visible" }).where(eq(schema.reviews.id, report.targetId)).returning({ workerId: schema.reviews.workerId });
      if (r) await refreshRating(r.workerId);
    } else {
      await db.update(schema.workers).set({ status: hidden ? "hidden" : "published" }).where(eq(schema.workers.id, report.targetId));
    }
  }
  // Todas las denuncias abiertas sobre el mismo contenido se cierran juntas.
  await db.update(schema.reports)
    .set({ status: action === "dismiss" ? "dismissed" : "resolved", resolvedAt: new Date() })
    .where(and(eq(schema.reports.targetId, report.targetId), action === "restore" ? eq(schema.reports.id, id) : eq(schema.reports.status, "open")));
  revalidatePath("/admin");
}

export default async function Admin({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const view = (await searchParams).ver === "resueltas" ? "resolved" : "open";
  const reports = await db.select().from(schema.reports)
    .where(view === "open" ? eq(schema.reports.status, "open") : inArray(schema.reports.status, ["resolved", "dismissed"]))
    .orderBy(desc(schema.reports.createdAt)).limit(100);

  const reviewIds = reports.filter((r) => r.targetType === "review").map((r) => r.targetId);
  const workerIds = reports.filter((r) => r.targetType === "worker").map((r) => r.targetId);
  const [reviews, workers] = await Promise.all([
    reviewIds.length ? db.select({ id: schema.reviews.id, text: schema.reviews.text, rating: schema.reviews.rating, author: schema.reviews.authorName, status: schema.reviews.status, slug: schema.workers.slug, worker: schema.workers.displayName })
      .from(schema.reviews).innerJoin(schema.workers, eq(schema.workers.id, schema.reviews.workerId)).where(inArray(schema.reviews.id, reviewIds)) : [],
    workerIds.length ? db.select({ id: schema.workers.id, name: schema.workers.displayName, slug: schema.workers.slug, status: schema.workers.status, description: schema.workers.description })
      .from(schema.workers).where(inArray(schema.workers.id, workerIds)) : [],
  ]);

  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <div className="page-head">
        <h1>Moderación</h1>
        <nav className="vista" aria-label="Filtro de denuncias">
          <Link href="/admin" aria-current={view === "open" ? "page" : undefined}>Abiertas</Link>
          <Link href="/admin?ver=resueltas" aria-current={view === "resolved" ? "page" : undefined}>Resueltas</Link>
        </nav>
      </div>
      {reports.length === 0 ? (
        <div className="panel" role="status"><p style={{ margin: 0 }}>{view === "open" ? "No hay denuncias abiertas. Todo en orden." : "Todavía no se resolvió ninguna denuncia."}</p></div>
      ) : (
        <ul className="stack" style={{ listStyle: "none", padding: 0 }}>
          {reports.map((rep) => {
            const review = reviews.find((r) => r.id === rep.targetId);
            const worker = workers.find((w) => w.id === rep.targetId);
            const isHidden = review ? review.status === "hidden" : worker?.status === "hidden";
            return (
              <li key={rep.id} className="panel stack">
                <p style={{ margin: 0 }}>
                  <span className="sello sello-urg">{REASON[rep.reason]}</span>{" "}
                  <strong>{rep.targetType === "review" ? "Reseña" : "Perfil"}</strong>
                  <span className="muted small"> · {rep.createdAt.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}{rep.status !== "open" && ` · ${rep.status === "resolved" ? "Resuelta" : "Descartada"}`}</span>
                </p>
                {rep.details && <p style={{ margin: 0 }}>“{rep.details}”</p>}
                <div style={{ borderLeft: "3px solid var(--tinta-2)", paddingLeft: 12 }}>
                  {review && <><p style={{ margin: 0 }}>{"★".repeat(review.rating)} de {review.author} a <Link href={`/${review.slug}`}>{review.worker}</Link></p><p style={{ margin: 0 }}>{review.text}</p></>}
                  {worker && <><p style={{ margin: 0 }}><Link href={`/${worker.slug}`}>{worker.name}</Link> ({worker.status})</p><p style={{ margin: 0 }} className="small">{worker.description.slice(0, 240)}</p></>}
                  {!review && !worker && <p className="muted" style={{ margin: 0 }}>El contenido ya no existe (se borró la cuenta).</p>}
                </div>
                {(review || worker) && (
                  <form action={resolve} className="row">
                    <input type="hidden" name="id" value={rep.id} />
                    {isHidden
                      ? <button className="btn btn-chico" name="action" value="restore">Volver a mostrar</button>
                      : <button className="btn btn-chico btn-rojo" name="action" value="hide">Ocultar {rep.targetType === "review" ? "reseña" : "perfil"}</button>}
                    {rep.status === "open" && <button className="btn btn-chico" name="action" value="dismiss">Descartar denuncia</button>}
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
