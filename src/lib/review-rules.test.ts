import { describe, expect, it } from "vitest";
import { publicName, reviewEligibility } from "./review-rules";

describe("publicName", () => {
  it("muestra nombre e inicial del apellido", () => {
    expect(publicName("Ana Carolina pérez")).toBe("Ana P.");
    expect(publicName("  Rosa  ")).toBe("Rosa");
  });
});

const now = new Date("2026-06-15T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const base = { now, alreadyReviewed: false, isOwnProfile: false };

describe("reviewEligibility", () => {
  it("permite reseñar entre 1 y 60 días después del contacto", () => {
    expect(reviewEligibility({ ...base, contactDates: [daysAgo(1)] })).toEqual({ ok: true });
    expect(reviewEligibility({ ...base, contactDates: [daysAgo(30)] })).toEqual({ ok: true });
    expect(reviewEligibility({ ...base, contactDates: [daysAgo(60)] })).toEqual({ ok: true });
  });

  it("sin contacto desde la app no se puede reseñar", () => {
    expect(reviewEligibility({ ...base, contactDates: [] })).toMatchObject({ ok: false, reason: "no-contact" });
  });

  it("antes del primer día avisa desde cuándo", () => {
    const r = reviewEligibility({ ...base, contactDates: [daysAgo(0.25)] });
    expect(r).toMatchObject({ ok: false, reason: "too-soon" });
    expect(r.ok === false && r.availableFrom?.toISOString()).toBe(new Date(daysAgo(0.25).getTime() + 86_400_000).toISOString());
  });

  it("pasados 60 días ya no se puede", () => {
    expect(reviewEligibility({ ...base, contactDates: [daysAgo(61)] })).toMatchObject({ reason: "too-late" });
  });

  it("alcanza con un contacto dentro de la ventana", () => {
    expect(reviewEligibility({ ...base, contactDates: [daysAgo(90), daysAgo(10), daysAgo(0.1)] })).toEqual({ ok: true });
  });

  it("una reseña por cliente y trabajador, y nunca sobre el propio perfil", () => {
    expect(reviewEligibility({ ...base, alreadyReviewed: true, contactDates: [daysAgo(5)] })).toMatchObject({ reason: "already-reviewed" });
    expect(reviewEligibility({ ...base, isOwnProfile: true, contactDates: [daysAgo(5)] })).toMatchObject({ reason: "own-profile" });
  });
});
