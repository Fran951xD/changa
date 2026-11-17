/* Semilla de datos de ejemplo: 60 trabajadores ficticios en CABA y GBA y 37 en el resto de las provincias, con reseñas,
   contactos y visitas de las últimas 8 semanas. Es determinística (mismo resultado cada vez).
   Uso: npm run db:seed */
import sharp from "sharp";
import { sql } from "drizzle-orm";
import { createDb } from "./index";
import { runMigrations } from "./migrate";
import * as s from "./schema";
import { AREAS as ALL_AREAS, normalizeText } from "../data/areas";

// La semilla vive en CABA y el GBA (como pide el proyecto); el resto del país arranca vacío.
const AREAS = ALL_AREAS.filter((a) => a.region === "CABA" || a.region.startsWith("GBA "));
import { TRADES, TRADE_BY_SLUG, PAYMENT_METHODS } from "../data/trades";
import { distanceKm } from "../lib/geo";

let seed = 20261116;
function rand() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(a: readonly T[]) => a[Math.floor(rand() * a.length)];
const chance = (p: number) => rand() < p;
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const DAY = 86_400_000;

const FIRST_M = ["Juan", "Carlos", "Jorge", "Luis", "Miguel", "Diego", "Martín", "Sergio", "Pablo", "Gustavo", "Walter", "Rubén", "Claudio", "Hernán", "Matías", "Leandro", "Ezequiel", "Damián", "Raúl", "Néstor", "Fabián", "Cristian", "Ramón", "Ariel", "Lucas", "Gonzalo"];
const FIRST_F = ["María", "Laura", "Silvia", "Graciela", "Patricia", "Lorena", "Carolina", "Valeria", "Romina", "Sandra", "Natalia", "Gabriela", "Mónica", "Paola"];
const LAST = ["González", "Rodríguez", "Gómez", "Fernández", "López", "Díaz", "Martínez", "Pérez", "García", "Sánchez", "Romero", "Sosa", "Álvarez", "Torres", "Ruiz", "Ramírez", "Flores", "Benítez", "Acosta", "Medina", "Herrera", "Suárez", "Aguirre", "Giménez", "Gutiérrez", "Pereyra", "Rojas", "Molina", "Castro", "Ortiz", "Silva", "Núñez", "Luna", "Cabrera", "Ríos", "Ferreyra", "Godoy", "Morales", "Domínguez", "Quiroga", "Vera", "Ledesma", "Iglesias", "Paz", "Bustos", "Villalba", "Ojeda", "Ponce"];

