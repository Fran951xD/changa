import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacidad", description: "Qué datos guarda Changa, para qué y cómo borrarlos." };

export default function Privacidad() {
  return (
    <article className="wrap stack" style={{ maxWidth: "68ch", paddingTop: 28 }}>
      <h1>Tus datos en Changa</h1>
      <p>Escrito en criollo, sin letra chica. Última actualización: noviembre de 2026.</p>

      <h2>Si buscás un trabajador</h2>
      <p>No te pedimos cuenta. Guardamos una cookie anónima para saber que tocaste “Contactar” y así, si después entrás con tu email, poder dejar una reseña. Si pedís un presupuesto, tu nombre y celular los ven solo los trabajadores que elegiste.</p>

      <h2>Si publicás tu tarjeta</h2>
      <ul>
        <li><strong>Lo que es público:</strong> tu nombre, foto, oficios, zona aproximada, horarios, medios de pago, matrícula si la cargaste, fotos de trabajos y reseñas.</li>
        <li><strong>Tu celular</strong> no está escrito en la página: se muestra solo cuando alguien toca “Llamar” o “WhatsApp”, con un límite para que no lo copien robots.</li>
        <li><strong>Tu email nunca se muestra.</strong> Lo usamos solo para que entres.</li>
        <li><strong>Tu ubicación exacta tampoco:</strong> si marcás un punto en el mapa, mostramos la zona redondeada a 1 km.</li>
        <li>A las fotos les borramos los datos ocultos (como el GPS del celular) al subirlas.</li>
      </ul>

      <h2>Para qué usamos los datos</h2>
      <p>Para que te encuentren, para mostrarte cuántas visitas y contactos tuviste, y para frenar spam y abusos. No vendemos datos ni mostramos publicidad. Nadie paga para aparecer primero.</p>

      <h2>Cómo borrar todo</h2>
      <p>Desde <Link href="/panel/cuenta">Mi panel → Cuenta</Link> podés borrar tu cuenta. Se eliminan en el momento tu perfil, fotos, estadísticas, reseñas y pedidos. No guardamos copias.</p>

      <h2>Tus derechos</h2>
      <p>Según la Ley 25.326 de Protección de Datos Personales podés pedir acceso, corrección o eliminación de tus datos. Escribinos a <a href="mailto:privacidad@changa.app">privacidad@changa.app</a>. La Agencia de Acceso a la Información Pública es el órgano de control.</p>
    </article>
  );
}
