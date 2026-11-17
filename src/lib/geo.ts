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

/** El GBA cabe en este recuadro; fuera de él la búsqueda no tiene trabajadores. */
export function isInServiceArea(lat: number, lng: number) {
  return lat > -35.2 && lat < -34.2 && lng > -59.3 && lng < -57.9;
}
