// Downscale + re-encode an image to JPEG in-browser before upload.
// Re-encoding via canvas strips EXIF/GPS metadata — we ALWAYS return the
// re-encoded file (never the original), so location metadata can't leak to the
// public bucket. If the image can't be decoded, we throw so the upload aborts
// rather than silently sending the original.
export async function compressImage(file, { maxDim = 1600, quality = 0.82 } = {}) {
  if (!file || !file.type || !file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file); // throws on undecodable input -> upload aborts
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!blob) throw new Error("Could not process that image — please try another.");
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}
