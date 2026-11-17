"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TRADES } from "@/data/trades";
import { AreaCombo } from "./AreaCombo";

/** Buscador oficio + barrio. Sin JS envía el GET igual; con JS suma "usar mi ubicación". */
export function SearchForm({ trade, area }: { trade?: string; area?: string }) {
  const router = useRouter();
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  function nearMe(form: HTMLFormElement) {
    const oficio = (form.elements.namedItem("oficio") as HTMLSelectElement).value;
    if (!navigator.geolocation) return setLocError("Tu navegador no permite usar la ubicación. Elegí tu provincia y ciudad.");
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (p) => router.push(`/buscar?oficio=${oficio}&lat=${p.coords.latitude.toFixed(4)}&lng=${p.coords.longitude.toFixed(4)}`),
      () => { setLocating(false); setLocError("No pudimos usar tu ubicación. Elegí tu provincia y ciudad."); },
      { timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <form action="/buscar" method="get" className="buscador" role="search">
      <div className="field">
        <label htmlFor="oficio">Qué necesitás</label>
        <select id="oficio" name="oficio" defaultValue={trade ?? "plomeria"}>
          {TRADES.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <AreaCombo label="Ciudad o barrio" name="zona" defaultSlug={area} />
        <button type="button" className="linkbtn small" style={{ marginTop: -10 }}
          onClick={(e) => nearMe(e.currentTarget.form!)} disabled={locating}>
          {locating ? "Buscando tu ubicación…" : "Usar mi ubicación"}
        </button>
        {locError && <p className="error" role="alert">{locError}</p>}
      </div>
      <button className="btn btn-azul buscador-btn">Buscar</button>
    </form>
  );
}
