export function Stars({ avg, count }: { avg: number; count: number }) {
  if (!count) return <span className="estrellas muted">Sin reseñas todavía</span>;
  const n = avg.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <span className="estrellas">
      <span className="star" aria-hidden="true">★</span> {n}
      <span className="sr-only"> de 5 estrellas,</span> <span className="muted">({count} {count === 1 ? "reseña" : "reseñas"})</span>
    </span>
  );
}
