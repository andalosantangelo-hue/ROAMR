import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import { usePosts } from "../store/PostsContext.jsx";
import { Plus, Star } from "../components/Icons.jsx";

export default function ComposePost() {
  const nav = useNavigate();
  const { addPost } = usePosts();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const pick = (e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } };
  const canPost = title.trim().length > 0 && !busy;

  const submit = async () => {
    if (!canPost) return;
    setBusy(true); setError("");
    try { await addPost({ title: title.trim(), location: location.trim(), rating, file }); nav("/app/home"); }
    catch (e) { setError(e.message || "Could not post."); setBusy(false); }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">New Post</h1>
      </div>

      <div className="flex-1 px-6 pt-2 overflow-y-auto no-scrollbar">
        <button onClick={() => fileRef.current?.click()}
          className="relative w-full aspect-[16/10] rounded-2xl bg-brand-tint border-2 border-dashed border-brand-green/50 overflow-hidden grid place-items-center">
          {preview ? <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" /> : (
            <div className="flex flex-col items-center text-brand-navy/70">
              <span className="w-12 h-12 rounded-full bg-white grid place-items-center mb-2 shadow-card"><Plus className="w-6 h-6 text-brand-green" /></span>
              <span className="text-sm font-medium">Add a photo</span>
            </div>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />

        <label className="block mt-6 text-sm font-semibold text-ink/80 mb-2">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mt Daraitan + Tinipak River"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />

        <label className="block mt-5 text-sm font-semibold text-ink/80 mb-2">Location</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mount Daraitan · Tanay"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />

        <label className="block mt-5 text-sm font-semibold text-ink/80 mb-2">Rating</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n === rating ? 0 : n)}>
              <Star filled={n <= rating} className="w-8 h-8 text-brand-green" />
            </button>
          ))}
        </div>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>

      <div className="px-6 pb-7 pt-3">
        <button disabled={!canPost} onClick={submit}
          className={`w-full rounded-xl py-4 font-semibold transition ${canPost ? "bg-brand-green hover:bg-brand-greenDark text-white" : "bg-black/15 text-white/90 cursor-not-allowed"}`}>
          {busy ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
