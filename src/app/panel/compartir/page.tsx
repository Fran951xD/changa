import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getWorkerForUser } from "@/lib/workers";
import { qrSvg, siteHost, siteUrl } from "@/lib/share";
import { SlugForm, CopyLink } from "./SlugForm";

export const metadata: Metadata = { title: "Compartir mi tarjeta", robots: { index: false } };

export default async function Compartir() {
  const user = await requireUser("/panel/compartir");
  const w = await getWorkerForUser(user.id);
  if (!w) redirect("/panel");
  const url = `${siteUrl()}/${w.slug}`;
  const svg = await qrSvg(url);
  const share = `Hola! Te paso mi tarjeta en Changa, ahí ves mis trabajos y reseñas: ${url}`;

  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <h1>Compartí tu tarjeta</h1>
      {w.status !== "published" && <p className="aviso" role="status">Tu tarjeta todavía no está publicada: el link va a funcionar cuando la publiques.</p>}
      <section className="panel stack" aria-labelledby="link">
        <h2 id="link">Tu link</h2>
        <p style={{ fontSize: "1.3rem", fontWeight: 800, fontStretch: "112%", wordBreak: "break-all", margin: 0 }}>{siteHost()}/{w.slug}</p>
        <div className="row">
          <CopyLink url={url} />
          <a className="btn btn-wa" href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noopener noreferrer">Mandarlo por WhatsApp</a>
        </div>
        <p className="muted small" style={{ margin: 0 }}>Ponelo en tu estado de WhatsApp, en Instagram o mandáselo a tus clientes para que te dejen una reseña.</p>
      </section>

      <section className="panel stack" aria-labelledby="qr" style={{ marginTop: 20 }}>
        <h2 id="qr">Tu código QR</h2>
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div role="img" aria-label={`Código QR que abre ${siteHost()}/${w.slug}`} style={{ width: 180, border: "var(--borde)", borderRadius: 12, padding: 6, background: "#fff" }}
            dangerouslySetInnerHTML={{ __html: svg }} />
          <div style={{ flex: 1, minWidth: 220 }} className="stack">
            <p style={{ margin: 0 }}>Imprimí tus imanes o tarjetas con este QR: el cliente lo escanea con la cámara y llega directo a tu perfil, con tu WhatsApp.</p>
            <div className="row">
              <Link className="btn btn-azul" href="/panel/compartir/imprimir">Imprimir tarjetas</Link>
              <a className="btn" href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} download={`qr-${w.slug}.svg`}>Descargar QR</a>
            </div>
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 20 }} aria-label="Cambiar link">
        <SlugForm current={w.slug} host={siteHost()} />
      </section>
    </div>
  );
}
