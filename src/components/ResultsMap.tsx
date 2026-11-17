"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type Pin = { slug: string; name: string; lat: number; lng: number; available: boolean; rating: string };

/** Mapa con OpenStreetMap. Leaflet (~40 KB) se carga solo cuando se elige la vista de mapa. */
export default function ResultsMap({ pins, center }: { pins: Pin[]; center: { lat: number; lng: number } }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false }).setView([center.lat, center.lng], 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      L.circleMarker([center.lat, center.lng], { radius: 7, color: "#1b2430", fillColor: "#1f4bd8", fillOpacity: 1, weight: 2 })
        .addTo(map).bindTooltip("Punto de búsqueda");
      const bounds = L.latLngBounds([[center.lat, center.lng]]);
      for (const p of pins) {
        const icon = L.divIcon({
          className: "",
          html: `<span style="display:block;width:22px;height:22px;border-radius:50%;border:2px solid #1b2430;background:${p.available ? "#ffd23f" : "#fff"};box-shadow:0 2px 0 #1b2430"></span>`,
          iconSize: [22, 22],
        });
        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = p.name;
        // Botón grande: el link de texto chico era difícil de tocar con el dedo.
        const a = document.createElement("a");
        a.href = `/${p.slug}`;
        a.textContent = "Ver perfil";
        a.style.cssText = "display:block;margin-top:8px;padding:10px 14px;border-radius:10px;background:#1f4bd8;color:#fff;text-align:center;font-weight:700;text-decoration:none";
        popup.append(title, document.createElement("br"), `${p.rating}${p.available ? " · Disponible ahora" : ""}`, a);
        L.marker([p.lat, p.lng], { icon, title: p.name, alt: p.name }).addTo(map).bindPopup(popup);
        bounds.extend([p.lat, p.lng]);
      }
      if (pins.length) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    });
    return () => { cancelled = true; map?.remove(); };
  }, [pins, center]);

  return <div ref={ref} className="mapa" role="region" aria-label="Mapa de resultados. La ubicación es aproximada." />;
}
