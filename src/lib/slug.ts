import { normalizeText } from "@/data/areas";

export function slugify(s: string) {
  return normalizeText(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

/** "Juan Pérez" + "plomero" → "juan-perez-plomero"; "Juan el plomero" + "plomero" → "juan-el-plomero" (sin repetir). */
export function profileSlugBase(name: string, person: string) {
  const n = slugify(name);
  const p = slugify(person);
  return `-${n}-`.includes(`-${p}-`) ? n : slugify(`${name} ${person}`); // palabra completa: "pintoresco" no cuenta como "pintor"
}
