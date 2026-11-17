import { TRADE_BY_SLUG } from "@/data/trades";
import { AREA_BY_SLUG, nearestArea } from "@/data/areas";
import type { SearchResult } from "@/lib/search";
import { ContactButtons } from "./ContactButtons";
import { Stars } from "./Stars";

export function zoneText(w: { zoneMode: string; radiusKm: number | null; areas: string[]; mapLat?: number | null; mapLng?: number | null }) {
  if (w.zoneMode === "radius") {
    const near = w.mapLat != null ? nearestArea(w.mapLat, w.mapLng!).name : null;
    return `Hasta ${w.radiusKm} km${near ? ` de ${near}` : ""}`;
  }
  const names = w.areas.map((a) => AREA_BY_SLUG.get(a)?.name).filter(Boolean);
  return names.length > 3 ? `${names.slice(0, 3).join(", ")} y ${names.length - 3} más` : names.join(", ");
}

/** La tarjeta-imán: lo que hay que ver de un vistazo para decidir a quién escribirle. */
export function WorkerCard({ w, trade, area }: { w: SearchResult; trade: string; area?: string }) {
  const t = TRADE_BY_SLUG.get(trade)!;
  const others = w.trades.filter((x) => x !== trade).map((x) => TRADE_BY_SLUG.get(x)?.name).filter(Boolean);
  return (
    <article className="iman" style={{ ["--oficio" as string]: t.color }} aria-labelledby={`n-${w.id}`}>
      {w.available && <span className="disponible">Disponible ahora</span>}
      <div className="iman-head">
        {w.photoId
          ? <img className="iman-foto" src={`/api/img/${w.photoId}?t=1`} alt="" width={68} height={68} loading="lazy" decoding="async" />
          : <div className="iman-foto" aria-hidden="true" />}
        <div style={{ minWidth: 0 }}>
          <h3 className="iman-nombre" id={`n-${w.id}`}><a href={`/${w.slug}`}>{w.displayName}</a></h3>
          <p className="iman-oficio">{t.name}{others.length > 0 && <span className="muted"> · {others.join(", ")}</span>}</p>
          <p className="iman-zona">{zoneText(w)} · a {w.distance < 1 ? "menos de 1" : Math.round(w.distance)} km</p>
        </div>
      </div>
      <div className="iman-meta">
        <Stars avg={w.ratingAvg} count={w.ratingCount} />
        {w.urgencies && <span className="sello sello-urg">Urgencias</span>}
        {w.hasLicense && <span className="sello">Matrícula informada</span>}
      </div>
      <ContactButtons slug={w.slug} name={w.displayName} trade={trade} area={area} compact />
    </article>
  );
}
