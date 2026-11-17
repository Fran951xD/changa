import { ImageResponse } from "next/og";

export const alt = "Changa: oficios de tu barrio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MAGNETS = [["Plomería", "#1F4BD8", -3], ["Electricidad", "#E0A100", 2], ["Gas", "#C8261B", -1], ["Pintura", "#2F8F6B", 3], ["Cerrajería", "#4A4F5C", -2]] as const;

// Imagen para compartir la portada: la puerta de la heladera con imanes de oficios.
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#eef0ec", display: "flex", flexDirection: "column", padding: 72, color: "#1b2430", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 56, fontWeight: 900 }}>
          <div style={{ width: 44, height: 44, borderRadius: 44, background: "#1f4bd8" }} />changa
        </div>
        <div style={{ fontSize: 96, fontWeight: 900, marginTop: 40, lineHeight: 1 }}>¿Qué se rompió?</div>
        <div style={{ fontSize: 36, marginTop: 20, color: "#4a5463" }}>Gente de oficio de tu barrio, con reseñas reales.</div>
        <div style={{ display: "flex", gap: 20, marginTop: "auto", flexWrap: "wrap" }}>
          {MAGNETS.map(([name, color, rot]) => (
            <div key={name} style={{ display: "flex", padding: "14px 28px", borderRadius: 999, border: "4px solid #1b2430", background: color, color: color === "#E0A100" ? "#1b2430" : "#fff", fontSize: 34, fontWeight: 800, transform: `rotate(${rot}deg)`, boxShadow: "0 6px 0 #1b2430" }}>{name}</div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
