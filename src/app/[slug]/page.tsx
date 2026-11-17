import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkerBySlug, isAvailable } from "@/lib/workers";
import { criteriaSummary, visibleReviews } from "@/lib/reviews";
import { getUser } from "@/lib/auth";
import { TRADE_BY_SLUG, PAYMENT_METHODS, DAYS } from "@/data/trades";
import { AREA_BY_SLUG, nearestArea } from "@/data/areas";
import { ContactButtons } from "@/components/ContactButtons";
import { Stars } from "@/components/Stars";
import { ViewBeacon } from "@/components/ViewBeacon";
import { zoneText } from "@/components/WorkerCard";
import { fuzz } from "@/lib/geo";

async function load(slug: string) {
  const w = await getWorkerBySlug(decodeURIComponent(slug));
  if (!w || w.status !== "published") notFound();
  return w;
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const w = await load((await params).slug);
  const trade = TRADE_BY_SLUG.get(w.trades[0])?.person ?? "trabajador";
  const zone = zoneText({ ...w, mapLat: w.baseLat, mapLng: w.baseLng });
  const place = w.zoneMode === "areas" ? AREA_BY_SLUG.get(w.areas[0])?.name : nearestArea(w.baseLat!, w.baseLng!).name;
  const title = `${w.displayName}, ${trade} en ${place ?? "Buenos Aires"}`;
  const description = (w.description || `${w.displayName} trabaja de ${trade} en ${zone}.`).slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `/${w.slug}` },
    openGraph: { title, description, type: "profile", images: w.photoId ? [{ url: `/api/img/${w.photoId}`, alt: w.displayName }] : undefined },
  };
}

const fmtDate = (d: Date) => d.toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });

