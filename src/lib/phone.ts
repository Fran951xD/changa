/**
 * Normaliza un celular argentino al formato que usa WhatsApp: 549 + área + número (13 dígitos).
 * Acepta como lo escribe la gente: "11 2345-6789", "011 15 2345-6789", "+54 9 11 2345 6789",
 * "0221 15-456-7890". Devuelve null si no se puede interpretar sin adivinar.
 */
export function normalizeArPhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("54")) {
    d = d.slice(2);
    if (d.startsWith("9")) d = d.slice(1);
  } else if (d.startsWith("0")) {
    d = d.slice(1);
  }
  // Con el "15" el número queda en 12 dígitos: lo sacamos probando áreas de 2, 3 y 4 cifras.
  if (d.length === 12) {
    for (const a of [2, 3, 4]) {
      if (d.slice(a, a + 2) === "15") {
        d = d.slice(0, a) + d.slice(a + 2);
        break;
      }
    }
  }
  if (d.length !== 10 || d.startsWith("0") || d.startsWith("15")) return null;
  return "549" + d;
}

/** "5491123456789" → "11 2345-6789". shortcut: áreas de 4 cifras se muestran como de 3; solo es visual. */
export function formatArPhone(normalized: string): string {
  const d = normalized.replace(/^549/, "");
  const area = d.startsWith("11") ? 2 : 3;
  const num = d.slice(area);
  return `${d.slice(0, area)} ${num.slice(0, num.length - 4)}-${num.slice(-4)}`;
}

export function whatsappLink(normalized: string, text: string) {
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}
