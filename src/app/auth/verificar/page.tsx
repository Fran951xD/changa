import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { createSession, upsertUser } from "@/lib/auth";
import { safeNext, sha256 } from "@/lib/security";

export const metadata: Metadata = { title: "Confirmar ingreso", robots: { index: false } };

async function confirm(form: FormData) {
  "use server";
  const token = String(form.get("t") ?? "");
  const [row] = await db
    .update(schema.loginTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.loginTokens.tokenHash, sha256(token)), isNull(schema.loginTokens.usedAt), gt(schema.loginTokens.expiresAt, new Date())))
    .returning();
  if (!row) redirect("/ingresar?error=vencido");
  const user = await upsertUser(row.email);
  await createSession(user.id);
  redirect(safeNext(row.next));
}

// El enlace abre esta página y el ingreso se confirma con un botón (POST):
// los antivirus de mail que "visitan" los enlaces no consumen el token.
export default async function Verificar({ searchParams }: PageProps<"/auth/verificar">) {
  const { t } = await searchParams;
  return (
    <div className="wrap" style={{ maxWidth: 480 }}>
      <div className="page-head"><h1>Ya casi</h1></div>
      <form action={confirm} className="panel">
        <input type="hidden" name="t" value={typeof t === "string" ? t : ""} />
        <p>Tocá el botón para terminar de entrar a Changa.</p>
        <button className="btn btn-azul btn-full" autoFocus>Entrar</button>
      </form>
    </div>
  );
}