export default async function Perfil({ params, searchParams }: PageProps<"/[slug]">) {
  const w = await load((await params).slug);
  const sp = await searchParams;
  const [reviews, criteria, user] = await Promise.all([visibleReviews(w.id), criteriaSummary(w.id), getUser()]);
  const trade = TRADE_BY_SLUG.get(w.trades[0])!;
  const available = isAvailable(w);
  const zone = zoneText({ ...w, mapLat: w.baseLat, mapLng: w.baseLng });
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // schema.org LocalBusiness: le dice a Google quién es, qué hace, dónde y cómo lo califican.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: w.displayName,
    description: w.description || undefined,
    url: `${site}/${w.slug}`,
    image: w.photoId ? `${site}/api/img/${w.photoId}` : undefined,
    areaServed: w.zoneMode === "areas"
      ? w.areas.map((a) => ({ "@type": "Place", name: AREA_BY_SLUG.get(a)!.name }))
      : { "@type": "GeoCircle", geoMidpoint: { "@type": "GeoCoordinates", latitude: fuzz(w.baseLat!), longitude: fuzz(w.baseLng!) }, geoRadius: (w.radiusKm ?? 0) * 1000 },
    address: { "@type": "PostalAddress", addressLocality: AREA_BY_SLUG.get(w.areas[0])?.name ?? nearestArea(w.baseLat!, w.baseLng!).name, addressRegion: "Buenos Aires", addressCountry: "AR" },
    knowsAbout: w.trades.map((t) => TRADE_BY_SLUG.get(t)!.name),
    paymentAccepted: w.paymentMethods.map((p) => PAYMENT_METHODS.find((m) => m.slug === p)?.name).join(", ") || undefined,
    aggregateRating: w.ratingCount ? { "@type": "AggregateRating", ratingValue: w.ratingAvg.toFixed(1), reviewCount: w.ratingCount, bestRating: 5, worstRating: 1 } : undefined,
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review", author: { "@type": "Person", name: r.authorName }, datePublished: r.createdAt.toISOString().slice(0, 10),
      reviewBody: r.text, reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
    })),
  };

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewBeacon slug={w.slug} />
      {sp.resena === "ok" && <p className="aviso aviso-ok" role="status" style={{ marginTop: 20 }}>¡Gracias! Tu reseña ya está publicada.</p>}
      {sp.denuncia === "ok" && <p className="aviso aviso-ok" role="status" style={{ marginTop: 20 }}>Recibimos tu denuncia. La revisamos en menos de 48 horas.</p>}

      <div className="perfil-grid" style={{ paddingTop: 24 }}>
        <div className="stack">
          <section className="iman" style={{ ["--oficio" as string]: trade.color, padding: "20px 20px 20px 30px" }} aria-labelledby="nombre">
            {available && <span className="disponible">Disponible ahora</span>}
            <div className="iman-head">
              {w.photoId
                ? <img className="iman-foto" src={`/api/img/${w.photoId}?t=1`} alt={`Foto de ${w.displayName}`} width={120} height={120} style={{ width: 120, height: 120 }} fetchPriority="high" />
                : <div className="iman-foto" style={{ width: 120, height: 120 }} aria-hidden="true" />}
              <div style={{ minWidth: 0 }}>
                <h1 id="nombre" style={{ fontSize: "clamp(1.6rem, 6vw, 2.4rem)", marginBottom: 4 }}>{w.displayName}</h1>
                <p className="iman-oficio">{w.trades.map((t) => TRADE_BY_SLUG.get(t)!.name).join(" · ")}</p>
                <p className="iman-zona">{zone}</p>
              </div>
            </div>
            <div className="iman-meta">
              <Stars avg={w.ratingAvg} count={w.ratingCount} />
              {w.urgencies && <span className="sello sello-urg">Atiende urgencias</span>}
              {w.licenseNumber && <span className="sello">Matrícula informada</span>}
              {w.yearsExperience != null && <span className="muted">{w.yearsExperience} {w.yearsExperience === 1 ? "año" : "años"} de experiencia</span>}
            </div>
            {/* En celular el contacto va arriba de todo: es lo que vino a hacer la persona. */}
            <div className="solo-celu">
              <ContactButtons slug={w.slug} name={w.displayName} trade={w.trades[0]} area={typeof sp.zona === "string" ? sp.zona : undefined} compact />
            </div>
          </section>

          {w.description && (
            <section className="panel" aria-labelledby="sobre">
              <h2 id="sobre">Sobre su trabajo</h2>
              <p style={{ whiteSpace: "pre-line", marginBottom: 0 }}>{w.description}</p>
            </section>
          )}

          {w.photos.length > 0 && (
            <section className="panel" aria-labelledby="trabajos">
              <h2 id="trabajos">Trabajos realizados</h2>
              <ul className="galeria">
                {w.photos.map((id, i) => (
                  <li key={id}><a href={`/api/img/${id}`}><img src={`/api/img/${id}?t=1`} alt={`Trabajo ${i + 1} de ${w.displayName}`} width={200} height={200} loading="lazy" decoding="async" /></a></li>
                ))}
              </ul>
            </section>
          )}

          <section className="panel" aria-labelledby="resenas">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 id="resenas" style={{ margin: 0 }}>Reseñas</h2>
              {user?.id !== w.userId && <Link className="btn btn-chico" href={`/${w.slug}/resenar`}>Dejar una reseña</Link>}
            </div>
            {w.ratingCount > 0 && (
              <p className="muted small" style={{ marginTop: 8 }}>
                {[criteria.punctual && `${criteria.punctual} destacan la puntualidad`, criteria.tidy && `${criteria.tidy} la prolijidad`, criteria.fairPrice && `${criteria.fairPrice} el precio justo`].filter(Boolean).join(", ")}
              </p>
            )}
            {reviews.length === 0 ? (
              <p style={{ marginTop: 12 }}>Todavía no tiene reseñas. Solo pueden reseñar quienes lo contactaron desde Changa, así que cada reseña es de un cliente real.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
                {reviews.map((r) => (
                  <li key={r.id} className="resena" id={`r-${r.id}`}>
                    <p style={{ margin: 0 }}>
                      <strong>{r.authorName}</strong> <span className="muted small">· {fmtDate(r.createdAt)}</span>
                    </p>
                    <p style={{ margin: "2px 0 6px" }}>
                      <span className="estrellas" role="img" aria-label={`${r.rating} de 5 estrellas`}><span className="star">{"★".repeat(r.rating)}</span><span style={{ color: "#8a919b" }}>{"★".repeat(5 - r.rating)}</span></span>
                    </p>
                    <p style={{ marginBottom: 6 }}>{r.text}</p>
                    {(r.punctual || r.tidy || r.fairPrice) && (
                      <p className="row small" style={{ gap: 6, marginBottom: 6 }}>
                        {r.punctual && <span className="sello">Puntual</span>}
                        {r.tidy && <span className="sello">Prolijo</span>}
                        {r.fairPrice && <span className="sello">Precio justo</span>}
                      </p>
                    )}
                    {r.reply && (
                      <div className="respuesta">
                        <p className="small" style={{ margin: 0 }}><strong>Respuesta de {w.displayName.split(" ")[0]}</strong></p>
                        <p style={{ margin: 0 }}>{r.reply}</p>
                      </div>
                    )}
                    <Link className="small muted" href={`/denunciar?tipo=review&id=${r.id}&volver=/${w.slug}`} rel="nofollow">Denunciar reseña</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="perfil-side stack">
          <section className="panel stack" aria-labelledby="contacto">
            <h2 id="contacto">Contactar a {w.displayName.split(" ")[0]}</h2>
            <ContactButtons slug={w.slug} name={w.displayName} trade={w.trades[0]} area={typeof sp.zona === "string" ? sp.zona : undefined} />
            <p className="muted small" style={{ margin: 0 }}>Le llega tu mensaje por WhatsApp. Changa no cobra comisión: arreglás precio y forma de pago directo con {w.displayName.split(" ")[0]}.</p>
          </section>
          <section className="panel" aria-labelledby="datos">
            <h2 id="datos">Datos</h2>
            <dl style={{ margin: 0 }}>
              <dt className="label">Zona</dt>
              <dd style={{ margin: "0 0 12px" }}>{w.zoneMode === "areas" ? w.areas.map((a) => AREA_BY_SLUG.get(a)!.name).join(", ") : zone}</dd>
              {w.schedule && (<>
                <dt className="label">Horarios</dt>
                <dd style={{ margin: "0 0 12px" }}>{w.schedule.days.sort().map((d) => DAYS[d]).join(", ")} de {w.schedule.from} a {w.schedule.to}{w.urgencies ? ". Urgencias fuera de horario." : ""}</dd>
              </>)}
              {w.paymentMethods.length > 0 && (<>
                <dt className="label">Medios de pago</dt>
                <dd style={{ margin: "0 0 12px" }}>{w.paymentMethods.map((p) => PAYMENT_METHODS.find((m) => m.slug === p)?.name).join(", ")}</dd>
              </>)}
              {w.licenseNumber && (<>
                <dt className="label">Matrícula informada</dt>
                <dd style={{ margin: "0 0 12px" }}>{w.licenseNumber} <span className="hint">La informó el trabajador. Podés pedírsela antes de contratar.</span></dd>
              </>)}
              <dt className="label">En Changa desde</dt>
              <dd style={{ margin: 0 }}>{fmtDate(w.createdAt)}</dd>
            </dl>
          </section>
          <Link className="small muted" href={`/denunciar?tipo=worker&id=${w.id}&volver=/${w.slug}`} rel="nofollow">Denunciar este perfil</Link>
        </aside>
      </div>
    </div>
  );
}
