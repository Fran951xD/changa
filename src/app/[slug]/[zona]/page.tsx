import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TRADE_BY_PLURAL } from "@/data/trades";
import { AREA_BY_SLUG } from "@/data/areas";
import { parseSearch } from "@/lib/search";
import { Results } from "@/components/Results";

// Páginas indexables por oficio y zona: /plomeros/palermo, /gasistas/quilmes…
function resolve(oficio: string, zona: string) {
  const t = TRADE_BY_PLURAL.get(oficio);
  const a = AREA_BY_SLUG.get(zona);
  if (!t || !a) notFound();
  return { t, a };
}

export async function generateMetadata({ params }: PageProps<"/[slug]/[zona]">): Promise<Metadata> {
  const { slug: oficio, zona } = await params;
  const { t, a } = resolve(oficio, zona);
  const label = t.plural.replace(/-/g, " ");
  const title = `${label.charAt(0).toUpperCase() + label.slice(1)} en ${a.name}`;
  return {
    title,
    description: `${title}: compará reseñas de vecinos, mirá quién está disponible ahora y contactalos por WhatsApp. Sin intermediarios ni comisiones.`,
    alternates: { canonical: `/${t.plural}/${a.slug}` },
    openGraph: { title: `${title} · Changa` },
  };
}

export default async function OficioZona({ params, searchParams }: PageProps<"/[slug]/[zona]">) {
  const { slug: oficio, zona } = await params;
  const { t, a } = resolve(oficio, zona);
  const s = parseSearch({ ...(await searchParams), oficio: t.slug, zona: a.slug });
  return <Results s={s} />;
}
