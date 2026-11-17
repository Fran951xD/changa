import type { Metadata } from "next";
import { parseSearch } from "@/lib/search";
import { Results } from "@/components/Results";
import { TRADE_BY_SLUG } from "@/data/trades";
import { AREA_BY_SLUG } from "@/data/areas";

export async function generateMetadata({ searchParams }: PageProps<"/buscar">): Promise<Metadata> {
  const s = parseSearch(await searchParams);
  const t = TRADE_BY_SLUG.get(s.oficio)!;
  const a = s.zona ? AREA_BY_SLUG.get(s.zona) : undefined;
  return {
    title: `${t.name}${a ? ` en ${a.name}` : ""}`,
    // Las búsquedas con filtros no se indexan: para Google están las páginas /plomeros/palermo.
    robots: { index: false, follow: true },
    alternates: a ? { canonical: `/${t.plural}/${a.slug}` } : undefined,
  };
}

export default async function Buscar({ searchParams }: PageProps<"/buscar">) {
  return <Results s={parseSearch(await searchParams)} />;
}