const DESCRIPTIONS: Record<string, string[]> = {
  plomeria: ["Destapaciones, pérdidas, cambio de cañerías y colocación de termotanques. Presupuesto sin cargo en la zona.", "Plomería general: baños, cocinas, canillas, mochilas y bombas de agua. Trabajo con garantía."],
  electricidad: ["Instalaciones eléctricas completas, tableros, disyuntores y cortocircuitos. Certificado DCI.", "Arreglo cortes de luz, cableado nuevo, tomas, ventiladores de techo y luminarias LED."],
  gas: ["Gasista matriculado. Instalaciones, pérdidas, pruebas de hermeticidad y trámites con Metrogas/Naturgy.", "Conexión de cocinas, calefones y estufas. Rehabilitación de servicio y planos."],
  pintura: ["Pintura interior y exterior, empapelado y tratamiento de humedad. Dejo todo limpio.", "Pinto departamentos, frentes y rejas. Látex, esmalte y membrana. Precio por ambiente."],
  albanileria: ["Albañilería en general: revoques, contrapisos, cerámicos y pequeñas reformas.", "Reformas de baños y cocinas llave en mano. Colocación de porcelanato."],
  carpinteria: ["Muebles a medida, placares y cocinas en melamina. También reparo puertas y ventanas.", "Carpintería en madera maciza: decks, pérgolas y restauración de muebles."],
  cerrajeria: ["Cerrajería 24 horas: aperturas sin daño, cambio de combinación y cerraduras de seguridad.", "Cerraduras multipunto, blindex, cajas fuertes y llaves codificadas para auto."],
  aires: ["Instalación y service de aires split. Carga de gas, limpieza y reparación de plaquetas.", "Técnico en climatización: instalo, desinstalo y reubico equipos. Trabajo en altura con seguridad."],
  refrigeracion: ["Reparo heladeras familiares y comerciales, freezers y exhibidoras. Carga de gas.", "Service de heladeras no frost: plaquetas, motores y burletes. Voy a domicilio."],
  jardineria: ["Corte de pasto, poda, diseño de canteros y mantenimiento mensual de jardines.", "Parquización, riego automático y control de plagas en plantas."],
  limpieza: ["Limpieza de hogares y oficinas, fin de obra y mudanzas. Llevo mis productos.", "Limpieza profunda por horas. Referencias comprobables."],
  mudanzas: ["Fletes y mudanzas chicas y medianas. Camioneta cerrada, con ayudante.", "Mudanzas completas con embalaje. CABA y GBA."],
  pc: ["Reparo PCs y notebooks a domicilio: formateo, virus, lentitud y armado de redes wifi.", "Soporte técnico para hogares y comercios. Recupero datos y cambio pantallas de notebook."],
  durlock: ["Tabiques, cielorrasos y muebles en durlock. Terminación lista para pintar.", "Placas de yeso, aislación térmica y acústica."],
  herreria: ["Rejas, portones, escaleras y estructuras metálicas. Soldadura a domicilio.", "Herrería de obra y artística. Reparación de portones corredizos."],
  techista: ["Membranas, reparación de goteras, canaletas y techos de chapa.", "Impermeabilización de terrazas con membrana líquida y en rollo. Garantía escrita."],
  electrodomesticos: ["Reparo lavarropas, secarropas, microondas y hornos eléctricos. Repuestos originales.", "Service de lavarropas automáticos de todas las marcas."],
  vidrieria: ["Vidrios a medida, espejos, DVH y mamparas de baño.", "Colocación de vidrios templados y reparación de ventanas de aluminio."],
  fumigacion: ["Control de cucarachas, hormigas, roedores y chinches. Certificado municipal.", "Fumigación de hogares y comercios con productos aprobados."],
  tapiceria: ["Retapizado de sillones, sillas y cabeceras. Telas a elección.", "Tapicería en general y limpieza de tapizados."],
};

const REVIEW_TEXTS = {
  great: ["Vino el mismo día, resolvió rápido y dejó todo limpio. Muy recomendable.", "Excelente trabajo, muy prolijo y cumplió con lo presupuestado.", "Súper atento, me explicó todo lo que hizo. Lo vuelvo a llamar seguro.", "Puntual y honesto. Me cobró lo justo y quedó perfecto.", "Lo llamé por una urgencia un domingo y vino en una hora. Un genio.", "Trabajo impecable. Se nota la experiencia.", "Muy buena atención desde el primer mensaje. Recomendable 100%."],
  ok: ["Buen trabajo, aunque llegó un poco más tarde de lo acordado.", "Cumplió, el precio fue algo alto pero el resultado es bueno.", "Resolvió el problema, tuvo que volver una segunda vez pero sin cargo extra."],
  bad: ["Tardó varios días en venir y el trabajo quedó a medias.", "No respetó el presupuesto inicial."],
};
const REPLIES = ["¡Gracias por la confianza! Cualquier cosa me escribís.", "Muchas gracias, un gusto haber trabajado en tu casa.", "Gracias por el comentario, tomo nota para mejorar."];

