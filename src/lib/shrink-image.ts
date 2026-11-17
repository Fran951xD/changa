/**
 * Achica una foto en el navegador antes de subirla (a 2000 px, JPEG): ahorra datos móviles y
 * evita el límite de 4,5 MB por pedido de Vercel. El servidor igual la vuelve a procesar con sharp.
 */
export async function shrinkImage(file: File, max = 2000): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 1_500_000) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file; // formato que el navegador no sabe leer (p. ej. HEIC en algunos Android): que lo intente el servidor
  }
}
