import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useListings } from "../store/ListingsContext.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { GridSkeleton } from "../components/Skeleton.jsx";
import { Market } from "../components/Icons.jsx";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "rent", label: "For rent" },
  { id: "sell", label: "For sale" },
];

export default function Marketplace() {
  const nav = useNavigate();
  const { listings, loading } = useListings();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const s = q.toLowerCase();
  const shown = listings.filter((l) =>
    (filter === "all" || l.type === filter) &&
    (l.title || "").toLowerCase().includes(s));

  return (
    <div className="px-4 pt-1 pb-6 min-h-full bg-white">
      <h1 className="text-center text-2xl font-extrabold text-brand-navy mb-4">Marketplace</h1>
      <SearchBar placeholder="Search gear" value={q} onChange={setQ} showFilter={false} />

      <div className="flex gap-2 my-4">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === f.id ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>
            {f.label}
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
          <h2 className="text-lg font-extrabold text-brand-navy mb-1">{q ? "No gear found" : "No gear listed yet"}</h2>
          <p className="text-muted text-sm">{q ? `Nothing matches “${q}”.` : "Tap + to list your first piece of gear."}</p>
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
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
