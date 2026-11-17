// Barrios de CABA y localidades del Gran Buenos Aires con su centro aproximado.
// shortcut: lista fija sin geocodificador externo; sumar provincias = sumar filas acá (o pasar a una API de geocoding).
export type Area = { slug: string; name: string; region: string; lat: number; lng: number };

const caba: [string, string, number, number][] = [
  ["agronomia", "Agronomía", -34.5925, -58.4925],
  ["almagro", "Almagro", -34.6093, -58.4209],
  ["balvanera", "Balvanera", -34.6091, -58.4029],
  ["barracas", "Barracas", -34.6455, -58.3828],
  ["belgrano", "Belgrano", -34.5627, -58.4566],
  ["boedo", "Boedo", -34.6302, -58.4180],
  ["caballito", "Caballito", -34.6189, -58.4423],
  ["chacarita", "Chacarita", -34.5875, -58.4531],
  ["coghlan", "Coghlan", -34.5603, -58.4746],
  ["colegiales", "Colegiales", -34.5744, -58.4485],
  ["constitucion", "Constitución", -34.6274, -58.3846],
  ["flores", "Flores", -34.6283, -58.4637],
  ["floresta", "Floresta", -34.6292, -58.4845],
  ["la-boca", "La Boca", -34.6345, -58.3631],
  ["la-paternal", "La Paternal", -34.5973, -58.4687],
  ["liniers", "Liniers", -34.6418, -58.5236],
  ["mataderos", "Mataderos", -34.6584, -58.5049],
  ["monte-castro", "Monte Castro", -34.6185, -58.5059],
  ["monserrat", "Monserrat", -34.6120, -58.3815],
  ["nueva-pompeya", "Nueva Pompeya", -34.6505, -58.4179],
  ["nunez", "Núñez", -34.5446, -58.4635],
  ["palermo", "Palermo", -34.5781, -58.4265],
  ["parque-avellaneda", "Parque Avellaneda", -34.6476, -58.4799],
  ["parque-chacabuco", "Parque Chacabuco", -34.6366, -58.4398],
  ["parque-chas", "Parque Chas", -34.5856, -58.4790],
  ["parque-patricios", "Parque Patricios", -34.6375, -58.4005],
  ["puerto-madero", "Puerto Madero", -34.6118, -58.3632],
  ["recoleta", "Recoleta", -34.5875, -58.3974],
  ["retiro", "Retiro", -34.5925, -58.3746],
  ["saavedra", "Saavedra", -34.5536, -58.4867],
  ["san-cristobal", "San Cristóbal", -34.6238, -58.4021],
  ["san-nicolas", "San Nicolás", -34.6033, -58.3817],
  ["san-telmo", "San Telmo", -34.6214, -58.3731],
  ["velez-sarsfield", "Vélez Sarsfield", -34.6316, -58.4930],
  ["versalles", "Versalles", -34.6311, -58.5212],
  ["villa-crespo", "Villa Crespo", -34.5990, -58.4380],
  ["villa-del-parque", "Villa del Parque", -34.6044, -58.4906],
  ["villa-devoto", "Villa Devoto", -34.6012, -58.5136],
  ["villa-general-mitre", "Villa General Mitre", -34.6104, -58.4693],
  ["villa-lugano", "Villa Lugano", -34.6766, -58.4728],
  ["villa-luro", "Villa Luro", -34.6378, -58.5027],
  ["villa-ortuzar", "Villa Ortúzar", -34.5800, -58.4677],
  ["villa-pueyrredon", "Villa Pueyrredón", -34.5801, -58.5052],
  ["villa-real", "Villa Real", -34.6197, -58.5257],
  ["villa-riachuelo", "Villa Riachuelo", -34.6911, -58.4697],
  ["villa-santa-rita", "Villa Santa Rita", -34.6153, -58.4815],
  ["villa-soldati", "Villa Soldati", -34.6641, -58.4428],
  ["villa-urquiza", "Villa Urquiza", -34.5731, -58.4876],
];

