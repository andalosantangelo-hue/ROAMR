import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import { useListings } from "../store/ListingsContext.jsx";
import { Plus } from "../components/Icons.jsx";

export default function CreateListing() {
  const nav = useNavigate();
  const { addListing } = useListings();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("sell");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const pick = (e) => {
    const fs = Array.from(e.target.files || []).slice(0, 5);
    setFiles(fs);
    setPreviews(fs.map((f) => URL.createObjectURL(f)));
  };

  const canPost = title.trim() && price && files.length > 0 && !busy;

  const submit = async () => {
    if (!canPost) return;
    setBusy(true); setError("");
    try {
      const id = await addListing({ title: title.trim(), description: desc.trim(), price, type, files });
      nav(id ? `/listing/${id}` : "/app/marketplace");
    } catch (e) { setError(e.message || "Could not list."); setBusy(false); }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">List Gear</h1>
      </div>

      <div className="flex-1 px-6 pt-2 overflow-y-auto no-scrollbar">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => fileRef.current?.click()}
            className="w-24 h-24 shrink-0 rounded-xl bg-brand-tint border-2 border-dashed border-brand-green/50 grid place-items-center text-brand-green">
            <Plus className="w-7 h-7" />
          </button>
          {previews.map((p, i) => (
            <img key={i} src={p} alt="" className="w-24 h-24 shrink-0 rounded-xl object-cover" />
          ))}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={pick} className="hidden" />
        <p className="text-muted text-[12px] mt-2">Add up to 5 photos</p>

        <label className="block mt-5 text-sm font-semibold text-ink/80 mb-2">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 2-person tent, barely used"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div>
            <label className="block text-sm font-semibold text-ink/80 mb-2">Price ($)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="0"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink/80 mb-2">Type</label>
            <div className="flex rounded-xl border border-black/10 overflow-hidden">
              {["sell", "rent"].map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-4 text-sm font-semibold capitalize ${type === t ? "bg-brand-green text-white" : "bg-white text-ink"}`}>
                  {t === "sell" ? "Sell" : "Rent"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="block mt-5 text-sm font-semibold text-ink/80 mb-2">Description</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Condition, size, pickup details…"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted resize-none" />
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>

      <div className="px-6 pb-7 pt-3">
        <button disabled={!canPost} onClick={submit}
          className={`w-full rounded-xl py-4 font-semibold transition ${canPost ? "bg-brand-green hover:bg-brand-greenDark text-white" : "bg-black/15 text-white/90 cursor-not-allowed"}`}>
          {busy ? "Listing…" : "List Gear"}
        </button>
      </div>
    </div>
  );
}
