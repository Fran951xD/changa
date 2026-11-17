import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkerBySlug } from "@/lib/workers";
import { eligibilityFor } from "@/lib/reviews";
import { requireUser, visitorId } from "@/lib/auth";
import { REVIEW_MAX_DAYS } from "@/lib/review-rules";
import { ReviewForm } from "./ReviewForm";

export const metadata: Metadata = { title: "Dejar una reseña", robots: { index: false } };

export default async function Resenar({ params }: PageProps<"/[slug]/resenar">) {
  const { slug } = await params;
  const w = await getWorkerBySlug(slug);
  if (!w || w.status !== "published") notFound();
  const user = await requireUser(`/${slug}/resenar`);
  const e = (await eligibilityFor(w, user, await visitorId()))!;
  const first = w.displayName.split(" ")[0];

  const blocked: Record<string, React.ReactNode> = {
    "own-profile": "No podés reseñar tu propio perfil.",
    "already-reviewed": <>Ya dejaste una reseña para {first}. <Link href={`/${slug}#resenas`}>Verla en su perfil</Link>.</>,
    "no-contact": <>Para que las reseñas sean confiables, solo pueden opinar quienes contactaron a {first} desde Changa. Si lo contactaste por otro lado, tocá <Link href={`/${slug}`}>“Escribirle por WhatsApp”</Link> en su perfil y vas a poder reseñarlo a partir de mañana.</>,
    "too-late": `Pasaron más de ${REVIEW_MAX_DAYS} días desde que lo contactaste, así que ya no se puede reseñar. Si lo volvés a contratar, contactalo de nuevo desde Changa.`,
  };

  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <div className="page-head">
        <p><Link href={`/${slug}`}>Volver al perfil de {first}</Link></p>
        <h1>Reseña para {w.displayName}</h1>
      </div>
      {e.ok ? (
        <ReviewForm slug={slug} workerFirst={first} defaultName={user.name ?? ""} />
      ) : (
        <div className="panel" role="status">
          <p style={{ margin: 0 }}>
            {e.reason === "too-soon"
              ? `Le escribiste hace poco. Podés dejar tu reseña desde el ${e.availableFrom!.toLocaleString("es-AR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })}, cuando ya haya pasado el trabajo.`
              : blocked[e.reason]}
          </p>
        </div>
      )}
    </div>
  );
}
