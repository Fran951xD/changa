export const REVIEW_MIN_DAYS = 1;
export const REVIEW_MAX_DAYS = 60;
const DAY = 86_400_000;

/** "Ana Carolina Pérez" → "Ana P.": en público va el nombre con la inicial del apellido. */
export function publicName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0] ?? "";
}

export type ReviewEligibility =
  | { ok: true }
  | { ok: false; reason: "own-profile" | "already-reviewed" | "no-contact" | "too-soon" | "too-late"; availableFrom?: Date };

/**
 * Solo reseña quien contactó al trabajador desde Changa, entre 1 y 60 días después
 * del contacto, una vez por trabajador. Recibe las fechas de sus contactos con ese trabajador.
 */
export function reviewEligibility(input: {
  contactDates: Date[];
  now: Date;
  alreadyReviewed: boolean;
  isOwnProfile: boolean;
}): ReviewEligibility {
  if (input.isOwnProfile) return { ok: false, reason: "own-profile" };
  if (input.alreadyReviewed) return { ok: false, reason: "already-reviewed" };
  if (input.contactDates.length === 0) return { ok: false, reason: "no-contact" };
  const now = input.now.getTime();
  const ages = input.contactDates.map((d) => (now - d.getTime()) / DAY);
  if (ages.some((a) => a >= REVIEW_MIN_DAYS && a <= REVIEW_MAX_DAYS)) return { ok: true };
  if (ages.every((a) => a > REVIEW_MAX_DAYS)) return { ok: false, reason: "too-late" };
  const newest = Math.max(...input.contactDates.map((d) => d.getTime()));
  return { ok: false, reason: "too-soon", availableFrom: new Date(newest + REVIEW_MIN_DAYS * DAY) };
}