// ---------- Imágenes generadas (ficticias, sin fotos de personas reales) ----------
function avatarSvg(color: string, skin: string, hair: string, initials: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${color}"/>
  <circle cx="200" cy="170" r="78" fill="${skin}"/>
  <path d="M122 160 Q130 80 200 82 Q270 80 278 160 Q262 118 200 116 Q138 118 122 160Z" fill="${hair}"/>
  <path d="M60 400 Q70 280 200 268 Q330 280 340 400Z" fill="#ffffff" opacity=".92"/>
  <text x="200" y="372" font-family="Arial, sans-serif" font-weight="700" font-size="44" text-anchor="middle" fill="${color}">${initials}</text>
</svg>`;
}

function workSvg(color: string, variant: number) {
  const shapes: string[] = [];
  if (variant % 3 === 0) {
    for (let y = 0; y < 800; y += 50) for (let x = (y / 50) % 2 ? -50 : 0; x < 800; x += 100)
      shapes.push(`<rect x="${x + 3}" y="${y + 3}" width="94" height="44" rx="3" fill="${color}" opacity="${0.55 + rand() * 0.45}"/>`);
  } else if (variant % 3 === 1) {
    for (let y = 0; y < 800; y += 100) for (let x = 0; x < 800; x += 100)
      shapes.push(`<rect x="${x + 4}" y="${y + 4}" width="92" height="92" fill="${(x + y) % 200 ? color : "#f4f4f0"}" opacity="${0.7 + rand() * 0.3}"/>`);
  } else {
    for (let i = 0; i < 9; i++) shapes.push(`<rect x="0" y="${i * 90}" width="800" height="${40 + rand() * 40}" fill="${color}" opacity="${0.35 + rand() * 0.6}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="#e9ebe6"/>${shapes.join("")}</svg>`;
}

async function svgToImage(svg: string) {
  const buf = Buffer.from(svg);
  const { data, info } = await sharp(buf).webp({ quality: 70 }).toBuffer({ resolveWithObject: true });
  const thumb = await sharp(buf).resize(400, 400, { fit: "cover" }).webp({ quality: 65 }).toBuffer();
  return { data, thumb, width: info.width, height: info.height };
}

async function main() {
  const db = createDb();
  await runMigrations(db);
  console.log("Borrando datos anteriores…");
  await db.execute(sql`truncate table users, images, rate_limits, login_tokens, reports, quote_requests cascade`);

  const now = Date.now();
  const [admin] = await db.insert(s.users).values({ email: "admin@changa.test", name: "Moderación Changa", isAdmin: true }).returning();
  void admin;
  const clients = await db.insert(s.users).values(
    Array.from({ length: 40 }, (_, i) => ({ email: `cliente${i + 1}@changa.test`, name: `${pick([...FIRST_M, ...FIRST_F])} ${pick(LAST)[0]}.` })),
  ).returning();
  const [demoClient] = await db.insert(s.users).values({ email: "cliente@changa.test", name: "Ana C." }).returning();

  // Repartimos oficios para que todos tengan gente y los comunes tengan más.
  const weighted = ["plomeria", "plomeria", "plomeria", "electricidad", "electricidad", "electricidad", "gas", "gas", "pintura", "pintura", "albanileria", "aires", "aires", "cerrajeria", "carpinteria", "refrigeracion", "jardineria", "limpieza", "mudanzas", "pc", ...TRADES.slice(13).map((t) => t.slug)];
  const skins = ["#f1c7a5", "#e0ac83", "#c68c62", "#a86f48", "#7d5135"];
  const hairs = ["#2b1d14", "#4a3020", "#191919", "#6b4a2b", "#8a8a8a"];

  // Después de los 60 de CABA y GBA, algunos en cada provincia (más en las ciudades grandes),
  // para que la demo muestre resultados en todo el país. Van al final: los 60 primeros salen idénticos.
  const EXTRA: [string, number][] = [
    ["cordoba", 4], ["santa-fe", 4], ["mendoza", 3], ["buenos-aires", 3], ["tucuman", 2], ["salta", 2], ["neuquen", 2], ["entre-rios", 2],
    ["catamarca", 1], ["chaco", 1], ["chubut", 1], ["corrientes", 1], ["formosa", 1], ["jujuy", 1], ["la-pampa", 1], ["la-rioja", 1],
    ["misiones", 1], ["rio-negro", 1], ["san-juan", 1], ["san-luis", 1], ["santa-cruz", 1], ["santiago-del-estero", 1], ["tierra-del-fuego", 1],
  ];
  // En Buenos Aires, el interior (La Plata, Mar del Plata, Bahía Blanca…): el GBA ya está cubierto.
  const poolOf = (p: string) => ALL_AREAS.filter((a) => a.province === p && !a.region.startsWith("GBA "));
  const extraPools = EXTRA.flatMap(([p, n]) => Array.from({ length: n }, () => poolOf(p)));
  const TOTAL = 60 + extraPools.length;

  console.log(`Creando ${TOTAL} trabajadores…`);
  for (let i = 0; i < TOTAL; i++) {
    const female = (i === 0 ? false : chance(0.25));
    const first = i === 0 ? "Juan" : pick(female ? FIRST_F : FIRST_M);
    const last = i === 0 ? "Pérez" : pick(LAST);
    // En provincia, los oficios que más se buscan, rotando: así cada provincia tiene variedad útil.
    const COMMON = ["plomeria", "electricidad", "gas", "aires", "pintura", "cerrajeria"];
    const mainTrade = i === 0 ? "plomeria" : i < 60 ? weighted[i % weighted.length] : COMMON[(i - 60) % COMMON.length];
    const trades = [mainTrade];
    if (mainTrade === "plomeria" && chance(0.5)) trades.push("gas");
    if (mainTrade === "electricidad" && chance(0.3)) trades.push("aires");
    if (mainTrade === "albanileria" && chance(0.5)) trades.push("pintura");
    const trade = TRADE_BY_SLUG.get(mainTrade)!;

    const pool = i < 60 ? AREAS : extraPools[i - 60];
    // En provincia, sesgo a la primera ciudad de la lista (la capital); las ciudades están más lejos entre sí: 25 km.
    const home = i === 0 ? AREAS.find((a) => a.slug === "palermo")! : pool[Math.floor(rand() ** (i < 60 ? 1.3 : 2.5) * pool.length)];
    const radiusMode = i !== 0 && chance(i < 60 ? 0.2 : 0.35);
    const near = pool.filter((a) => a.slug !== home.slug && distanceKm(home.lat, home.lng, a.lat, a.lng) < (i < 60 ? 6.5 : 25))
      .sort(() => rand() - 0.5).slice(0, int(2, 8));
    const areas = [home, ...near];

    const user = (await db.insert(s.users).values({ email: i === 0 ? "juan@changa.test" : `trabajador${i}@changa.test`, name: `${first} ${last}` }).returning())[0];
    const avatar = await svgToImage(avatarSvg(trade.color, pick(skins), pick(hairs), `${first[0]}${last[0]}`));
    const [photo] = await db.insert(s.images).values({ ...avatar, ownerId: user.id }).returning({ id: s.images.id });

    const slugBase = normalizeText(`${first} ${last} ${trade.person}`).replace(/[^a-z0-9]+/g, "-");
    const slug = i === 0 ? "juan-plomero" : `${slugBase}-${i}`;
    const [w] = await db.insert(s.workers).values({
      userId: user.id,
      slug,
      displayName: `${first} ${last}`,
      photoId: photo.id,
      description: pick(DESCRIPTIONS[mainTrade]).replace("CABA y GBA", i < 60 ? "CABA y GBA" : "Toda la provincia"),
      yearsExperience: int(2, 30),
      phone: `549110000${String(1000 + i).padStart(4, "0")}`, // rango 11 0000-xxxx: no asignado a celulares reales
      phoneVerifiedAt: new Date(now - int(10, 300) * DAY),
      licenseNumber: trade.licensable && chance(0.6) ? `MAT-${int(10000, 99999)}` : null,
      urgencies: chance(0.35),
      availableUntil: chance(0.3) || i === 0 ? new Date(now + int(1, 7) * 3600_000) : null,
      paymentMethods: PAYMENT_METHODS.filter(() => chance(0.55)).map((p) => p.slug).concat("efectivo").filter((v, k, a) => a.indexOf(v) === k),
      schedule: { days: chance(0.5) ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4], from: pick(["07:00", "08:00", "09:00"]), to: pick(["17:00", "18:00", "19:00", "20:00"]) },
      zoneMode: radiusMode ? "radius" : "areas",
      baseLat: home.lat + (radiusMode ? (rand() - 0.5) * 0.01 : 0),
      baseLng: home.lng + (radiusMode ? (rand() - 0.5) * 0.01 : 0),
      radiusKm: radiusMode ? pick(i < 60 ? [5, 8, 10, 15] : [10, 15, 20, 30]) : null,
      status: "published",
      createdAt: new Date(now - int(30, 400) * DAY),
    }).returning();

    await db.insert(s.workerTrades).values(trades.map((t) => ({ workerId: w.id, trade: t })));
    if (!radiusMode) await db.insert(s.workerAreas).values(areas.map((a) => ({ workerId: w.id, area: a.slug, lat: a.lat, lng: a.lng })));

    const nPhotos = int(0, 6) + (i === 0 ? 3 : 0);
    for (let p = 0; p < Math.min(nPhotos, 8); p++) {
      const img = await svgToImage(workSvg(trade.color, p + i));
      const [row] = await db.insert(s.images).values({ ...img, ownerId: user.id }).returning({ id: s.images.id });
      await db.insert(s.workerPhotos).values({ workerId: w.id, imageId: row.id, position: p });
    }

    // Visitas y contactos de las últimas 8 semanas (para el panel).
    const popularity = 0.4 + rand() * 1.6;
    const views = Array.from({ length: 56 }, (_, d) => ({ workerId: w.id, day: new Date(now - d * DAY).toISOString().slice(0, 10), count: Math.round(int(0, 9) * popularity) })).filter((v) => v.count > 0);
    if (views.length) await db.insert(s.profileViews).values(views);
    const contactRows = Array.from({ length: Math.round(int(3, 25) * popularity) }, () => ({
      workerId: w.id, visitorId: `seed-${int(1, 1e9)}`, channel: pick(["whatsapp", "whatsapp", "whatsapp", "call"] as const), createdAt: new Date(now - rand() * 56 * DAY),
    }));
    if (contactRows.length) await db.insert(s.contacts).values(contactRows);

    // Reseñas: cada una con su contacto previo, como exige la regla.
    const nReviews = i === 0 ? 9 : Math.floor(rand() ** 1.4 * 13);
    const authors = [...clients].sort(() => rand() - 0.5).slice(0, nReviews);
    let sum = 0;
    for (const author of authors) {
      const roll = rand();
      const rating = roll < 0.62 ? 5 : roll < 0.87 ? 4 : roll < 0.95 ? 3 : pick([1, 2]);
      const text = pick(rating >= 4 ? REVIEW_TEXTS.great : rating === 3 ? REVIEW_TEXTS.ok : REVIEW_TEXTS.bad);
      const contactAt = now - int(3, 200) * DAY;
      await db.insert(s.contacts).values({ workerId: w.id, visitorId: `seed-${author.id}`, userId: author.id, channel: "whatsapp", createdAt: new Date(contactAt) });
      const replied = chance(0.35);
      await db.insert(s.reviews).values({
        workerId: w.id, authorId: author.id, authorName: author.name!, rating, text,
        punctual: rating >= 4 ? chance(0.7) : chance(0.1), tidy: rating >= 4 ? chance(0.6) : null, fairPrice: rating >= 4 ? chance(0.6) : chance(0.1),
        reply: replied ? pick(REPLIES) : null, repliedAt: replied ? new Date(contactAt + 4 * DAY) : null,
        createdAt: new Date(contactAt + int(1, 10) * DAY),
      });
      sum += rating;
    }
    if (nReviews) await db.update(s.workers).set({ ratingAvg: sum / nReviews, ratingCount: nReviews }).where(sql`${s.workers.id} = ${w.id}`);

    // La clienta demo contactó a Juan hace 3 días: puede probar el flujo de reseña.
    if (i === 0) {
      await db.insert(s.contacts).values({ workerId: w.id, visitorId: "seed-demo", userId: demoClient.id, channel: "whatsapp", createdAt: new Date(now - 3 * DAY) });
    }
    if (i % 10 === 9 || i === TOTAL - 1) console.log(`  ${i + 1}/${TOTAL}`);
  }
  console.log("Listo. Cuentas de prueba: juan@changa.test (trabajador), cliente@changa.test (cliente), admin@changa.test (moderación).");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
