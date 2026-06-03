import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import { useTribes } from "../store/TribesContext.jsx";
import { Plus } from "../components/Icons.jsx";

export default function CreateTribe() {
  const nav = useNavigate();
  const { addTribe } = useTribes();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const pickImage = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const canCreate = name.trim().length > 0 && !busy;

  const submit = async () => {
    if (!canCreate) return;
    setBusy(true); setError("");
    try {
      await addTribe({ name: name.trim(), file, category });
      nav("/app/tribes");
    } catch (e) {
      setError(e.message || "Could not create tribe.");
      setBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Create Tribe</h1>
      </div>

      <div className="flex-1 px-6 pt-2 overflow-y-auto no-scrollbar">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative w-full aspect-[16/10] rounded-2xl bg-brand-tint border-2 border-dashed border-brand-green/50 overflow-hidden grid place-items-center"
        >
          {preview ? (
            <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-brand-navy/70">
              <span className="w-12 h-12 rounded-full bg-white grid place-items-center mb-2 shadow-card">
                <Plus className="w-6 h-6 text-brand-green" />
              </span>
              <span className="text-sm font-medium">Add tribe photo</span>
            </div>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
        {preview && (
          <button onClick={() => fileRef.current?.click()}
            className="mt-2 text-brand-green text-sm font-semibold">Change photo</button>
        )}

        <label className="block mt-6 text-sm font-semibold text-ink/80 mb-2">Activity</label>
        <div className="flex flex-wrap gap-2">
          {[["outdoor","Outdoor"],["water","Water"],["wheel","Wheels"],["nature","Nature"],["snow","Snow"]].map(([id,label]) => (
            <button key={id} type="button" onClick={() => setCategory(id === category ? null : id)}
              className={`px-3.5 py-2 rounded-full text-sm font-semibold transition ${category === id ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>
              {label}
            </button>
          ))}
        </div>

        <label className="block mt-6 text-sm font-semibold text-ink/80 mb-2">Tribe name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Weekend Wanderers"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-[15px] outline-none
                     focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted"
        />
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>

      <div className="px-6 pb-7 pt-3">
        <button
          disabled={!canCreate}
          onClick={submit}
          className={`w-full rounded-xl py-4 font-semibold transition ${
            canCreate ? "bg-brand-green hover:bg-brand-greenDark text-white" : "bg-black/15 text-white/90 cursor-not-allowed"
          }`}
        >
          {busy ? "Creating…" : "Create Tribe"}
        </button>
      </div>
    </div>
  );
}
