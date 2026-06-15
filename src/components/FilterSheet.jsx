import { useState, useEffect } from "react";

// sections: [{ key, title, options: [{ id, label }] }]
// value: { location: "", [key]: id|null }
export default function FilterSheet({ open, onClose, sections = [], value, onApply, showLocation = true }) {
  const [draft, setDraft] = useState(value || {});
  useEffect(() => { if (open) setDraft(value || {}); }, [open, value]);
  if (!open) return null;

  const pick = (key, id) => setDraft((d) => ({ ...d, [key]: d[key] === id ? null : id }));
  const clear = () => setDraft({ location: "" });
  const apply = () => { onApply(draft); onClose(); };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-t-3xl p-5 pb-7 max-h-[80%] overflow-y-auto no-scrollbar">
        <div className="w-10 h-1.5 rounded-full bg-black/15 mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-brand-navy">Filters</h2>
          <button onClick={clear} className="text-brand-green text-sm font-semibold">Clear all</button>
        </div>

        {showLocation && (
          <div className="mb-5">
            <p className="text-sm font-semibold text-ink/80 mb-2">Location</p>
            <input value={draft.location || ""} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              placeholder="e.g. Denver, CO"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
          </div>
        )}

        {sections.map((sec) => (
          <div key={sec.key} className="mb-5">
            <p className="text-sm font-semibold text-ink/80 mb-2">{sec.title}</p>
            <div className="flex flex-wrap gap-2">
              {sec.options.map((o) => (
                <button key={o.id} onClick={() => pick(sec.key, o.id)}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold transition ${
                    draft[sec.key] === o.id ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button onClick={apply}
          className="w-full mt-1 rounded-xl bg-brand-green hover:bg-brand-greenDark transition text-white font-semibold py-4">
          Show results
        </button>
      </div>
    </div>
  );
}
