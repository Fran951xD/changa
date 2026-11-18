import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Publicá tu oficio gratis",
  description: "Si sos plomero, electricista, gasista, pintor o trabajás de cualquier oficio, armá tu tarjeta en Changa y recibí contactos por WhatsApp de vecinos de tu zona.",
};

export default function Trabajadores() {
  return (
    <div className="wrap" style={{ maxWidth: 680 }}>
      <div className="page-head">
        <h1>Que te encuentren en tu barrio</h1>
        <p>Changa es gratis para vos. No cobramos comisión y nadie paga para aparecer primero: te ordenamos por cercanía, reseñas y si estás disponible.</p>
      </div>
      <div className="panel stack">
        <h2>Qué necesitás para empezar</h2>
        <ol style={{ paddingLeft: 22 }} className="stack">
          <li>Una cuenta de Google para entrar.</li>
          <li>Tu oficio y los barrios donde trabajás.</li>
          <li>Tu celular con WhatsApp, que confirmás en un paso.</li>
        </ol>
        <p className="muted">La foto, la descripción y las fotos de trabajos son opcionales, pero ayudan mucho.</p>
        <Link href="/ingresar?next=/panel" className="btn btn-azul">Empezar</Link>
      </div>
    </div>
  );
}
