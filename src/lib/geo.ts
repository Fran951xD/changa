/** Distancia en km entre dos puntos (fórmula del haversine). */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = (x: number) => (x * Math.PI) / 180;
  const a =
    Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/** Redondea a ~1 km para no publicar el domicilio exacto del trabajador. */
export const fuzz = (n: number) => Math.round(n * 100) / 100;

/** Recuadro de la Argentina continental + Tierra del Fuego; fuera de él la búsqueda no tiene trabajadores. */
export const AR_BOUNDS = { minLat: -55.5, maxLat: -21.5, minLng: -74, maxLng: -53.5 };
export function isInServiceArea(lat: number, lng: number) {
  return lat > AR_BOUNDS.minLat && lat < AR_BOUNDS.maxLat && lng > AR_BOUNDS.minLng && lng < AR_BOUNDS.maxLng;
}
