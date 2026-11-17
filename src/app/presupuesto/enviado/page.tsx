import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pedido enviado", robots: { index: false } };

export default async function Enviado({ searchParams }: PageProps<"/presupuesto/enviado">) {
  const n = Number((await searchParams).n) || 1;
  return (
    <div className="wrap" style={{ maxWidth: 560 }}>
      <div className="page-head"><h1>¡Pedido enviado!</h1></div>
      <div className="panel stack" role="status">
        <p>Se lo mandamos a {n === 1 ? "1 trabajador" : `${n} trabajadores`}. Te van a escribir por WhatsApp al número que dejaste, normalmente en el día.</p>
        <p>Cuando terminen el trabajo, volvé a su perfil para dejar una reseña: ayuda a otros vecinos.</p>
        <Link className="btn" href="/">Volver a la portada</Link>
      </div>
    </div>
  );
}
