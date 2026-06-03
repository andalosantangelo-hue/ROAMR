import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import { useActivities } from "../store/ActivitiesContext.jsx";
import { Plus } from "../components/Icons.jsx";

export default function ComposeActivity() {
  const nav = useNavigate();
  const { addActivity } = useActivities();
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const pick = (e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } };
  const canPost = text.trim().length > 0 && !busy;

  const submit = async () => {
    if (!canPost) return;
    setBusy(true); setError("");
    try { await addActivity({ text: text.trim(), file }); nav("/app/activities"); }
    catch (e) { setError(e.message || "Could not post."); setBusy(false); }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">New Activity</h1>
      </div>

      <div className="flex-1 px-6 pt-2 overflow-y-auto no-scrollbar">
        <label className="block text-sm font-semibold text-ink/80 mb-2">What are you planning?</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} autoFocus
          placeholder="e.g. Sunrise hike up Mt Batulao this Sunday, 5 AM. Who's in?"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted resize-none" />

        <button onClick={() => fileRef.current?.click()}
          className="relative w-full aspect-[16/10] mt-4 rounded-2xl bg-brand-tint border-2 border-dashed border-brand-green/50 overflow-hidden grid place-items-center">
          {preview ? <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" /> : (
            <div className="flex flex-col items-center text-brand-navy/70">
              <span className="w-12 h-12 rounded-full bg-white grid place-items-center mb-2 shadow-card"><Plus className="w-6 h-6 text-brand-green" /></span>
              <span className="text-sm font-medium">Add a photo (optional)</span>
            </div>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>

      <div className="px-6 pb-7 pt-3">
        <button disabled={!canPost} onClick={submit}
          className={`w-full rounded-xl py-4 font-semibold transition ${canPost ? "bg-brand-green hover:bg-brand-greenDark text-white" : "bg-black/15 text-white/90 cursor-not-allowed"}`}>
          {busy ? "Posting…" : "Post Activity"}
        </button>
      </div>
    </div>
  );
}
