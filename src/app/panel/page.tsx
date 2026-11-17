import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getWorkerForUser, isAvailable, missingForPublish } from "@/lib/workers";
import { createWorkerProfile, setAvailable } from "./actions";

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
              {available ? `Aparecés destacado hasta las ${w.availableUntil!.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })}.` : "Prendelo cuando puedas tomar un trabajo hoy. Se apaga solo a las 8 horas."}
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

      <nav aria-label="Panel" className="stack" style={{ marginTop: 20 }}>
        <Link className="btn btn-full" href="/panel/perfil">Editar mi tarjeta</Link>
        {w.status === "published" && <Link className="btn btn-full" href={`/${w.slug}`}>Ver mi perfil público</Link>}
      </nav>
      <form action="/salir" method="post" style={{ marginTop: 20 }}><button className="linkbtn">Salir</button></form>
    </div>
  );
}
