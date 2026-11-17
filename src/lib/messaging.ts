import "server-only";
import { isDemo } from "./security";

type Sent = { demo?: string };

/** Enlace mágico. Con RESEND_API_KEY manda el mail; en modo demo devuelve el enlace para mostrarlo. */
export async function sendLoginEmail(to: string, url: string): Promise<Sent> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (isDemo()) return { demo: url };
    throw new Error("Falta configurar RESEND_API_KEY");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Changa <onboarding@resend.dev>",
      to,
      subject: "Tu enlace para entrar a Changa",
      text: `Tocá este enlace para entrar a Changa (vence en 15 minutos):\n\n${url}\n\nSi no lo pediste, ignorá este mail.`,
    }),
  });
  if (!res.ok) throw new Error(`Resend respondió ${res.status}`);
  return {};
}

/** Código por SMS. Con Twilio configurado lo manda; en modo demo lo devuelve para mostrarlo. */
export async function sendSmsCode(phone: string, code: string): Promise<Sent> {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from } = process.env;
  if (!sid || !token || !from) {
    if (isDemo()) return { demo: code };
    throw new Error("Falta configurar Twilio");
  }
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64") },
    body: new URLSearchParams({ To: `+${phone}`, From: from, Body: `Tu código de Changa es ${code}` }),
  });
  if (!res.ok) throw new Error(`Twilio respondió ${res.status}`);
  return {};
}
