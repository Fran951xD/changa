import "server-only";
import QRCode from "qrcode";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
export const siteHost = () => siteUrl().replace(/^https?:\/\//, "");

/** QR en SVG (se ve nítido impreso a cualquier tamaño y pesa ~2 KB). */
export function qrSvg(text: string) {
  return QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1b2430", light: "#ffffff" } });
}
