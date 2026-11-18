import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getWorkerForUser, missingForPublish } from "@/lib/workers";
import { formatArPhone, whatsappLink } from "@/lib/phone";
import { phoneMode } from "@/lib/messaging";
import { siteHost } from "@/lib/share";
import { ProfileForm } from "./ProfileForm";
import { PhoneVerify } from "./PhoneVerify";
import { Photos } from "./Photos";

export const metadata: Metadata = { title: "Mi tarjeta", robots: { index: false } };

export default async function PerfilPage() {
  const user = await requireUser("/panel/perfil");
  const w = await getWorkerForUser(user.id);
  if (!w) redirect("/panel");
  const missing = missingForPublish(w);

  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <h1>Tu tarjeta</h1>
        <p className="muted">
          {w.status === "published"
            ? <>Tu perfil está publicado en <Link href={`/${w.slug}`}>{siteHost()}/{w.slug}</Link>.</>
            : missing.length
              ? `Para publicar te falta: ${missing.join(", ")}. Lo demás es opcional y lo podés completar después.`
              : "Ya podés publicar tu perfil."}
        </p>
      </div>
      <PhoneVerify current={w.phone && w.phoneVerifiedAt ? formatArPhone(w.phone) : null} pending={w.pendingPhone} mode={phoneMode()}
        pendingWa={w.pendingPhone ? whatsappLink(w.pendingPhone, "Confirmo mi número para Changa") : null} />
      <div style={{ marginTop: 20 }}>
        <ProfileForm initial={{
          displayName: w.displayName, trades: w.trades, description: w.description, yearsExperience: w.yearsExperience,
          zoneMode: w.zoneMode, areas: w.areas, baseLat: w.baseLat, baseLng: w.baseLng, radiusKm: w.radiusKm,
          schedule: w.schedule, urgencies: w.urgencies, paymentMethods: w.paymentMethods, licenseNumber: w.licenseNumber,
          published: w.status === "published",
        }} />
      </div>
      <Photos photoId={w.photoId} photos={w.photos} />
    </div>
  );
}
