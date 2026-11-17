import { TRADE_BY_SLUG } from "@/data/trades";
import { AREA_BY_SLUG } from "@/data/areas";

/** "Hola Juan, te encontré en Changa. Necesito un plomero en Palermo para " (el cliente completa). */
export function contactMessage(name: string, trade?: string, area?: string) {
  const t = trade ? TRADE_BY_SLUG.get(trade) : undefined;
  const a = area ? AREA_BY_SLUG.get(area) : undefined;
  const need = t ? `Necesito un ${t.person}${a ? ` en ${a.name}` : ""} para ` : "Te quería consultar por ";
  return `Hola ${name.trim().split(" ")[0]}, te encontré en Changa. ${need}`;
}
