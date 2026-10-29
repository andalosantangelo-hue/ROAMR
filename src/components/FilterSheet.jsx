import { useState, useEffect } from "react";
import LocationField from "./LocationField.jsx";

export const RADII = [
  { id: null, label: "Anywhere" },
  { id: 10, label: "10 mi" },
  { id: 25, label: "25 mi" },
  { id: 50, label: "50 mi" },
  { id: 100, label: "100 mi" },
];

// sections: [{ key, title, options: [{ id, label }] }]
// value: { location: "", [key]: id|null }                 (locationMode="text")
// value: { place: {label,lat,lng}|null, radius: n|null }  (locationMode="place")
export default function FilterSheet({ open, onClose, sections = [], value, onApply, showLocation = true, locationMode = "text", onViewMap }) {
  const [draft, setDraft] = useState(value || {});
  useEffect(() => { if (open) setDraft(value || {}); }, [open, value]);
  if (!open) return null;

  const pick = (key, id) => setDraft((d) => ({ ...d, [key]: d[key] === id ? null : id }));
  const clear = () => setDraft(locationMode === "place" ? { place: null, radius: null } : { location: "" });
  const apply = () => { onApply(draft); onClose(); };
  const hasCoords = draft.place?.lat != null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-t-3xl p-5 pb-7 max-h-[85%] overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="w-10 h-1.5 rounded-full bg-black/15 mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-brand-navy">Filters</h2>
          <button onClick={clear} className="text-brand-green text-sm font-semibold min-h-[44px] px-1">Clear all</button>
        </div>

        {showLocation && locationMode === "text" && (
          <div className="mb-5">
            <p className="text-sm font-semibold text-ink/80 mb-2">Location</p>
            <input value={draft.location || ""} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              placeholder="e.g. Denver, CO"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
          </div>
        )}

        {showLocation && locationMode === "place" && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-ink/80">Near</p>
              {onViewMap && (
                <button onClick={() => { onApply(draft); onClose(); onViewMap(); }}
                  className="text-brand-green text-[13px] font-semibold min-h-[36px]">View on map →</button>
              )}
            </div>
            <LocationField value={draft.place} onChange={(p) => setDraft((d) => ({ ...d, place: p }))} placeholder="Town, park, or current location" />
            <p className="text-sm font-semibold text-ink/80 mt-4 mb-2">Distance</p>
            <div className="flex flex-wrap gap-2">
              {RADII.map((r) => {
                const on = (draft.radius ?? null) === r.id;
                const disabled = r.id && !hasCoords;
                return (
                  <button key={r.label} disabled={disabled} onClick={() => setDraft((d) => ({ ...d, radius: r.id }))}
                    className={`px-3.5 py-2 rounded-full text-sm font-semibold transition min-h-[40px] ${
                      on ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"} ${disabled ? "opacity-40" : ""}`}>
                    {r.label}
                  </button>
                );
              })}
            </div>
            {!hasCoords && <p className="text-[12px] text-muted mt-2">Pick a place from the list (or use current location) to filter by distance.</p>}
          </div>
        )}

        {sections.map((sec) => (
          <div key={sec.key} className="mb-5">
            <p className="text-sm font-semibold text-ink/80 mb-2">{sec.title}</p>
            <div className="flex flex-wrap gap-2">
              {sec.options.map((o) => (
                <button key={o.id} onClick={() => pick(sec.key, o.id)}
                  className={`px-3.5 py-2 rounded-full text-sm font-semibold transition min-h-[40px] ${
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
