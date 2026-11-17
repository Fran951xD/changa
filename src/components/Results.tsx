import Link from "next/link";
import { db } from "@/db";
import { TRADE_BY_SLUG, PAYMENT_METHODS } from "@/data/trades";
import { PAGE_SIZE, searchHref, searchOrigin, searchWorkers, type Search } from "@/lib/search";
import { WorkerCard } from "./WorkerCard";
import { MapLoader } from "./MapLoader";
import { AutoSubmitForm } from "./AutoSubmitForm";
import { SearchForm } from "./SearchForm";

/** Lista o mapa de resultados con filtros. Lo usan /buscar y las páginas de SEO (/plomeros/palermo). */
export async function Results({ s, headingLevel = 1 }: { s: Search; headingLevel?: 1 | 2 }) {
  const trade = TRADE_BY_SLUG.get(s.oficio)!;
  const origin = searchOrigin(s);
  const H = headingLevel === 1 ? "h1" : "h2";

  if (!origin) {
    return (
      <div className="wrap">
        <div className="page-head">
          <H>Buscar {trade.plural.replace(/-/g, " ")}</H>
          <p className="muted">Decinos tu barrio o usá tu ubicación para ver quién trabaja cerca.</p>
        </div>
        <div className="panel"><SearchForm trade={s.oficio} /></div>
      </div>
    );
  }

  const { rows, total } = await searchWorkers(db, s);
  const activeFilters = s.ahora || s.urgencias || s.matricula || s.min || s.pago.length;
  const title = `${total} ${total === 1 ? trade.person : trade.plural.replace(/-/g, " ")} cerca de ${origin.label}`;

  return (
    <div className="wrap">
      <div className="page-head">
        <H style={{ fontSize: "clamp(1.6rem, 5vw, 2.4rem)" }}>{title.charAt(0).toUpperCase() + title.slice(1)}</H>
        <details>
          <summary className="linkbtn" style={{ display: "inline-flex", alignItems: "center" }}>Cambiar oficio o barrio</summary>
          <div className="panel" style={{ marginTop: 10 }}><SearchForm trade={s.oficio} area={s.zona} /></div>
        </details>
      </div>

      {/* key: al navegar (por ej. "Ver todos sin filtros") React reusaría el form y dejaría chips tildados de antes. */}
      <AutoSubmitForm key={searchHref(s)} action="/buscar" method="get" aria-label="Filtros">
        <input type="hidden" name="oficio" value={s.oficio} />
        {s.zona ? <input type="hidden" name="zona" value={s.zona} /> : (
          <><input type="hidden" name="lat" value={s.lat} /><input type="hidden" name="lng" value={s.lng} /></>
        )}
        {s.vista === "mapa" && <input type="hidden" name="vista" value="mapa" />}
        <div className="filtros">
          <label className="chip"><input type="checkbox" name="ahora" value="1" defaultChecked={s.ahora} />Disponible ahora</label>
          <label className="chip"><input type="checkbox" name="urgencias" value="1" defaultChecked={s.urgencias} />Urgencias</label>
          <label className="chip"><input type="checkbox" name="matricula" value="1" defaultChecked={s.matricula} />Con matrícula</label>
          <details className="mas-filtros" open={!!(s.min || s.pago.length) || undefined}>
            <summary>Más filtros{s.min || s.pago.length ? " (activos)" : ""}</summary>
            <div className="panel stack" style={{ marginTop: 8 }}>
              <div className="field">
                <label htmlFor="min">Calificación mínima</label>
                <select id="min" name="min" defaultValue={s.min ?? ""}>
                  <option value="">Cualquiera</option>
                  <option value="3">3 estrellas o más</option>
                  <option value="4">4 estrellas o más</option>
                  <option value="5">Solo 5 estrellas</option>
                </select>
              </div>
              <fieldset>
                <legend>Que acepte</legend>
                <div className="chips">
                  {PAYMENT_METHODS.map((p) => (
                    <label key={p.slug} className="chip"><input type="checkbox" name="pago" value={p.slug} defaultChecked={s.pago.includes(p.slug)} />{p.name}</label>
                  ))}
                </div>
              </fieldset>
            </div>
          </details>
        </div>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
          <div className="row" style={{ gap: 8 }}>
            <label htmlFor="orden" style={{ margin: 0 }}>Ordenar</label>
            <select id="orden" name="orden" defaultValue={s.orden} style={{ width: "auto" }}>
              <option value="disponible">Disponibles primero</option>
              <option value="cerca">Más cerca</option>
              <option value="calificacion">Mejor calificados</option>
            </select>
            <noscript><button className="btn btn-chico">Aplicar</button></noscript>
          </div>
          <nav className="vista" aria-label="Ver resultados como">
            <Link href={searchHref(s, { vista: "lista", pagina: 1 })} aria-current={s.vista === "lista" ? "page" : undefined}>Lista</Link>
            <Link href={searchHref(s, { vista: "mapa", pagina: 1 })} aria-current={s.vista === "mapa" ? "page" : undefined}>Mapa</Link>
          </nav>
        </div>
      </AutoSubmitForm>

      {rows.length === 0 ? (
        <div className="panel stack" role="status">
          <h2>No encontramos {trade.plural.replace(/-/g, " ")} {activeFilters ? "con esos filtros" : `cerca de ${origin.label}`}</h2>
          {activeFilters ? (
            <p>Probá sacando algún filtro. <Link href={searchHref({ oficio: s.oficio, zona: s.zona, lat: s.lat, lng: s.lng })}>Ver todos sin filtros</Link>.</p>
          ) : (
            <p>Probá con un barrio vecino o buscá en otra zona. Changa está creciendo: si conocés a alguien de oficio, contale que puede publicar su tarjeta gratis.</p>
          )}
        </div>
      ) : s.vista === "mapa" ? (
        <>
          <MapLoader center={origin} pins={rows.filter((r) => r.mapLat != null).map((r) => ({
            slug: r.slug, name: r.displayName, lat: r.mapLat!, lng: r.mapLng!, available: r.available,
            rating: r.ratingCount ? `★ ${r.ratingAvg.toFixed(1)} (${r.ratingCount})` : "Sin reseñas",
          }))} />
          <p className="muted small" style={{ marginTop: 8 }}>Las ubicaciones son aproximadas: mostramos la zona, no la dirección. Amarillo = disponible ahora.</p>
        </>
      ) : (
        <ul className="cards">
          {rows.map((w) => <li key={w.id}><WorkerCard w={w} trade={s.oficio} area={s.zona} /></li>)}
        </ul>
      )}

      {total > PAGE_SIZE && s.vista === "lista" && (
        <nav className="row" aria-label="Páginas" style={{ marginTop: 24, justifyContent: "center" }}>
          {s.pagina > 1 && <Link className="btn" href={searchHref(s, { pagina: s.pagina - 1 })}>Anteriores</Link>}
          <span className="muted">Página {s.pagina} de {Math.ceil(total / PAGE_SIZE)}</span>
          {s.pagina * PAGE_SIZE < total && <Link className="btn" href={searchHref(s, { pagina: s.pagina + 1 })}>Ver más</Link>}
        </nav>
      )}

      <aside className="panel" style={{ marginTop: 32 }}>
        <h2>¿No te decidís?</h2>
        <p>Contá qué necesitás y mandáselo a hasta 3 {trade.plural.replace(/-/g, " ")} de la zona a la vez. Te responden por WhatsApp.</p>
        <Link className="btn btn-azul" href={`/presupuesto?oficio=${s.oficio}${s.zona ? `&zona=${s.zona}` : ""}`}>Pedir presupuesto</Link>
      </aside>
    </div>
  );
}
