import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { ReportSchema } from "@/lib/validation";
import { rateLimit, safeNext, verifyTurnstile } from "@/lib/security";
import { Turnstile } from "@/components/Turnstile";

export const metadata: Metadata = { title: "Denunciar", robots: { index: false } };

const REASONS = [
  ["falso", "Es falso o engañoso"],
  ["ofensivo", "Es ofensivo o discriminatorio"],
  ["spam", "Es publicidad o spam"],
  ["peligroso", "Pone en riesgo a alguien (estafa, trabajo peligroso)"],
  ["otro", "Otro motivo"],
] as const;

async function submit(form: FormData) {
  "use server";
  const back = safeNext(form.get("volver"), "/");
  const parsed = ReportSchema.safeParse({
    targetType: form.get("tipo"), targetId: form.get("id"), reason: form.get("reason"), details: form.get("details") ?? "",
  });
  const qs = new URLSearchParams({ tipo: String(form.get("tipo")), id: String(form.get("id")), volver: back });
  if (!parsed.success) redirect(`/denunciar?${qs}&error=motivo`);
  if (!(await verifyTurnstile(form.get("cf-turnstile-response")))) redirect(`/denunciar?${qs}&error=robot`);
  if (!(await rateLimit("report", 10, 86_400))) redirect(`/denunciar?${qs}&error=limite`);
  const user = await getUser();
  await db.insert(schema.reports).values({ ...parsed.data, reporterId: user?.id });
  redirect(`${back}${back.includes("?") ? "&" : "?"}denuncia=ok`);
}

const ERRORS: Record<string, string> = {
  motivo: "Elegí un motivo para la denuncia.",
  robot: "No pudimos confirmar que no sos un robot. Probá de nuevo.",
  limite: "Hiciste muchas denuncias hoy. Si es urgente, escribinos a hola@changa.app.",
};

export default async function Denunciar({ searchParams }: PageProps<"/denunciar">) {
  const sp = await searchParams;
  const tipo = sp.tipo === "review" ? "review" : "worker";
  const id = z.uuid().safeParse(sp.id);
  const volver = safeNext(sp.volver, "/");
  if (!id.success) redirect("/");

  return (
    <div className="wrap" style={{ maxWidth: 560 }}>
      <div className="page-head">
        <h1>Denunciar {tipo === "review" ? "una reseña" : "un perfil"}</h1>
        <p className="muted">Lo revisa una persona del equipo en menos de 48 horas. Si corresponde, lo ocultamos.</p>
      </div>
      {typeof sp.error === "string" && ERRORS[sp.error] && <p className="aviso aviso-error" role="alert">{ERRORS[sp.error]}</p>}
      <form action={submit} className="panel stack">
        <input type="hidden" name="tipo" value={tipo} />
        <input type="hidden" name="id" value={id.data} />
        <input type="hidden" name="volver" value={volver} />
        <fieldset>
          <legend>¿Qué pasa?</legend>
          {REASONS.map(([value, label]) => (
            <label key={value} className="check"><input type="radio" name="reason" value={value} required />{label}</label>
          ))}
        </fieldset>
        <div className="field">
          <label htmlFor="details">Contanos más <span className="muted small">(opcional)</span></label>
          <textarea id="details" name="details" maxLength={500} />
        </div>
        <Turnstile />
        <div className="row">
          <button className="btn btn-rojo">Enviar denuncia</button>
          <Link href={volver}>Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
