import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useListings } from "../store/ListingsContext.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { GridSkeleton } from "../components/Skeleton.jsx";
import { Market } from "../components/Icons.jsx";

const TABS = [
  { id: "gear", label: "Gear" },
  { id: "apparel", label: "ROAMR Apparel" },
];

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "rent", label: "For rent" },
  { id: "sell", label: "For sale" },
];

const CATEGORIES = ["All", "Apparel", "Camping", "Climbing", "Water Sports", "Snow Sports", "Cycling", "Footwear", "Other"];

const APPAREL = [
  { id: "tee", name: "ROAMR Trail Tee", price: 28, blurb: "Soft organic cotton · Sage" },
  { id: "hoodie", name: "ROAMR Summit Hoodie", price: 58, blurb: "Midweight fleece · Forest" },
  { id: "cap", name: "ROAMR 5-Panel Cap", price: 26, blurb: "Adjustable · Stone" },
  { id: "beanie", name: "ROAMR Ridge Beanie", price: 24, blurb: "Ribbed knit · Moss" },
  { id: "bottle", name: "ROAMR Insulated Bottle", price: 32, blurb: "32oz · Keeps cold 24h" },
  { id: "stickers", name: "ROAMR Sticker Pack", price: 9, blurb: "Weatherproof · 6 pack" },
];

export default function Marketplace() {
  const nav = useNavigate();
  const { listings, loading } = useListings();
  const [tab, setTab] = useState("gear");
  const [filter, setFilter] = useState("all");
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [notified, setNotified] = useState(false);
  const s = q.toLowerCase();

  const shown = listings.filter((l) =>
    (filter === "all" || l.type === filter) &&
    (cat === "All" || l.category === cat) &&
    (l.title || "").toLowerCase().includes(s));

  return (
    <div className="px-4 pt-1 pb-6 min-h-full bg-white">
      <h1 className="text-center text-2xl font-extrabold text-brand-navy mb-4">Marketplace</h1>

      <div className="flex gap-2 mb-4 bg-brand-tint p-1 rounded-full">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
              tab === t.id ? "bg-brand-green text-white" : "text-brand-navy"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "gear" ? (
        <>
          <SearchBar placeholder="Search gear" value={q} onChange={setQ} showFilter={false} />

          <div className="flex gap-2 my-3">
            {TYPE_FILTERS.map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  filter === f.id ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar -mx-1 px-1">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition ${
                  cat === c ? "bg-brand-navy text-white" : "bg-brand-tint text-brand-navy"}`}>
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <GridSkeleton key={i} />)}</div>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center text-center mt-16 px-8">
              <span className="w-20 h-20 rounded-2xl bg-brand-navy text-brand-greenBright grid place-items-center mb-5">
                <Market className="w-10 h-10" />
              </span>
              <h2 className="text-lg font-extrabold text-brand-navy mb-1">{q || cat !== "All" ? "No gear found" : "No gear listed yet"}</h2>
              <p className="text-muted text-sm">{q || cat !== "All" ? "Try a different search or category." : "Tap + to list your first piece of gear."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {shown.map((l) => (
                <button key={l.id} onClick={() => nav(`/listing/${l.id}`)}
                  className="text-left bg-white rounded-2xl shadow-card overflow-hidden">
                  <div className="aspect-square bg-brand-tint">
                    {l.photos?.[0]
                      ? <img src={l.photos[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full grid place-items-center text-brand-navy/40"><Market className="w-8 h-8" /></div>}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-navy">${l.price}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-tint text-brand-navy">
                        {l.type === "rent" ? "Rent" : "Sale"}
                      </span>
                    </div>
                    <p className="text-ink text-[13px] mt-0.5 truncate">{l.title}</p>
                    {l.category ? <p className="text-muted text-[11px] mt-0.5 truncate">{l.category}</p> : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="rounded-2xl bg-brand-navy text-white p-4 mb-4">
            <p className="font-extrabold text-brand-greenBright">Official ROAMR Gear</p>
            <p className="text-white/80 text-[13px] mt-1">Our first drop is coming soon. Get on the list and we'll let you know the moment it's live.</p>
            <button onClick={() => setNotified(true)} disabled={notified}
              className={`mt-3 w-full rounded-xl py-3 font-semibold transition ${notified ? "bg-white/20 text-white" : "bg-brand-green hover:bg-brand-greenDark text-white"}`}>
              {notified ? "You're on the list ✓" : "Notify me at drop"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {APPAREL.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="aspect-square bg-brand-tint grid place-items-center relative">
                  <span className="text-brand-navy/30 text-2xl font-extrabold tracking-tight">ROAMR</span>
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-greenBright text-brand-navy">
                    Coming Soon
                  </span>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-navy">${a.price}</span>
                  </div>
                  <p className="text-ink text-[13px] mt-0.5 truncate font-medium">{a.name}</p>
                  <p className="text-muted text-[11px] mt-0.5 truncate">{a.blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
