import type { Metadata } from "next";
import { db } from "@/db";
import { parseSearch, searchWorkers } from "@/lib/search";
import { TRADES, TRADE_BY_SLUG } from "@/data/trades";
import { AREA_BY_SLUG } from "@/data/areas";
import { AreaCombo } from "@/components/AreaCombo";
import { Turnstile } from "@/components/Turnstile";
import { QuoteForm } from "./QuoteForm";

export const metadata: Metadata = { title: "Pedir presupuesto", description: "Contá qué necesitás y mandáselo a hasta 3 trabajadores de tu zona a la vez." };

export default async function Presupuesto({ searchParams }: PageProps<"/presupuesto">) {
  const s = parseSearch({ ...(await searchParams), orden: "disponible" });
  const trade = TRADE_BY_SLUG.get(s.oficio)!;
  const area = s.zona ? AREA_BY_SLUG.get(s.zona) : undefined;
  const { rows } = area ? await searchWorkers(db, s) : { rows: [] };

  return (
    <div className="wrap" style={{ maxWidth: 680 }}>
      <div className="page-head">
        <h1>Pedir presupuesto</h1>
        <p className="muted">Contá qué necesitás y se lo mandamos a hasta 3 trabajadores de tu zona. Te responden por WhatsApp. No hace falta cuenta.</p>
      </div>
      {!area ? (
        <form action="/presupuesto" method="get" className="panel stack">
          <div className="field">
            <label htmlFor="oficio">Qué necesitás</label>
            <select id="oficio" name="oficio" defaultValue={s.oficio}>
              {TRADES.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
          </div>
          <AreaCombo label="Tu ciudad o barrio" name="zona" />
          <button className="btn btn-azul">Seguir</button>
        </form>
      ) : rows.length === 0 ? (
        <div className="panel" role="status">
          <p>Todavía no hay {trade.plural.replace(/-/g, " ")} cerca de {area.name}. Probá con una zona vecina.</p>
          <a className="btn" href={`/presupuesto?oficio=${s.oficio}`}>Elegir otro barrio</a>
        </div>
      ) : (
        <QuoteForm trade={s.oficio} area={area.slug} areaName={area.name} tradeName={trade.name} turnstile={<Turnstile />}
          candidates={rows.slice(0, 8).map((r) => ({
            id: r.id, name: r.displayName, available: r.available,
            rating: r.ratingCount ? `★ ${r.ratingAvg.toFixed(1)} (${r.ratingCount})` : "Sin reseñas",
            distance: r.distance < 1 ? "menos de 1 km" : `${Math.round(r.distance)} km`,
          }))} />
      )}
    </div>
  );
}
