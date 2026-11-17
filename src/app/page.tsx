import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { TRADES } from "@/data/trades";

const POPULAR = ["plomeria", "electricidad", "gas", "aires", "cerrajeria", "pintura", "albanileria", "refrigeracion", "mudanzas", "pc"];
const LIGHT = new Set(["electricidad"]); // imanes claros: texto oscuro para mantener contraste

export default async function Home({ searchParams }: PageProps<"/">) {
  const popular = POPULAR.map((slug) => TRADES.find((t) => t.slug === slug)!);
  const deleted = (await searchParams).cuenta === "borrada";
  return (
    <>
      {deleted && <div className="wrap" style={{ paddingTop: 16 }}><p className="aviso aviso-ok" role="status">Borramos tu cuenta y todos tus datos.</p></div>}
      <section className="hero wrap" aria-labelledby="titulo">
        <h1 id="titulo">¿Qué se rompió?</h1>
        <p className="muted" style={{ maxWidth: "48ch" }}>
          Plomeros, electricistas, gasistas y más gente de oficio de tu barrio, con reseñas de vecinos que ya los llamaron.
        </p>
        <SearchForm />
        <h2 className="sr-only">Oficios más buscados</h2>
        <ul className="imanes">
          {popular.map((t) => (
            <li key={t.slug}>
              <Link href={`/buscar?oficio=${t.slug}`} className={LIGHT.has(t.slug) ? "oscuro" : undefined} style={{ ["--c" as string]: t.color }}>
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap seccion" aria-labelledby="como">
        <h2 id="como">Cómo funciona</h2>
        <ol className="stack" style={{ paddingLeft: 22, maxWidth: "60ch" }}>
          <li><strong>Buscá</strong> el oficio y tu barrio. Sin registrarte.</li>
          <li><strong>Compará</strong> reseñas, fotos de trabajos y quién está disponible hoy.</li>
          <li><strong>Escribile por WhatsApp</strong> con un toque. El mensaje ya va armado.</li>
        </ol>
      </section>

      <section className="wrap seccion" aria-labelledby="trabajadores">
        <div className="panel" style={{ maxWidth: 640 }}>
          <h2 id="trabajadores">¿Trabajás de un oficio?</h2>
          <p>Publicá tu tarjeta gratis y que te encuentren los vecinos de tu zona. Es como dejar tu imán en todas las heladeras del barrio.</p>
          <Link href="/trabajadores" className="btn btn-azul">Quiero publicar mi tarjeta</Link>
        </div>
      </section>
    </>
  );
}
