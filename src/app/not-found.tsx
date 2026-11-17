import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap" style={{ maxWidth: 560 }}>
      <div className="page-head"><h1>No encontramos esta página</h1></div>
      <div className="panel stack">
        <p style={{ margin: 0 }}>Puede que el link esté mal escrito, o que el trabajador haya cambiado su link o pausado su perfil.</p>
        <div className="row">
          <Link className="btn btn-azul" href="/buscar">Buscar un trabajador</Link>
          <Link className="btn" href="/">Ir a la portada</Link>
        </div>
      </div>
    </div>
  );
}
