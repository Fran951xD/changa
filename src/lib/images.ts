import "server-only";
import sharp from "sharp";
import { db, schema } from "@/db";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Recibe la foto como sale del celular (JPEG/PNG/HEIC de varios MB), la endereza según EXIF,
 * le saca los metadatos (GPS incluido) y guarda dos WebP: 1200 px y miniatura de 400 px.
 */
export async function saveImage(file: File, ownerId: string | null) {
  if (!(file instanceof File) || file.size === 0) throw new UploadError("Elegí una foto.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("La foto pesa más de 8 MB. Probá con otra o sacala de nuevo.");
  const input = Buffer.from(await file.arrayBuffer());
  let meta;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new UploadError("Ese archivo no parece una foto. Subí una imagen JPG, PNG o WebP.");
  }
  if (!meta.width || !meta.height) throw new UploadError("No pudimos leer la foto. Probá con otra.");
  const pipeline = () => sharp(input).rotate();
  const { data, info } = await pipeline()
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer({ resolveWithObject: true });
  const thumb = await pipeline().resize(400, 400, { fit: "cover" }).webp({ quality: 68 }).toBuffer();
  const [row] = await db
    .insert(schema.images)
    .values({ ownerId, width: info.width, height: info.height, data, thumb })
    .returning({ id: schema.images.id });
  return row.id;
}

export class UploadError extends Error {}

export const imageUrl = (id: string, thumb = false) => `/i/${id}${thumb ? "?t=1" : ""}`;
