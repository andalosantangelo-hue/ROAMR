// Downscale + re-encode an image to JPEG in-browser before upload.
// Re-encoding via canvas strips EXIF/GPS metadata — we ALWAYS return the
// re-encoded file (never the original), so location metadata can't leak to the
// public bucket. Anything we can't decode is rejected with a message the user can
// act on, rather than a raw browser/Firebase error.

export const MAX_INPUT_BYTES = 40 * 1024 * 1024; // decoding bigger files can crash a phone's WebView
const MAX_PIXELS = 60_000_000;                     // ~7700×7700; guards against "pixel bomb" images

export class ImageUploadError extends Error {
  constructor(message) { super(message); this.name = "ImageUploadError"; }
}

const isHeic = (file) => /image\/hei[cf]/i.test(file.type || "") || /\.(heic|heif)$/i.test(file.name || "");

export async function compressImage(file, { maxDim = 1600, quality = 0.82 } = {}) {
  if (!file) return file;
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageUploadError("That photo is too large (over 40 MB). Please choose a smaller one.");
  }
  // Untyped files used to be uploaded as-is — skipping the metadata strip and then
  // failing Storage rules with a raw permission error.
  if (!(file.type || "").startsWith("image/") && !isHeic(file)) {
    throw new ImageUploadError("That file isn't a photo. Please choose a JPG, PNG or WebP image.");
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageUploadError(isHeic(file)
      ? "HEIC photos aren't supported on this device yet. Please choose a JPG or PNG, or set your camera to \"Most Compatible\"."
      : "We couldn't read that photo. It may be damaged. Please try another.");
  }
  if (bitmap.width * bitmap.height > MAX_PIXELS) {
    bitmap.close?.();
    throw new ImageUploadError("That photo's dimensions are too large. Please choose a smaller one.");
  }
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!blob) throw new ImageUploadError("We couldn't process that photo. Please try another.");
  return new File([blob], (file.name || "photo").replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

// Turns any upload/save failure into text that's safe and useful to show a user.
// Raw Firebase errors ("Firebase Storage: User does not have permission to access
// 'avatars/…'", "PERMISSION_DENIED: evaluation error at L90…") leaked internals.
export function friendlyError(e, fallback = "Something went wrong. Please try again.") {
  if (e instanceof ImageUploadError) return e.message;
  const code = e?.code || "";
  if (code === "storage/unauthorized" || code === "permission-denied") {
    return "That couldn't be saved. Check that every field is filled in correctly and within its length limit.";
  }
  if (code === "storage/canceled") return "Upload cancelled.";
  if (code === "storage/retry-limit-exceeded" || code === "unavailable" || /network|offline/i.test(e?.message || "")) {
    return "You seem to be offline. Check your connection and try again.";
  }
  return fallback;
}
