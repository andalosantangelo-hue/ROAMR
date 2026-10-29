import { useEffect, useRef, useState } from "react";
import { searchPlaces, reverseGeocode, currentPosition, recentPlaces, rememberPlace } from "../lib/geo.js";

function PinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function LocateIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="7.5" />
    </svg>
  );
}
function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}

// Single-field location picker. Tapping the field opens a dropdown directly
// underneath with "Use current location" first, recent places, then live
// place suggestions as you type. No side button eating horizontal space.
//
// value: { label, lat?, lng? } | null      onChange(place | null)
export default function LocationField({ value, onChange, placeholder = "Search a place or trailhead", id }) {
  const [text, setText] = useState(value?.label || "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState("");
  const wrap = useRef(null);
  const recents = open && !text.trim() ? recentPlaces() : [];

  useEffect(() => { setText(value?.label || ""); }, [value?.label]);

  // Debounced live search.
  useEffect(() => {
    if (!open) return;
    const q = text.trim();
    if (q.length < 2 || (value?.lat != null && q === value.label)) { setResults([]); return; }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      try { setResults(await searchPlaces(q, value?.lat != null ? value : null, { signal: ctl.signal })); }
      catch { /* aborted / offline */ }
      finally { setBusy(false); }
    }, 280);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [text, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close when tapping anywhere else.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  const choose = (p) => {
    rememberPlace(p);
    onChange(p);
    setText(p.label);
    setOpen(false);
    setErr("");
  };

  const useCurrent = async () => {
    setLocating(true); setErr("");
    try {
      const pos = await currentPosition();
      choose(await reverseGeocode(pos.lat, pos.lng));
    } catch (e) { setErr(e.message); }
    finally { setLocating(false); }
  };

  const onType = (v) => {
    setText(v);
    setOpen(true);
    // Free-typed text is still a valid location (just without coordinates).
    onChange(v.trim() ? { label: v } : null);
  };

  return (
    <div ref={wrap} className="relative w-full min-w-0">
      <div className={`flex items-center gap-2 w-full rounded-xl border bg-white px-4 transition ${open ? "border-brand-green ring-2 ring-brand-green/30" : "border-black/10"}`}>
        <PinIcon className="w-5 h-5 text-brand-green shrink-0" />
        <input id={id} value={text} onChange={(e) => onType(e.target.value)} onFocus={() => setOpen(true)}
          placeholder={placeholder} autoComplete="off" enterKeyHint="done"
          className="flex-1 min-w-0 py-3.5 text-[15px] outline-none bg-transparent placeholder:text-muted" />
        {text && (
          <button type="button" aria-label="Clear location" onClick={() => { setText(""); onChange(null); setOpen(true); }}
            className="w-8 h-8 -mr-2 grid place-items-center text-muted text-lg">×</button>
        )}
      </div>

      {open && (
        <div role="listbox" className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-2xl shadow-card ring-1 ring-black/5 overflow-hidden">
          <button type="button" onClick={useCurrent} disabled={locating}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-brand-tint/60 min-h-[48px]">
            <span className="w-8 h-8 rounded-full bg-brand-tint text-brand-green grid place-items-center shrink-0">
              <LocateIcon className="w-[18px] h-[18px]" />
            </span>
            <span className="font-semibold text-brand-navy text-[14px]">
              {locating ? "Finding you…" : "Use current location"}
            </span>
          </button>
          {err && <p className="px-4 pb-2 text-[12px] text-red-600">{err}</p>}

          {recents.map((p) => (
            <button type="button" key={"r" + p.label} onClick={() => choose(p)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-t border-black/5 hover:bg-brand-tint/60">
              <ClockIcon className="w-5 h-5 text-muted shrink-0 ml-1.5" />
              <span className="text-[14px] text-ink truncate">{p.label}</span>
            </button>
          ))}

          {results.map((p) => (
            <button type="button" key={p.label + p.lat} onClick={() => choose(p)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-t border-black/5 hover:bg-brand-tint/60">
              <PinIcon className="w-5 h-5 text-brand-green shrink-0 ml-1.5" />
              <span className="text-[14px] text-ink truncate">{p.label}</span>
            </button>
          ))}
          {busy && <p className="px-4 py-2.5 text-[12px] text-muted border-t border-black/5">Searching…</p>}
        </div>
      )}
    </div>
  );
}
