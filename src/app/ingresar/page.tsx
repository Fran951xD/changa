import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { safeNext } from "@/lib/security";
import { Turnstile } from "@/components/Turnstile";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function Ingresar({ searchParams }: PageProps<"/ingresar">) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getUser()) redirect(next);
  const google = Boolean(process.env.GOOGLE_CLIENT_ID);

  return (
    <div className="wrap" style={{ maxWidth: 480 }}>
      <div className="page-head">
        <h1>Entrar a Changa</h1>
        <p className="muted">Sin contraseñas: te mandamos un enlace a tu mail y listo. Para buscar y contactar no hace falta cuenta.</p>
      </div>
      {sp.error && (
        <p className="aviso aviso-error" role="alert">
          {sp.error === "vencido" ? "Ese enlace ya se usó o venció. Pedí uno nuevo abajo." : "No pudimos entrar con Google. Probá de nuevo o usá tu email."}
        </p>
      )}
      <div className="panel">
        {google && (
          <>
            <a className="btn btn-full" href={`/auth/google?next=${encodeURIComponent(next)}`}>Entrar con Google</a>
            <p className="muted small" style={{ textAlign: "center", margin: "14px 0" }}>o con tu email</p>
          </>
        )}
        <LoginForm next={next} turnstile={<Turnstile />} />
      </div>
    </div>
  );
}
