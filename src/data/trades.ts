// Lista fija de oficios. `slug` va a la base; `plural` arma las URLs de SEO (/plomeros/palermo).
export type Trade = {
  slug: string;
  name: string; // como lo busca la gente: "Plomería"
  person: string; // "plomero"
  plural: string; // "plomeros"
  licensable?: boolean; // oficios donde la matrícula importa
  color: string; // color del "imán" en la tarjeta
};

// Colores con contraste ≥ 4,5:1 contra texto blanco (salvo electricidad, que lleva texto oscuro).
export const TRADES: Trade[] = [
  { slug: "plomeria", name: "Plomería", person: "plomero", plural: "plomeros", licensable: true, color: "#1F4BD8" },
  { slug: "electricidad", name: "Electricidad", person: "electricista", plural: "electricistas", licensable: true, color: "#E0A100" },
  { slug: "gas", name: "Gas matriculado", person: "gasista", plural: "gasistas", licensable: true, color: "#C8261B" },
  { slug: "pintura", name: "Pintura", person: "pintor", plural: "pintores", color: "#237357" },
  { slug: "albanileria", name: "Albañilería", person: "albañil", plural: "albaniles", color: "#9A5B2E" },
  { slug: "carpinteria", name: "Carpintería", person: "carpintero", plural: "carpinteros", color: "#7A4E1D" },
  { slug: "cerrajeria", name: "Cerrajería", person: "cerrajero", plural: "cerrajeros", color: "#4A4F5C" },
  { slug: "aires", name: "Aires acondicionados", person: "técnico de aires", plural: "tecnicos-de-aire", licensable: true, color: "#146F8E" },
  { slug: "refrigeracion", name: "Refrigeración", person: "técnico en refrigeración", plural: "refrigeracion", color: "#3769A8" },
  { slug: "jardineria", name: "Jardinería", person: "jardinero", plural: "jardineros", color: "#3F7322" },
  { slug: "limpieza", name: "Limpieza", person: "persona de limpieza", plural: "limpieza", color: "#8A4FB0" },
  { slug: "mudanzas", name: "Mudanzas y fletes", person: "fletero", plural: "mudanzas", color: "#B4582A" },
  { slug: "pc", name: "Técnico de PC", person: "técnico de PC", plural: "tecnicos-de-pc", color: "#2E3A59" },
  { slug: "durlock", name: "Durlock", person: "durlero", plural: "durleros", color: "#6B7280" },
  { slug: "herreria", name: "Herrería", person: "herrero", plural: "herreros", color: "#3F3F46" },
  { slug: "techista", name: "Techos y membranas", person: "techista", plural: "techistas", color: "#A1452B" },
  { slug: "electrodomesticos", name: "Reparación de electrodomésticos", person: "técnico de electrodomésticos", plural: "tecnicos-de-electrodomesticos", color: "#0F766E" },
  { slug: "vidrieria", name: "Vidriería", person: "vidriero", plural: "vidrieros", color: "#36698A" },
  { slug: "fumigacion", name: "Fumigación", person: "fumigador", plural: "fumigadores", color: "#5B6B1F" },
  { slug: "tapiceria", name: "Tapicería", person: "tapicero", plural: "tapiceros", color: "#9D3B5C" },
];

export const TRADE_BY_SLUG = new Map(TRADES.map((t) => [t.slug, t]));
export const TRADE_BY_PLURAL = new Map(TRADES.map((t) => [t.plural, t]));

export const PAYMENT_METHODS = [
  { slug: "efectivo", name: "Efectivo" },
  { slug: "transferencia", name: "Transferencia" },
  { slug: "mercadopago", name: "Mercado Pago" },
  { slug: "debito", name: "Débito" },
  { slug: "credito", name: "Crédito" },
] as const;
export const PAYMENT_SLUGS = PAYMENT_METHODS.map((p) => p.slug) as [string, ...string[]];

export const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
