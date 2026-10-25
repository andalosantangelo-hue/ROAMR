import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import LocationField from "../components/LocationField.jsx";
import { usePosts } from "../store/PostsContext.jsx";
import { Plus, Star } from "../components/Icons.jsx";
import { inspect, MAX_MEDIA } from "../lib/media.js";

export const BODY_MAX = 2200; // same ceiling as an Instagram caption

const BADGE = { video: "Video", audio: "Audio" };

function fmtDur(s) {
  if (!s) return "";
  const m = Math.floor(s / 60), r = Math.round(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function MediaThumb({ m, onRemove, onToggle360 }) {
  return (
    <div className="relative shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-brand-navy snap-start">
      {m.kind === "image" && <img src={m.url} alt="" className="w-full h-full object-cover" />}
      {m.kind === "video" && <video src={m.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />}
      {m.kind === "audio" && (
        <div className="w-full h-full grid place-items-center text-brand-greenBright px-2 text-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" /></svg>
          <span className="text-[10px] text-white/80 truncate w-full">{m.file.name}</span>
        </div>
      )}
      {(BADGE[m.kind] || (m.is360 && m.kind !== "image")) && (
        <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/60 text-white">
          {m.is360 ? "360°" : BADGE[m.kind]}{m.duration ? ` · ${fmtDur(m.duration)}` : ""}
        </span>
      )}
      <button type="button" onClick={onRemove} aria-label="Remove"
        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white grid place-items-center text-sm">×</button>
      {m.kind === "image" && Math.abs(m.w / m.h - 2) < 0.05 && (
        <button type="button" onClick={onToggle360}
          className={`absolute bottom-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${m.is360 ? "bg-brand-green text-white" : "bg-white/90 text-brand-navy"}`}>
          {m.is360 ? "360 on" : "Make 360"}
        </button>
      )}
    </div>
  );
}

export default function ComposePost() {
  const nav = useNavigate();
  const { addPost } = usePosts();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [place, setPlace] = useState(null);
  const [rating, setRating] = useState(0);
  const [media, setMedia] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => () => media.forEach((m) => URL.revokeObjectURL(m.url)), []); // eslint-disable-line

  // Auto-grow the story box.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 320) + "px";
  }, [body]);

  const pick = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    setError("");
    const room = MAX_MEDIA - media.length;
    if (files.length > room) setError(`You can add up to ${MAX_MEDIA} items per post.`);
    const next = [];
    for (const f of files.slice(0, room)) {
      try { next.push(await inspect(f)); } catch (err) { setError(err.message); }
    }
    setMedia((m) => [...m, ...next]);
  };

  const canPost = title.trim().length > 0 && !busy;

  const submit = async () => {
    if (!canPost) return;
    setBusy(true); setError(""); setProgress(0);
    try {
      await addPost({
        title: title.trim(), body: body.trim(), location: (place?.label || "").trim(),
        geo: place?.lat != null ? { lat: place.lat, lng: place.lng } : null,
        rating, media, onProgress: setProgress,
      });
      nav("/app/home");
    } catch (e) { setError(e.message || "Could not post."); setBusy(false); }
  };

  const hasMedia = media.length > 0;

  return (
    <div className="h-full flex flex-col bg-white overflow-x-hidden">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none w-11 h-11 -ml-3 grid place-items-center">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">New Post</h1>
      </div>

      <div className="flex-1 px-6 pt-2 overflow-y-auto overflow-x-hidden no-scrollbar">
        {!hasMedia ? (
          <button onClick={() => fileRef.current?.click()}
            className="relative w-full aspect-[16/10] rounded-2xl bg-brand-tint border-2 border-dashed border-brand-green/50 overflow-hidden grid place-items-center">
            <div className="flex flex-col items-center text-brand-navy/70 px-6 text-center">
              <span className="w-12 h-12 rounded-full bg-white grid place-items-center mb-2 shadow-card"><Plus className="w-6 h-6 text-brand-green" /></span>
              <span className="text-sm font-semibold text-brand-navy">Add photos, video or audio</span>
              <span className="text-[12px] text-muted mt-1">Up to {MAX_MEDIA} · 4K & 360° photos · 4K/6K video up to 5 min</span>
            </div>
          </button>
        ) : (
          <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x -mx-6 px-6 pb-1">
            {media.map((m, i) => (
              <MediaThumb key={m.url} m={m}
                onRemove={() => { URL.revokeObjectURL(m.url); setMedia((all) => all.filter((_, j) => j !== i)); }}
                onToggle360={() => setMedia((all) => all.map((x, j) => (j === i ? { ...x, is360: !x.is360 } : x)))} />
            ))}
            {media.length < MAX_MEDIA && (
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Add more media"
                className="shrink-0 w-28 h-28 rounded-xl border-2 border-dashed border-brand-green/50 bg-brand-tint grid place-items-center text-brand-green">
                <Plus className="w-7 h-7" />
              </button>
            )}
          </div>
        )}
        <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*" onChange={pick} className="hidden" />

        <label htmlFor="post-title" className="block mt-6 text-sm font-semibold text-ink/80 mb-2">Title</label>
        <input id="post-title" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 120))} placeholder="e.g. Bridal Veil Falls at golden hour"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />

        <div className="flex items-end justify-between mt-5 mb-2">
          <label htmlFor="post-body" className="text-sm font-semibold text-ink/80">Tell the story <span className="font-normal text-muted">(optional)</span></label>
          <span className={`text-[11px] ${body.length > BODY_MAX - 100 ? "text-amber-700" : "text-muted"}`}>{body.length}/{BODY_MAX}</span>
        </div>
        <textarea id="post-body" ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))} rows={3}
          placeholder="How'd it go? Conditions, the crew, what you'd tell someone heading out next…"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted resize-none" />

        <label htmlFor="post-loc" className="block mt-5 text-sm font-semibold text-ink/80 mb-2">Location</label>
        <LocationField id="post-loc" value={place} onChange={setPlace} placeholder="Trail, peak, or town" />

        <label className="block mt-5 text-sm font-semibold text-ink/80 mb-2">Rating</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n === rating ? 0 : n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="w-11 h-11 grid place-items-center">
              <Star filled={n <= rating} className="w-8 h-8 text-brand-green" />
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted mt-4 mb-2 leading-relaxed">
          Only post media you shot or have the rights to share. Music in videos must be licensed.
        </p>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <div className="px-6 pb-7 pt-3">
        <button disabled={!canPost} onClick={submit}
          className={`relative w-full overflow-hidden rounded-xl py-4 font-semibold transition ${canPost ? "bg-brand-green hover:bg-brand-greenDark text-white" : busy ? "bg-brand-green text-white" : "bg-black/15 text-white/90 cursor-not-allowed"}`}>
          {busy && <span className="absolute inset-y-0 left-0 bg-white/20 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />}
          <span className="relative">{busy ? (hasMedia ? `Uploading ${Math.round(progress * 100)}%…` : "Posting…") : "Post"}</span>
        </button>
      </div>
    </div>
  );
}
