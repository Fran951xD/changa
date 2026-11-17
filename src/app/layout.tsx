import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import "./globals.css";

// Archivo: diseñada por Omnibus-Type, fundidora de Buenos Aires. El eje de ancho (wdth)
// da los titulares "expandidos" de tarjeta de imprenta sin cargar una segunda familia.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Changa · Oficios de tu barrio", template: "%s · Changa" },
  description: "Encontrá plomeros, electricistas, gasistas y más oficios cerca tuyo, con reseñas reales. Contactalos por WhatsApp en segundos.",
  openGraph: { siteName: "Changa", locale: "es_AR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#1b2430", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <html lang="es-AR" className={archivo.variable}>
      <body>
        <a href="#contenido" className="skip">Saltar al contenido</a>
        <header className="top">
          <div className="wrap">
            <Link href="/" className="logo" aria-label="Changa, ir a la portada">
              <span className="logo-dot" aria-hidden="true" />changa
            </Link>
            <nav aria-label="Principal">
              <Link href="/buscar">Buscar</Link>
              {user?.isAdmin && <Link href="/admin">Moderación</Link>}
              {user ? <Link href="/panel">Mi panel</Link> : <Link href="/ingresar">Entrar</Link>}
            </nav>
          </div>
        </header>
        <main id="contenido">{children}</main>
        <footer className="foot">
          <div className="wrap">
            <span>Changa conecta vecinos con gente de oficio. Nadie paga por aparecer primero.</span>
            <span className="row">
              <Link href="/trabajadores">Soy trabajador</Link>
              <Link href="/privacidad">Privacidad</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
