"use client";
import { useState } from "react";

type Props = { slug: string; name: string; trade?: string; area?: string; compact?: boolean };

/**
 * El teléfono nunca está en el HTML: WhatsApp es un POST que redirige a wa.me, y "Llamar"
 * pide el número al servidor recién cuando se toca (con límite por IP contra robots).
 */
export function ContactButtons({ slug, name, trade, area, compact }: Props) {
  const [phone, setPhone] = useState<{ display: string; tel: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const first = name.split(" ")[0];

  async function call() {
    setLoading(true);
    setError("");
    const body = new FormData();
    body.set("slug", slug);
    body.set("channel", "call");
    const res = await fetch("/contactar", { method: "POST", body, headers: { Accept: "application/json" } }).catch(() => null);
    setLoading(false);
    if (!res?.ok) {
      setError(res?.status === 429 ? "Hiciste muchos pedidos seguidos. Esperá un minuto y probá de nuevo." : "No pudimos traer el número. Probá de nuevo.");
      return;
    }
    const data = await res.json();
    setPhone(data);
    window.location.href = data.tel;
  }

  return (
    <div className={compact ? "iman-acciones" : "stack"}>
      <form action="/contactar" method="post" target="_blank">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="channel" value="whatsapp" />
        {trade && <input type="hidden" name="trade" value={trade} />}
        {area && <input type="hidden" name="area" value={area} />}
        <button className="btn btn-wa btn-full" aria-label={`Contactar a ${first} por WhatsApp`}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" /></svg>
          {compact ? "WhatsApp" : `Escribirle a ${first} por WhatsApp`}
        </button>
      </form>
      {phone ? (
        <a className="btn" href={phone.tel}>{phone.display}</a>
      ) : (
        <button type="button" className="btn" onClick={call} disabled={loading} aria-label={`Llamar a ${first}`}>
          {loading ? "…" : "Llamar"}
        </button>
      )}
      {error && <p className="error" role="alert" style={{ gridColumn: "1 / -1" }}>{error}</p>}
    </div>
  );
}
