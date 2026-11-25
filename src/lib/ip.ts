/**
 * IP del cliente para los límites de uso. Toma el ÚLTIMO valor de X-Forwarded-For: lo agrega
 * el proxy más cercano (Vercel reescribe el header entero). Los anteriores los puede inventar
 * el cliente para esquivar el límite.
 */
export function ipFromHeaders(h: Headers) {
  return h.get("x-forwarded-for")?.split(",").at(-1)?.trim() || h.get("x-real-ip")?.trim() || "local";
}
