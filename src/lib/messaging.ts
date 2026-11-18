import "server-only";
import { isDemo } from "./security";

type Sent = { demo?: string };

/** Sin Resend (hace falta dominio propio) el ingreso por mail solo existe en modo demo; queda Google. */
export const emailLoginEnabled = () => Boolean(process.env.RESEND_API_KEY) || isDemo();

/**
 * Cómo se confirma el celular: código por SMS con Twilio (o en pantalla en modo demo), o, sin SMS,
 * abriendo WhatsApp hacia el número cargado. shortcut: lo de WhatsApp frena errores de tipeo pero no prueba
 * titularidad; para eso, Twilio o la API de WhatsApp Business con un número de Changa.
 */
export const phoneMode = (): "sms" | "whatsapp" =>
  process.env.PHONE_VERIFICATION === "whatsapp" ? "whatsapp" // forzado (lo usan las e2e para probar el camino de producción)
    : (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) || isDemo() ? "sms" : "whatsapp";

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
