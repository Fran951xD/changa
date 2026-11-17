import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getWorkerForUser, isAvailable, missingForPublish } from "@/lib/workers";
import { createWorkerProfile, setAvailable } from "./actions";
import { db } from "@/db";
import { last7Days, weeklyStats } from "@/lib/stats";
import { Stars } from "@/components/Stars";

const fmtWeek = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });

async function Stats({ workerId, rating, reviews, slug }: { workerId: string; rating: number; reviews: number; slug: string }) {
  const [weeks, last] = await Promise.all([weeklyStats(db, workerId), last7Days(db, workerId)]);
  const max = Math.max(1, ...weeks.map((w) => w.views));
  const delta = ([a, b]: readonly [number, number]) => (a === b ? "igual que la semana anterior" : a > b ? `${a - b} más que la semana anterior` : `${b - a} menos que la semana anterior`);
  return (
    <section aria-labelledby="stats" style={{ marginTop: 20 }}>
      <h2 id="stats">Últimos 7 días</h2>
      <div className="stats">
        <div className="panel stat"><strong>{last.views[0]}</strong>visitas a tu perfil<span className="hint">{delta(last.views)}</span></div>
        <div className="panel stat"><strong>{last.whatsapp[0]}</strong>contactos por WhatsApp<span className="hint">{delta(last.whatsapp)}</span></div>
        <div className="panel stat"><strong>{last.calls[0]}</strong>llamadas<span className="hint">{delta(last.calls)}</span></div>
        <div className="panel stat"><strong>{reviews}</strong>reseñas<span className="hint"><Stars avg={rating} count={reviews} /></span></div>
      </div>
      <div className="panel" style={{ marginTop: 16, overflowX: "auto" }}>
        <h3>Últimas 8 semanas</h3>
        <table>
          <caption className="sr-only">Visitas y contactos por semana</caption>
          <thead><tr><th scope="col">Semana del</th><th scope="col">Visitas</th><th scope="col">WhatsApp</th><th scope="col">Llamadas</th><th scope="col">Presupuestos</th></tr></thead>
          <tbody>
            {[...weeks].reverse().map((w) => (
              <tr key={w.week}>
                <th scope="row" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{fmtWeek(w.week)}</th>
                <td style={{ minWidth: 120 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span aria-hidden="true" style={{ display: "inline-block", height: 10, width: `${(w.views / max) * 80}px`, minWidth: 2, background: "var(--azul)", borderRadius: 3 }} />
                    {w.views}
                  </span>
                </td>
                <td>{w.whatsapp}</td><td>{w.calls}</td><td>{w.quotes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small" style={{ margin: "10px 0 0" }}>¿Pocas visitas? Compartí <Link href="/panel/compartir">tu link y tu QR</Link> o pedile a tus clientes que te dejen una reseña en changa.app/{slug}.</p>
      </div>
    </section>
  );
}

export const metadata: Metadata = { title: "Mi panel", robots: { index: false } };

export default async function Panel({ searchParams }: PageProps<"/panel">) {
  const user = await requireUser("/panel");
  const w = await getWorkerForUser(user.id);
  const sp = await searchParams;

  if (!w) {
    return (
      <div className="wrap" style={{ maxWidth: 640 }}>
        <div className="page-head">
          <h1>Hola{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
        </div>
        <div className="panel stack">
          <h2>¿Trabajás de un oficio?</h2>
          <p>Armá tu tarjeta en Changa y que te encuentren los vecinos de tu zona. Es gratis y te lleva unos minutos: tu oficio, dónde trabajás y tu celular.</p>
          <form action={createWorkerProfile}><button className="btn btn-azul">Armar mi tarjeta</button></form>
          <p className="muted small">¿Buscás a alguien? No necesitás nada de esto: <Link href="/buscar">andá directo a buscar</Link>.</p>
        </div>
        <form action="/salir" method="post" style={{ marginTop: 20 }}><button className="linkbtn">Salir</button></form>
      </div>
    );
  }

  const available = isAvailable(w);
  const missing = missingForPublish(w);

  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <h1>Hola, {w.displayName.split(" ")[0] || "¡bienvenido!"}</h1>
        {sp.publicado && <p className="aviso aviso-ok" role="status">¡Publicaste tu tarjeta! Ya aparecés en las búsquedas de tu zona.</p>}
      </div>

      {w.status === "published" ? (
        <form action={setAvailable} className="panel toggle">
          <input type="hidden" name="on" value={available ? "0" : "1"} />
          <div>
            <h2 style={{ marginBottom: 4 }}>Disponible ahora</h2>
            <p className="muted small" style={{ margin: 0 }}>
              {available ? `Aparecés destacado hasta las ${w.availableUntil!.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" })} h.` : "Prendelo cuando puedas tomar un trabajo hoy. Se apaga solo a las 8 horas."}
            </p>
          </div>
          <button className="switch" role="switch" aria-checked={available} aria-label="Disponible ahora" />
        </form>
      ) : (
        <div className="panel stack">
          <h2>Tu tarjeta todavía no está publicada</h2>
          <p>{missing.length ? `Te falta: ${missing.join(", ")}.` : "Ya tenés todo. Entrá y tocá “Guardar y publicar”."}</p>
          <Link className="btn btn-azul" href="/panel/perfil">Completar mi tarjeta</Link>
        </div>
      )}

      {w.status === "published" && <Stats workerId={w.id} rating={w.ratingAvg} reviews={w.ratingCount} slug={w.slug} />}

      <nav aria-label="Atajos" className="row" style={{ marginTop: 20 }}>
        <Link className="btn" href="/panel/perfil">Editar mi tarjeta</Link>
        {w.status === "published" && <Link className="btn" href={`/${w.slug}`}>Ver mi perfil público</Link>}
      </nav>
      <form action="/salir" method="post" style={{ marginTop: 20 }}><button className="linkbtn">Salir</button></form>
    </div>
  );
}
