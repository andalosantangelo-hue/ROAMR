import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import { useActivities } from "../store/ActivitiesContext.jsx";
import { Plus } from "../components/Icons.jsx";

const SKILLS = ["All Levels", "Beginner", "Intermediate", "Advanced"];

export default function ComposeActivity() {
  const nav = useNavigate();
  const { addActivity } = useActivities();
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [when, setWhen] = useState("");
  const [skill, setSkill] = useState("All Levels");
  const [dmOpen, setDmOpen] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const pick = (e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } };
  const canPost = text.trim().length > 0 && !busy;

  const useMyLocation = () => {
    if (!navigator.geolocation) { setLocation(""); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(`Near ${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`),
      () => {}, { timeout: 8000 }
    );
  };

  const submit = async () => {
    if (!canPost) return;
    setBusy(true); setError("");
    try {
      await addActivity({ text: text.trim(), location: location.trim(), when, skillLevel: skill, dmOpen, file });
      nav("/app/activities");
    } catch (e) { setError(e.message || "Could not post."); setBusy(false); }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">New Activity</h1>
      </div>

      <div className="flex-1 px-6 pt-2 overflow-y-auto no-scrollbar">
        <label className="block text-sm font-semibold text-ink/80 mb-2">What Are You Planning?</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} autoFocus
          placeholder="e.g. Sunrise hike up Mt Batulao. Who's in?"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted resize-none" />

        <label className="block mt-5 text-sm font-semibold text-ink/80 mb-2">Location</label>
        <div className="flex gap-2">
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mount Batulao, Nasugbu"
            className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
          <button type="button" onClick={useMyLocation} className="shrink-0 rounded-xl bg-brand-tint text-brand-navy text-[13px] font-semibold px-3">Use my location</button>
        </div>

        <label className="block mt-5 text-sm font-semibold text-ink/80 mb-2">Date & Time</label>
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 text-ink" />

        <label className="block mt-5 text-sm font-semibold text-ink/80 mb-2">Skill Level</label>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <button key={s} type="button" onClick={() => setSkill(s)}
              className={`px-3.5 py-2 rounded-full text-sm font-semibold transition ${skill === s ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 py-1">
          <div>
            <div className="font-semibold text-ink text-[15px]">Allow direct messages</div>
            <div className="text-muted text-[13px]">Let people message you about this activity</div>
          </div>
          <button type="button" onClick={() => setDmOpen((v) => !v)} aria-label="Toggle direct messages"
            className={`w-11 h-6 rounded-full transition relative shrink-0 ${dmOpen ? "bg-brand-green" : "bg-black/15"}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${dmOpen ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>

        <button onClick={() => fileRef.current?.click()} aria-label="Add a photo"
          className="relative w-full aspect-[16/10] mt-5 rounded-2xl bg-brand-tint border-2 border-dashed border-brand-green/50 overflow-hidden grid place-items-center">
          {preview ? <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" /> : (
            <div className="flex flex-col items-center text-brand-navy/70">
              <span className="w-12 h-12 rounded-full bg-white grid place-items-center mb-2 shadow-card"><Plus className="w-6 h-6 text-brand-green" /></span>
              <span className="text-sm font-medium">Add a Photo (optional)</span>
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
