"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="wrap" style={{ maxWidth: 560 }}>
      <div className="page-head"><h1>Algo falló de nuestro lado</h1></div>
      <div className="panel stack" role="alert">
        <p style={{ margin: 0 }}>No pudimos cargar esta página. Puede ser la conexión o un problema nuestro. Probá de nuevo en unos segundos; si sigue pasando, volvé a la portada.</p>
        <div className="row">
          <button className="btn btn-azul" onClick={reset}>Probar de nuevo</button>
          <Link className="btn" href="/">Ir a la portada</Link>
        </div>
      </div>
    </div>
  );
}
