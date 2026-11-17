"use client";
import { useActionState, useState } from "react";
import { changeSlug, type SlugState } from "./actions";

export function SlugForm({ current, host }: { current: string; host: string }) {
  const [state, action, pending] = useActionState<SlugState, FormData>(changeSlug, {});
  return (
    <form action={action} className="stack">
      <div className="field">
        <label htmlFor="slug">Cambiar tu link<span className="hint">Ojo: el link viejo deja de funcionar. Si ya imprimiste tarjetas, mejor dejalo como está.</span></label>
        <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
          <span className="muted" style={{ whiteSpace: "nowrap" }}>{host}/</span>
          <input id="slug" name="slug" type="text" defaultValue={current} autoCapitalize="none" spellCheck={false}
            aria-invalid={state.error ? true : undefined} aria-describedby="slug-msg" />
        </div>
        <p id="slug-msg" role="status" className={state.error ? "error" : "small"}>{state.error ?? state.ok ?? ""}</p>
      </div>
      <button className="btn btn-chico" disabled={pending}>Guardar link</button>
    </form>
  );
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" className="btn" onClick={async () => {
      try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* sin permiso: queda el link visible para copiar a mano */ }
    }}>
      {copied ? "¡Copiado!" : "Copiar link"}
    </button>
  );
}
