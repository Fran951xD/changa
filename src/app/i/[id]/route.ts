import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(request: Request, { params }: RouteContext<"/i/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("No encontrada", { status: 404 });
  const thumb = new URL(request.url).searchParams.has("t");
  const [row] = await db
    .select({ bytes: thumb ? schema.images.thumb : schema.images.data })
    .from(schema.images)
    .where(eq(schema.images.id, id));
  if (!row) return new Response("No encontrada", { status: 404 });
  return new Response(new Uint8Array(row.bytes), {
    headers: {
      "Content-Type": "image/webp",
      // Cada subida tiene id nuevo: la imagen nunca cambia y puede cachearse para siempre.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
