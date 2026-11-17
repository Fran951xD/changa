"use client";
import { useActionState } from "react";
import { requestLogin, type LoginState } from "./actions";

export function LoginForm({ next, turnstile }: { next: string; turnstile: React.ReactNode }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestLogin, {});

  if (state.sent) {
    return (
      <div role="status" className="aviso aviso-ok">
        <p><strong>Listo. Te mandamos un enlace a {state.sent}.</strong></p>
        <p className="small">Abrí tu mail y tocá el enlace para entrar. Vence en 15 minutos. Si no lo ves, buscá en Spam.</p>
        {state.demoUrl && (
          <p className="aviso aviso-demo small">
            Modo demo (sin servidor de mail): <a href={state.demoUrl}>entrar con este enlace</a>
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={action} noValidate>
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="email">Tu email</label>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required
          aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? "email-error" : undefined} />
        {state.error && <p id="email-error" className="error" role="alert">{state.error}</p>}
      </div>
      {turnstile}
      <button className="btn btn-azul btn-full" disabled={pending}>
        {pending ? "Mandando…" : "Mandame el enlace"}
      </button>
    </form>
  );
}
