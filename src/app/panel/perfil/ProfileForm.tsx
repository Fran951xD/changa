"use client";
import { useActionState, useState, startTransition } from "react";
import { saveProfile, type FormState } from "../actions";
import { TRADES, TRADE_BY_SLUG, PAYMENT_METHODS, DAYS } from "@/data/trades";
import { AREA_BY_SLUG, normalizeText } from "@/data/areas";
import { AreaCombo } from "@/components/AreaCombo";
import type { Schedule } from "@/db/schema";

export type ProfileInitial = {
  displayName: string; trades: string[]; description: string; yearsExperience: number | null;
  zoneMode: "areas" | "radius"; areas: string[]; baseLat: number | null; baseLng: number | null; radiusKm: number | null;
  schedule: Schedule | null; urgencies: boolean; paymentMethods: string[]; licenseNumber: string | null; published: boolean;
};

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p id={id} className="error">{msg}</p> : null;
}

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, {});
  const fe = state.fieldErrors ?? {};
  const [trades, setTrades] = useState<string[]>(initial.trades);
  const [tradeQuery, setTradeQuery] = useState("");
  const [zoneMode, setZoneMode] = useState(initial.zoneMode);
  const [areas, setAreas] = useState<string[]>(initial.areas);
  const [base, setBase] = useState<{ lat: number; lng: number; label: string } | null>(
    initial.baseLat != null && initial.zoneMode === "radius" ? { lat: initial.baseLat, lng: initial.baseLng!, label: "el punto que marcaste" } : null,
  );
  const [locError, setLocError] = useState("");

  const visibleTrades = TRADES.filter((t) => !tradeQuery || normalizeText(t.name + " " + t.person).includes(normalizeText(tradeQuery)));
  const needsLicense = trades.some((t) => TRADE_BY_SLUG.get(t)?.licensable);

  function useMyLocation() {
    setLocError("");
    if (!navigator.geolocation) return setLocError("Tu navegador no permite usar la ubicación. Elegí un barrio.");
    navigator.geolocation.getCurrentPosition(
      (p) => setBase({ lat: p.coords.latitude, lng: p.coords.longitude, label: "tu ubicación actual" }),
      () => setLocError("No pudimos usar tu ubicación. Elegí un barrio en su lugar."),
      { timeout: 10000 },
    );
  }

  return (
    // onSubmit manual: evita que React 19 resetee el formulario y se pierda lo escrito si hay errores.
    <form noValidate onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
      startTransition(() => action(fd));
    }}>
      {state.error && <p className="aviso aviso-error" role="alert">{state.error}</p>}
      {state.ok && <p className="aviso aviso-ok" role="status">{state.ok}</p>}

      <section className="panel stack" aria-labelledby="s1">
        <h2 id="s1">2. Quién sos</h2>
        <div className="field">
          <label htmlFor="displayName">Tu nombre<span className="hint">Como te conocen los clientes. Ej.: Juan Pérez o Juan el plomero.</span></label>
          <input id="displayName" name="displayName" type="text" defaultValue={initial.displayName} autoComplete="name"
            aria-invalid={fe.displayName ? true : undefined} aria-describedby="e-displayName" />
          <FieldError id="e-displayName" msg={fe.displayName} />
        </div>
        <fieldset>
          <legend>Tu oficio<span className="hint">Podés elegir hasta 5.</span></legend>
          <div className="field">
            <label htmlFor="trade-q" className="sr-only">Buscar oficio</label>
            <input id="trade-q" type="search" placeholder="Buscar: gas, pintor, aire…" value={tradeQuery} onChange={(e) => setTradeQuery(e.target.value)} />
          </div>
          <ul className="chips">
            {TRADES.map((t) => (
              <li key={t.slug} hidden={!visibleTrades.includes(t) && !trades.includes(t.slug)}>
                <label className="chip">
                  <input type="checkbox" name="trades" value={t.slug} checked={trades.includes(t.slug)}
                    onChange={(e) => setTrades((cur) => e.target.checked ? [...cur, t.slug].slice(0, 5) : cur.filter((x) => x !== t.slug))} />
                  {t.name}
                </label>
              </li>
            ))}
          </ul>
          <FieldError id="e-trades" msg={fe.trades} />
        </fieldset>
      </section>

      <section className="panel stack" aria-labelledby="s2" style={{ marginTop: 20 }}>
        <h2 id="s2">3. Dónde trabajás</h2>
        <fieldset>
          <legend>¿Cómo querés marcar tu zona?</legend>
          <div className="row">
            <label className="chip"><input type="radio" name="zoneMode" value="areas" checked={zoneMode === "areas"} onChange={() => setZoneMode("areas")} />Por barrios</label>
            <label className="chip"><input type="radio" name="zoneMode" value="radius" checked={zoneMode === "radius"} onChange={() => setZoneMode("radius")} />Por distancia</label>
          </div>
        </fieldset>
        {zoneMode === "areas" ? (
          <div>
            <AreaCombo label="Agregá barrios o localidades" hint="Escribí y elegí de la lista. Podés sumar varios." clearOnPick
              onPick={(a) => setAreas((cur) => (cur.includes(a.slug) ? cur : [...cur, a.slug]))} invalid={!!fe.areas} />
            {areas.length > 0 ? (
              <ul className="chips" aria-label="Barrios elegidos">
                {areas.map((a) => (
                  <li key={a}>
                    <input type="hidden" name="areas" value={a} />
                    <button type="button" className="chip" aria-pressed="true" onClick={() => setAreas((cur) => cur.filter((x) => x !== a))}
                      aria-label={`Quitar ${AREA_BY_SLUG.get(a)?.name}`}>
                      {AREA_BY_SLUG.get(a)?.name} <span aria-hidden="true">✕</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="muted small">Todavía no elegiste ningún barrio.</p>}
            <FieldError id="e-areas" msg={fe.areas} />
          </div>
        ) : (
          <div>
            <p className="label">Desde dónde salís</p>
            <div className="row" style={{ marginBottom: 12 }}>
              <button type="button" className="btn btn-chico" onClick={useMyLocation}>Usar mi ubicación</button>
              <span className="muted small">o elegí un barrio:</span>
            </div>
            <AreaCombo label="Barrio de salida" onPick={(a) => setBase({ lat: a.lat, lng: a.lng, label: a.name })} />
            {locError && <p className="error">{locError}</p>}
            {base && <p className="small" role="status">Punto marcado: {base.label}. En tu perfil mostramos solo la zona aproximada, nunca tu dirección.</p>}
            <input type="hidden" name="baseLat" value={base?.lat ?? ""} />
            <input type="hidden" name="baseLng" value={base?.lng ?? ""} />
            <div className="field">
              <label htmlFor="radiusKm">¿Hasta cuántos km vas?</label>
              <input id="radiusKm" name="radiusKm" type="number" inputMode="numeric" min={1} max={50} defaultValue={initial.radiusKm ?? 10}
                aria-invalid={fe.radiusKm ? true : undefined} aria-describedby="e-radiusKm" />
              <FieldError id="e-radiusKm" msg={fe.radiusKm} />
            </div>
          </div>
        )}
      </section>

      <section className="panel stack" aria-labelledby="s3" style={{ marginTop: 20 }}>
        <h2 id="s3">4. Cómo trabajás <span className="muted small">(opcional)</span></h2>
        <div className="field">
          <label htmlFor="description">Contá qué hacés<span className="hint">Ej.: Destapaciones, cambio de cañerías y termotanques. Trabajo prolijo y con garantía.</span></label>
          <textarea id="description" name="description" defaultValue={initial.description} maxLength={800} aria-describedby="e-description" />
          <FieldError id="e-description" msg={fe.description} />
        </div>
        <div className="field" style={{ maxWidth: 220 }}>
          <label htmlFor="yearsExperience">Años de experiencia</label>
          <input id="yearsExperience" name="yearsExperience" type="number" inputMode="numeric" min={0} max={70} defaultValue={initial.yearsExperience ?? ""}
            aria-invalid={fe.yearsExperience ? true : undefined} aria-describedby="e-yearsExperience" />
          <FieldError id="e-yearsExperience" msg={fe.yearsExperience} />
        </div>
        <fieldset>
          <legend>Días que trabajás</legend>
          <ul className="chips">
            {DAYS.map((d, i) => (
              <li key={d}><label className="chip"><input type="checkbox" name="days" value={i} defaultChecked={initial.schedule?.days.includes(i)} />{d}</label></li>
            ))}
          </ul>
        </fieldset>
        <div className="row">
          <div className="field"><label htmlFor="from">Desde</label><input id="from" name="from" type="time" defaultValue={initial.schedule?.from ?? "08:00"} /></div>
          <div className="field"><label htmlFor="to">Hasta</label><input id="to" name="to" type="time" defaultValue={initial.schedule?.to ?? "18:00"} /></div>
        </div>
        <FieldError id="e-from" msg={fe.from ?? fe.to} />
        <label className="check"><input type="checkbox" name="urgencies" defaultChecked={initial.urgencies} />Atiendo urgencias fuera de horario</label>
        <fieldset>
          <legend>Medios de pago que aceptás</legend>
          <ul className="chips">
            {PAYMENT_METHODS.map((p) => (
              <li key={p.slug}><label className="chip"><input type="checkbox" name="payments" value={p.slug} defaultChecked={initial.paymentMethods.includes(p.slug)} />{p.name}</label></li>
            ))}
          </ul>
        </fieldset>
        {needsLicense && (
          <div className="field">
            <label htmlFor="licenseNumber">Número de matrícula<span className="hint">Si la tenés, aparece el sello “Matrícula informada”. Changa no la verifica con el ente: el cliente puede pedírtela.</span></label>
            <input id="licenseNumber" name="licenseNumber" type="text" defaultValue={initial.licenseNumber ?? ""} />
          </div>
        )}
      </section>

      <div className="row" style={{ marginTop: 20, position: "sticky", bottom: 0, background: "var(--esmalte)", padding: "12px 0", borderTop: "var(--borde)" }}>
        <button className="btn" name="intent" value="save" disabled={pending}>Guardar</button>
        <button className="btn btn-azul" name="intent" value="publish" disabled={pending}>
          {initial.published ? "Guardar cambios" : "Guardar y publicar"}
        </button>
        {pending && <span role="status" className="muted">Guardando…</span>}
      </div>
    </form>
  );
}