const gba: [string, string, string, number, number][] = [
  ["vicente-lopez", "Vicente López", "Zona Norte", -34.5266, -58.4794],
  ["olivos", "Olivos", "Zona Norte", -34.5079, -58.4935],
  ["florida", "Florida", "Zona Norte", -34.5300, -58.4930],
  ["munro", "Munro", "Zona Norte", -34.5269, -58.5216],
  ["martinez", "Martínez", "Zona Norte", -34.4927, -58.5065],
  ["san-isidro", "San Isidro", "Zona Norte", -34.4721, -58.5276],
  ["beccar", "Beccar", "Zona Norte", -34.4613, -58.5373],
  ["boulogne", "Boulogne", "Zona Norte", -34.4983, -58.5626],
  ["san-fernando", "San Fernando", "Zona Norte", -34.4425, -58.5590],
  ["tigre", "Tigre", "Zona Norte", -34.4260, -58.5797],
  ["san-martin", "San Martín", "Zona Norte", -34.5747, -58.5375],
  ["villa-ballester", "Villa Ballester", "Zona Norte", -34.5491, -58.5539],
  ["pilar", "Pilar", "Zona Norte", -34.4587, -58.9142],
  ["moron", "Morón", "Zona Oeste", -34.6534, -58.6198],
  ["haedo", "Haedo", "Zona Oeste", -34.6440, -58.5935],
  ["ramos-mejia", "Ramos Mejía", "Zona Oeste", -34.6417, -58.5650],
  ["san-justo", "San Justo", "Zona Oeste", -34.6826, -58.5612],
  ["castelar", "Castelar", "Zona Oeste", -34.6527, -58.6449],
  ["ituzaingo", "Ituzaingó", "Zona Oeste", -34.6587, -58.6670],
  ["caseros", "Caseros", "Zona Oeste", -34.6050, -58.5621],
  ["merlo", "Merlo", "Zona Oeste", -34.6653, -58.7277],
  ["moreno", "Moreno", "Zona Oeste", -34.6340, -58.7914],
  ["avellaneda", "Avellaneda", "Zona Sur", -34.6625, -58.3653],
  ["lanus", "Lanús", "Zona Sur", -34.7006, -58.3920],
  ["banfield", "Banfield", "Zona Sur", -34.7442, -58.3964],
  ["lomas-de-zamora", "Lomas de Zamora", "Zona Sur", -34.7612, -58.4060],
  ["temperley", "Temperley", "Zona Sur", -34.7743, -58.3954],
  ["adrogue", "Adrogué", "Zona Sur", -34.7997, -58.3910],
  ["quilmes", "Quilmes", "Zona Sur", -34.7206, -58.2546],
  ["bernal", "Bernal", "Zona Sur", -34.7066, -58.2795],
  ["berazategui", "Berazategui", "Zona Sur", -34.7631, -58.2117],
  ["wilde", "Wilde", "Zona Sur", -34.7041, -58.3200],
  ["monte-grande", "Monte Grande", "Zona Sur", -34.8159, -58.4693],
  ["ezeiza", "Ezeiza", "Zona Sur", -34.8541, -58.5235],
];

export const AREAS: Area[] = [
  ...caba.map(([slug, name, lat, lng]) => ({ slug, name, region: "CABA", lat, lng })),
  ...gba.map(([slug, name, region, lat, lng]) => ({ slug, name, region, lat, lng })),
];

export const AREA_BY_SLUG = new Map(AREAS.map((a) => [a.slug, a]));

/** El barrio más cercano a un punto (para decir "hasta 10 km de Flores" sin mostrar la dirección). */
export function nearestArea(lat: number, lng: number) {
  let best = AREAS[0], bestD = Infinity;
  for (const a of AREAS) {
    const d = (a.lat - lat) ** 2 + ((a.lng - lng) * 0.82) ** 2; // 0,82 ≈ cos(34,6°): alcanza para comparar
    if (d < bestD) { best = a; bestD = d; }
  }
  return best;
}

/** Para el autocompletado: ignora tildes y mayúsculas. */
export function normalizeText(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
