import type { Metadata } from "next";
import { and, desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getWorkerForUser } from "@/lib/workers";
import { formatArPhone, whatsappLink } from "@/lib/phone";
import { TRADE_BY_SLUG } from "@/data/trades";
import { AREA_BY_SLUG } from "@/data/areas";

export const metadata: Metadata = { title: "Pedidos de presupuesto", robots: { index: false } };

export default async function Pedidos() {
  const user = await requireUser("/panel/pedidos");
  const w = await getWorkerForUser(user.id);
  if (!w) redirect("/panel");

  const quotes = await db.select({
    id: schema.quoteRequests.id, name: schema.quoteRequests.name, phone: schema.quoteRequests.phone,
    trade: schema.quoteRequests.trade, area: schema.quoteRequests.area, description: schema.quoteRequests.description,
    photoIds: schema.quoteRequests.photoIds, createdAt: schema.quoteRequests.createdAt, seenAt: schema.quoteRecipients.seenAt,
  }).from(schema.quoteRecipients)
    .innerJoin(schema.quoteRequests, eq(schema.quoteRequests.id, schema.quoteRecipients.quoteId))
    .where(eq(schema.quoteRecipients.workerId, w.id))
    .orderBy(desc(schema.quoteRequests.createdAt)).limit(50);

  // Al abrir la página quedan marcados como vistos (el aviso del menú se apaga).
  await db.update(schema.quoteRecipients).set({ seenAt: new Date() })
    .where(and(eq(schema.quoteRecipients.workerId, w.id), isNull(schema.quoteRecipients.seenAt)));

  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <h1>Pedidos de presupuesto</h1>
      {quotes.length === 0 ? (
        <div className="panel" role="status">
          <p style={{ margin: 0 }}>Todavía no te llegaron pedidos. Cuando un vecino pida presupuesto en tu zona y te elija, aparece acá con su WhatsApp para que le respondas. Prender “Disponible ahora” te pone primero en la lista.</p>
        </div>
      ) : (
        <ul className="stack" style={{ listStyle: "none", padding: 0 }}>
          {quotes.map((q) => (
            <li key={q.id} className="panel stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{q.name} · {AREA_BY_SLUG.get(q.area)?.name}</h2>
                {!q.seenAt && <span className="sello" style={{ background: "var(--amarillo)" }}>Nuevo</span>}
              </div>
              <p className="muted small" style={{ margin: 0 }}>
                {TRADE_BY_SLUG.get(q.trade)?.name} · {q.createdAt.toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })}
              </p>
              <p style={{ whiteSpace: "pre-line", margin: 0 }}>{q.description}</p>
              {q.photoIds.length > 0 && (
                <ul className="galeria">
                  {q.photoIds.map((id, i) => <li key={id}><a href={`/i/${id}`}><img src={`/i/${id}?t=1`} alt={`Foto ${i + 1} del pedido`} width={140} height={140} loading="lazy" /></a></li>)}
                </ul>
              )}
              <div className="row">
                <a className="btn btn-wa" href={whatsappLink(q.phone, `Hola ${q.name}, soy ${w.displayName.split(" ")[0]}. Te escribo por el presupuesto que pediste en Changa.`)} target="_blank" rel="noopener noreferrer">
                  Responder por WhatsApp
                </a>
                <a className="btn" href={`tel:+${q.phone}`}>Llamar al {formatArPhone(q.phone)}</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
