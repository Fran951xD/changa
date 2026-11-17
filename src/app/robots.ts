import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/share";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/panel", "/admin", "/auth", "/ingresar", "/contactar", "/visita", "/denunciar", "/buscar", "/presupuesto/enviado", "/*/resenar"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
