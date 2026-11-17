import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getWorkerForUser } from "@/lib/workers";
import { qrSvg, siteHost, siteUrl } from "@/lib/share";
import { formatArPhone } from "@/lib/phone";
import { TRADE_BY_SLUG } from "@/data/trades";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Imprimir tarjetas", robots: { index: false } };

/** Hoja A4 con 10 tarjetas de 85 × 55 mm (tamaño tarjeta de presentación / imán de heladera). */
export default async function Imprimir() {
  const user = await requireUser("/panel/compartir/imprimir");
  const w = await getWorkerForUser(user.id);
  if (!w) redirect("/panel");
  const trade = TRADE_BY_SLUG.get(w.trades[0]);
  const svg = await qrSvg(`${siteUrl()}/${w.slug}`);

  return (
    <div className="wrap">
      <style>{`
        @page { size: A4; margin: 10mm; }
        .hoja { display: grid; grid-template-columns: repeat(auto-fill, 85mm); gap: 4mm; justify-content: center; }
        .tarjeta { width: 85mm; height: 55mm; border: 0.4mm dashed #9aa1ab; border-radius: 3mm; padding: 4mm 4mm 4mm 7mm; display: grid; grid-template-columns: 1fr 26mm; gap: 3mm; position: relative; background: #fff; overflow: hidden; break-inside: avoid; }
        .tarjeta::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3.5mm; background: ${trade?.color ?? "#1f4bd8"}; }
        .tarjeta h2 { font-size: 13pt; margin: 0 0 1mm; line-height: 1.05; }
        .tarjeta p { margin: 0; font-size: 8.5pt; line-height: 1.25; }
        .tarjeta .tel { font-size: 12pt; font-weight: 800; margin-top: 2mm; }
        .tarjeta .qr svg { width: 26mm; height: 26mm; display: block; }
        .tarjeta .url { font-size: 7pt; text-align: center; word-break: break-all; margin-top: 1mm; }
        @media print { .wrap { max-width: none; padding: 0; } .tarjeta { border-color: #ccc; } }
      `}</style>
      <div className="page-head no-print">
        <p><Link href="/panel/compartir">Volver</Link></p>
        <h1>Tus tarjetas para imprimir</h1>
        <p className="muted">Imprimí en papel grueso o en papel imantado y recortá por la línea punteada.</p>
        <PrintButton />
      </div>
      <div className="hoja">
        {Array.from({ length: 10 }, (_, i) => (
          <div className="tarjeta" key={i}>
            <div>
              <h2>{w.displayName}</h2>
              <p><strong>{w.trades.map((t) => TRADE_BY_SLUG.get(t)?.name).join(" · ")}</strong></p>
              {w.urgencies && <p>Atiendo urgencias</p>}
              {w.licenseNumber && <p>Matrícula {w.licenseNumber}</p>}
              {w.phone && <p className="tel">{formatArPhone(w.phone)}</p>}
              <p style={{ marginTop: "2mm" }}>Mirá mis trabajos y reseñas en Changa</p>
            </div>
            <div>
              <div className="qr" dangerouslySetInnerHTML={{ __html: svg }} />
              <p className="url">{siteHost()}/{w.slug}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
