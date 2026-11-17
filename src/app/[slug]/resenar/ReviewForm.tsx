"use client";
import { useActionState, startTransition } from "react";
import { createReview, type ReviewState } from "./actions";

const LABELS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

export function ReviewForm({ slug, workerFirst, defaultName }: { slug: string; workerFirst: string; defaultName: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(createReview, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form noValidate className="panel stack" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      startTransition(() => action(fd));
    }}>
      <input type="hidden" name="slug" value={slug} />
      {state.error && <p className="aviso aviso-error" role="alert">{state.error}</p>}
      <fieldset aria-describedby={fe.rating ? "e-rating" : undefined}>
        <legend>¿Cómo fue el trabajo de {workerFirst}?</legend>
        <div className="chips">
          {[5, 4, 3, 2, 1].map((n) => (
            <label key={n} className="chip">
              <input type="radio" name="rating" value={n} required />
              <span aria-hidden="true" style={{ color: "#a87300" }}>{"★".repeat(n)}</span> {LABELS[n]}
            </label>
          ))}
        </div>
        {fe.rating && <p id="e-rating" className="error">{fe.rating}</p>}
      </fieldset>
      <div className="field">
        <label htmlFor="text">Contá tu experiencia<span className="hint">Qué hizo, si cumplió con lo acordado, cómo dejó todo. Le sirve al próximo vecino.</span></label>
        <textarea id="text" name="text" maxLength={1000} aria-invalid={fe.text ? true : undefined} aria-describedby="e-text" />
        {fe.text && <p id="e-text" className="error">{fe.text}</p>}
      </div>
      <fieldset>
        <legend>¿Querés destacar algo? <span className="muted small">(opcional)</span></legend>
        <div className="chips">
          <label className="chip"><input type="checkbox" name="punctual" />Puntual</label>
          <label className="chip"><input type="checkbox" name="tidy" />Prolijo</label>
          <label className="chip"><input type="checkbox" name="fairPrice" />Precio justo</label>
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="authorName">Tu nombre<span className="hint">Se muestra solo tu nombre y la inicial del apellido.</span></label>
        <input id="authorName" name="authorName" type="text" autoComplete="name" defaultValue={defaultName}
          aria-invalid={fe.authorName ? true : undefined} aria-describedby="e-authorName" />
        {fe.authorName && <p id="e-authorName" className="error">{fe.authorName}</p>}
      </div>
      <button className="btn btn-azul" disabled={pending}>{pending ? "Publicando…" : "Publicar reseña"}</button>
      <p className="muted small" style={{ margin: 0 }}>{workerFirst} puede responder tu reseña en público, pero no borrarla.</p>
    </form>
  );
}
