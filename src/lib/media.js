// Media pipeline for posts: photos (up to 4K, 360° panoramas up to ~6K),
// videos (4K/6K originals) and audio. Images are re-encoded client-side, which
// strips EXIF/GPS. Videos/audio upload as originals with progress + resume.
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase.js";

export const MAX_MEDIA = 10;
export const LIMITS = {
  image: 40 * 1024 * 1024,        // 40 MB in (re-encoded smaller before upload)
  video: 2 * 1024 * 1024 * 1024,  // 2 GB — fits ~5 min of 4K HEVC
  audio: 200 * 1024 * 1024,       // 200 MB
};
export const MAX_VIDEO_SECONDS = 5 * 60;

export function kindOf(file) {
  const t = file?.type || "";
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  // iOS sometimes hands over .mov/.heic without a MIME type.
  const ext = (file?.name || "").split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "heic", "heif", "gif"].includes(ext)) return "image";
  if (["mov", "mp4", "m4v", "webm", "hevc"].includes(ext)) return "video";
  if (["m4a", "mp3", "aac", "wav", "ogg"].includes(ext)) return "audio";
  return null;
}

const fmtMB = (b) => `${Math.round(b / (1024 * 1024))} MB`;

// Read dimensions/duration and build a local preview for the composer.
export async function inspect(file) {
  const kind = kindOf(file);
  if (!kind) throw new Error(`${file.name}: that file type isn't supported.`);
  if (file.size > LIMITS[kind]) throw new Error(`${file.name} is over the ${fmtMB(LIMITS[kind])} limit for ${kind}s.`);
  const url = URL.createObjectURL(file);
  if (kind === "image") {
    const bmp = await createImageBitmap(file);
    const w = bmp.width, h = bmp.height;
    bmp.close?.();
    // Equirectangular panoramas are exactly 2:1.
    const is360 = Math.abs(w / h - 2) < 0.02 && w >= 3000;
    return { kind, file, url, w, h, is360 };
  }
  if (kind === "video") {
    const meta = await new Promise((res) => {
      const v = document.createElement("video");
      v.preload = "metadata"; v.muted = true; v.playsInline = true; v.src = url;
      v.onloadedmetadata = () => res({ w: v.videoWidth, h: v.videoHeight, duration: v.duration });
      v.onerror = () => res({ w: 0, h: 0, duration: 0 });
    });
    if (meta.duration > MAX_VIDEO_SECONDS) throw new Error(`${file.name} is longer than ${MAX_VIDEO_SECONDS / 60} minutes — trim it and try again.`);
    return { kind, file, url, ...meta, is360: meta.w && Math.abs(meta.w / meta.h - 2) < 0.02 };
  }
  return { kind, file, url, duration: 0 };
}

// Canvas re-encode (strips metadata). iOS caps canvases at ~16.7M pixels, so
// 360° panoramas top out at 5760×2880 and regular photos at 4096px (4K).
async function encodeImage(file, is360) {
  const maxDim = is360 ? 5760 : 4096;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.86));
  if (!blob) throw new Error("Couldn't process that photo — try another.");
  return { blob, w, h };
}

// First frame of a video as a JPEG poster (also used as the feed thumbnail).
async function videoPoster(url) {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
    v.onloadeddata = () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 3); };
    v.onseeked = () => {
      const scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale);
      c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
      c.toBlob((b) => resolve(b), "image/jpeg", 0.8);
    };
    v.onerror = () => resolve(null);
  });
}

function put(path, blob, contentType, onBytes) {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, path), blob, { contentType, cacheControl: "public,max-age=31536000" });
    let last = 0;
    task.on("state_changed",
      (s) => { onBytes(s.bytesTransferred - last); last = s.bytesTransferred; },
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref)));
  });
}

// Upload every item; onProgress(0..1) reports combined progress.
export async function uploadMedia(uid, items, onProgress = () => {}) {
  const stamp = Date.now();
  const prepared = await Promise.all(items.map(async (it) => {
    if (it.kind === "image") {
      const { blob, w, h } = await encodeImage(it.file, it.is360);
      return { it, blob, type: "image/jpeg", ext: "jpg", w, h };
    }
    const ext = (it.file.name.split(".").pop() || (it.kind === "video" ? "mp4" : "m4a")).toLowerCase();
    const poster = it.kind === "video" ? await videoPoster(it.url) : null;
    return { it, blob: it.file, type: it.file.type || (it.kind === "video" ? "video/mp4" : "audio/mp4"), ext, poster, w: it.w, h: it.h };
  }));
  const total = prepared.reduce((n, p) => n + p.blob.size + (p.poster?.size || 0), 0) || 1;
  let sent = 0;
  const tick = (b) => { sent += b; onProgress(Math.min(1, sent / total)); };

  const out = [];
  for (let i = 0; i < prepared.length; i++) {
    const p = prepared[i];
    const base = `posts/${uid}/${stamp}-${i}`;
    const url = await put(`${base}.${p.ext}`, p.blob, p.type, tick);
    const posterUrl = p.poster ? await put(`${base}-poster.jpg`, p.poster, "image/jpeg", tick) : null;
    out.push({
      type: p.it.kind, url,
      ...(posterUrl ? { poster: posterUrl } : {}),
      ...(p.w ? { w: p.w, h: p.h } : {}),
      ...(p.it.is360 ? { is360: true } : {}),
      ...(p.it.duration ? { duration: Math.round(p.it.duration) } : {}),
      ...(p.it.kind === "audio" ? { name: p.it.file.name.replace(/\.\w+$/, "").slice(0, 80) } : {}),
    });
  }
  onProgress(1);
  return out;
}
