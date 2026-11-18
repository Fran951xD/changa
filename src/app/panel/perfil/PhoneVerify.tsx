"use client";
import { useActionState } from "react";
import { confirmOwnPhone, sendPhoneCode, verifyPhoneCode, type FormState } from "../actions";

type Props = {
  current: string | null;
  pending: string | null;
  mode: "sms" | "whatsapp";
  pendingWa: string | null; // link de WhatsApp al número pendiente (modo sin SMS), para cuando se recarga la página
};

export function PhoneVerify({ current, pending, mode, pendingWa }: Props) {
  const [sent, sendAction, sending] = useActionState<FormState, FormData>(sendPhoneCode, {});
  const [checked, verifyAction, verifying] = useActionState<FormState, FormData>(mode === "sms" ? verifyPhoneCode : confirmOwnPhone, {});
  const waiting = (sent.ok || pending) && !checked.ok;
  const wa = sent.wa ?? pendingWa;

  return (
    <section className="panel stack" aria-labelledby="tel" style={{ marginTop: 20 }}>
      <h2 id="tel">1. Tu celular</h2>
      <p className="muted">Es el número al que te van a escribir por WhatsApp. No lo mostramos en la página: aparece solo cuando un cliente toca “Contactar”.</p>
      {current && <p className="aviso aviso-ok" role="status">{mode === "sms" ? "Verificado" : "Confirmado"}: <strong>{current}</strong></p>}
      {checked.ok && <p className="aviso aviso-ok" role="status">{checked.ok}</p>}

      <form action={sendAction} noValidate>
        <div className="field">
          <label htmlFor="phone">{current ? "Cambiar número" : "Número de celular"}<span className="hint">Con código de área. Ej.: 11 2345-6789</span></label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national"
            aria-invalid={sent.error ? true : undefined} aria-describedby="phone-msg" />
          {sent.error && <p id="phone-msg" className="error" role="alert">{sent.error}</p>}
        </div>
        <button className="btn" disabled={sending}>
          {sending ? "Un segundo…" : mode === "sms" ? "Mandarme el código" : "Seguir"}
        </button>
      </form>

      {waiting && mode === "sms" && (
        <form action={verifyAction} noValidate>
          {sent.ok && <p role="status">{sent.ok}</p>}
          {sent.demo && <p className="aviso aviso-demo small">Modo demo (sin SMS): tu código es <strong>{sent.demo}</strong></p>}
          <div className="field" style={{ maxWidth: 240 }}>
            <label htmlFor="code">Código de 6 números</label>
            <input id="code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              aria-invalid={checked.error ? true : undefined} aria-describedby="code-msg" />
            {checked.error && <p id="code-msg" className="error" role="alert">{checked.error}</p>}
          </div>
          <button className="btn btn-azul" disabled={verifying}>{verifying ? "Verificando…" : "Verificar"}</button>
        </form>
      )}

      {waiting && mode === "whatsapp" && wa && (
        <form action={verifyAction} className="stack">
          <p style={{ margin: 0 }}>
            Tocá el botón: se abre WhatsApp con el número que escribiste. Si se abre <strong>tu propio chat</strong> (el que dice “Vos” o “Tú”),
            el número está bien. Si se abre el de otra persona o dice que no tiene WhatsApp, corregilo arriba.
          </p>
          <a className="btn btn-wa" href={wa} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>
          <button className="btn btn-azul" disabled={verifying}>{verifying ? "Guardando…" : "Sí, se abrió mi chat"}</button>
          {checked.error && <p className="error" role="alert">{checked.error}</p>}
        </form>
      )}
    </section>
  );
}
