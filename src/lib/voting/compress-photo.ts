/** Comprime una foto a data URL (WebP/JPEG) para guardarla en la tabla solo esta noche. */

const MAX_EDGE = 720;
const MAX_CHARS = 450_000; // ~340 KB en base64

export async function fileToArtistPhotoData(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const preferPng = file.type === "image/png" || file.type === "image/webp";
  let quality = 0.82;
  let dataUrl = canvas.toDataURL(preferPng ? "image/png" : "image/jpeg", quality);

  if (!preferPng) {
    while (dataUrl.length > MAX_CHARS && quality > 0.45) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
  }

  if (dataUrl.length > MAX_CHARS) {
    // PNG cutout grande: bajar resolución
    const shrink = Math.sqrt(MAX_CHARS / dataUrl.length);
    const w2 = Math.max(1, Math.round(width * shrink));
    const h2 = Math.max(1, Math.round(height * shrink));
    canvas.width = w2;
    canvas.height = h2;
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("No se pudo redimensionar"));
      img.src = dataUrl;
    });
    ctx.clearRect(0, 0, w2, h2);
    ctx.drawImage(img, 0, 0, w2, h2);
    dataUrl = canvas.toDataURL("image/png");
  }

  if (dataUrl.length > MAX_CHARS) {
    throw new Error("La foto es demasiado pesada. Usa un PNG sin fondo mas liviano.");
  }

  return dataUrl;
}

export function isPhotoDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/") && value.length < 900_000;
}
