import { z } from "zod";
import { TRADE_BY_SLUG, PAYMENT_SLUGS } from "@/data/trades";
import { AREA_BY_SLUG } from "@/data/areas";

const optionalInt = (min: number, max: number, msg: string) =>
  z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number({ error: msg }).int({ error: msg }).min(min, { error: msg }).max(max, { error: msg }).nullable());

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Usá el formato de hora 08:30." });

export const ProfileSchema = z.object({
  displayName: z.string().trim().min(2, { error: "Escribí tu nombre (como querés que te vean los clientes)." }).max(60, { error: "El nombre es muy largo: hasta 60 letras." }),
  trades: z.array(z.string().refine((t) => TRADE_BY_SLUG.has(t), { error: "Elegí oficios de la lista." })).max(5, { error: "Podés elegir hasta 5 oficios." }),
  description: z.string().trim().max(800, { error: "La descripción es muy larga: hasta 800 letras." }),
  yearsExperience: optionalInt(0, 70, "Los años de experiencia tienen que ser un número entre 0 y 70."),
  zoneMode: z.enum(["areas", "radius"]),
  areas: z.array(z.string().refine((a) => AREA_BY_SLUG.has(a), { error: "Elegí barrios de la lista." })).max(20, { error: "Podés marcar hasta 20 barrios." }),
  baseLat: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().min(-35.5).max(-34).nullable()),
  baseLng: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().min(-59.5).max(-57.5).nullable()),
  radiusKm: optionalInt(1, 50, "El radio tiene que ser entre 1 y 50 km."),
  days: z.array(z.coerce.number().int().min(0).max(6)),
  from: z.union([time, z.literal("")]),
  to: z.union([time, z.literal("")]),
  urgencies: z.boolean(),
  payments: z.array(z.enum(PAYMENT_SLUGS)),
  licenseNumber: z.string().trim().max(40, { error: "La matrícula es muy larga." }),
});

export function profileFromForm(form: FormData) {
  return ProfileSchema.safeParse({
    displayName: form.get("displayName") ?? "",
    trades: form.getAll("trades"),
    description: form.get("description") ?? "",
    yearsExperience: form.get("yearsExperience"),
    zoneMode: form.get("zoneMode") ?? "areas",
    areas: form.getAll("areas"),
    baseLat: form.get("baseLat"),
    baseLng: form.get("baseLng"),
    radiusKm: form.get("radiusKm"),
    days: form.getAll("days"),
    from: form.get("from") ?? "",
    to: form.get("to") ?? "",
    urgencies: form.get("urgencies") === "on",
    payments: form.getAll("payments"),
    licenseNumber: form.get("licenseNumber") ?? "",
  });
}

export const ReviewSchema = z.object({
  rating: z.coerce.number({ error: "Elegí de 1 a 5 estrellas." }).int().min(1, { error: "Elegí de 1 a 5 estrellas." }).max(5, { error: "Elegí de 1 a 5 estrellas." }),
  text: z.string().trim().min(10, { error: "Contá un poco más: al menos 10 letras." }).max(1000, { error: "La reseña es muy larga: hasta 1000 letras." }),
  punctual: z.boolean(),
  tidy: z.boolean(),
  fairPrice: z.boolean(),
});

export const ReportSchema = z.object({
  targetType: z.enum(["worker", "review"]),
  targetId: z.uuid(),
  reason: z.enum(["falso", "ofensivo", "spam", "peligroso", "otro"], { error: "Elegí un motivo." }),
  details: z.string().trim().max(500, { error: "Hasta 500 letras." }),
});
