"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/panel", "Inicio"],
  ["/panel/perfil", "Mi tarjeta"],
  ["/panel/pedidos", "Pedidos"],
  ["/panel/resenas", "Reseñas"],
  ["/panel/compartir", "Compartir"],
  ["/panel/cuenta", "Cuenta"],
] as const;

export function PanelTabs({ badge }: { badge: number }) {
  const path = usePathname();
  return (
    <nav className="tabs no-print" aria-label="Secciones del panel">
      {TABS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
          {label}{href === "/panel/pedidos" && badge > 0 && <> <span className="sello" style={{ background: "var(--amarillo)" }}>{badge}<span className="sr-only"> sin ver</span></span></>}
        </Link>
      ))}
    </nav>
  );
}
