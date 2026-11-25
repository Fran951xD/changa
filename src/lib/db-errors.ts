const UNIQUE_VIOLATION = "23505";
const pgCode = (e: unknown) => (e as { code?: unknown } | null | undefined)?.code;

/** ¿El error es una violación de índice único de Postgres? Drizzle envuelve el del driver en `cause`. */
export function isUniqueViolation(e: unknown) {
  return pgCode(e) === UNIQUE_VIOLATION || pgCode((e as { cause?: unknown } | null | undefined)?.cause) === UNIQUE_VIOLATION;
}
