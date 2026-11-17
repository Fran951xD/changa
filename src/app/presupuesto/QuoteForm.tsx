"use client";
import { useActionState, useState, startTransition } from "react";
import { createQuote, type QuoteState } from "./actions";
import { shrinkImage } from "@/lib/shrink-image";

type Candidate = { id: string; name: string; rating: string; available: boolean; distance: string };

export function QuoteForm({ trade, area, areaName, tradeName, candidates, turnstile }: {
  trade: string; area: string; areaName: string; tradeName: string; candidates: Candidate[]; turnstile: React.ReactNode;
}) {
  const [state, action, pending] = useActionState<QuoteState, FormData>(createQuote, {});
  const [chosen, setChosen] = useState<string[]>(candidates.slice(0, 3).map((c) => c.id));
  const fe = state.fieldErrors ?? {};

  return (
    <form noValidate className="stack" onSubmit={async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const photos = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 3);
      fd.delete("photos");
      for (const p of await Promise.all(photos.map((p) => shrinkImage(p)))) fd.append("photos", p);
      startTransition(() => action(fd));
    }}>
      <input type="hidden" name="trade" value={trade} />
      <input type="hidden" name="area" value={area} />
      {state.error && <p className="aviso aviso-error" role="alert">{state.error}</p>}

      <section className="panel stack" aria-labelledby="q1">
        <h2 id="q1">1. Qué necesitás</h2>
        <div className="field">
          <label htmlFor="description">Describí el trabajo<span className="hint">Ej.: Pierde agua la canilla de la cocina y el sifón del baño. Depto en 3er piso.</span></label>
          <textarea id="description" name="description" maxLength={1500} aria-invalid={fe.description ? true : undefined} aria-describedby="e-description" />
          {fe.description && <p id="e-description" className="error">{fe.description}</p>}
        </div>
        <div className="field">
          <label htmlFor="photos">Fotos <span className="muted small">(opcional, hasta 3)</span><span className="hint">Una foto del problema ayuda a que te pasen un precio más preciso.</span></label>
          <input id="photos" name="photos" type="file" accept="image/*" multiple />
        </div>
      </section>

      <section className="panel stack" aria-labelledby="q2">
        <h2 id="q2">2. A quién se lo mandás</h2>
        <fieldset aria-describedby="e-workers">
          <legend>{tradeName} cerca de {areaName} <span className="muted small">(hasta 3)</span></legend>
          <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {candidates.map((c) => {
              const on = chosen.includes(c.id);
              return (
                <li key={c.id}>
                  <label className="check" style={{ alignItems: "flex-start" }}>
                    <input type="checkbox" name="workers" value={c.id} checked={on} disabled={!on && chosen.length >= 3}
                      onChange={(e) => setChosen((cur) => e.target.checked ? [...cur, c.id] : cur.filter((x) => x !== c.id))} />
                    <span>
                      {c.name} {c.available && <span className="sello" style={{ background: "var(--amarillo)" }}>Disponible ahora</span>}
                      <span className="hint">{c.rating} · a {c.distance}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {fe.workers && <p id="e-workers" className="error">{fe.workers}</p>}
        </fieldset>
      </section>

      <section className="panel stack" aria-labelledby="q3">
        <h2 id="q3">3. Cómo te contactan</h2>
        <div className="field">
          <label htmlFor="name">Tu nombre</label>
          <input id="name" name="name" type="text" autoComplete="given-name" aria-invalid={fe.name ? true : undefined} aria-describedby="e-name" />
          {fe.name && <p id="e-name" className="error">{fe.name}</p>}
        </div>
        <div className="field">
          <label htmlFor="phone">Tu celular con WhatsApp<span className="hint">Solo lo ven los trabajadores que elegiste. Te escriben ahí.</span></label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" aria-invalid={fe.phone ? true : undefined} aria-describedby="e-phone" />
          {fe.phone && <p id="e-phone" className="error">{fe.phone}</p>}
        </div>
        {turnstile}
        <button className="btn btn-azul" disabled={pending || chosen.length === 0}>
          {pending ? "Mandando…" : `Mandar pedido a ${chosen.length} ${chosen.length === 1 ? "trabajador" : "trabajadores"}`}
        </button>
      </section>
    </form>
  );
}
