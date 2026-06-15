import { useState } from "react";
import SearchBar from "../components/SearchBar.jsx";
import FilterSheet from "../components/FilterSheet.jsx";
import TribeCard from "../components/TribeCard.jsx";
import { RowSkeleton } from "../components/Skeleton.jsx";
import { useTribes } from "../store/TribesContext.jsx";

const CAT_SECTION = [{
  key: "cat", title: "Activity",
  options: [
    { id: "outdoor", label: "Outdoor" }, { id: "water", label: "Water" }, { id: "wheel", label: "Wheels" },
    { id: "nature", label: "Nature" }, { id: "snow", label: "Snow" },
  ],
}];

export default function Tribes() {
  const { tribes, loading } = useTribes();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState({ location: "", cat: null });
  const [sheet, setSheet] = useState(false);
  const loc = (filter.location || "").toLowerCase();
  const active = !!(filter.location || filter.cat);

  const filtered = tribes.filter((t) =>
    (t.name || "").toLowerCase().includes(q.toLowerCase()) &&
    (!filter.cat || (Array.isArray(t.categories) ? t.categories.includes(filter.cat) : t.category === filter.cat)) &&
    (!loc || (t.location || "").toLowerCase().includes(loc)));

  return (
    <div className="px-4 pt-1 pb-6">
      <h1 className="text-center text-2xl font-extrabold text-brand-navy mb-4">Tribes</h1>
      <SearchBar placeholder="Search tribes" value={q} onChange={setQ}
        onFilter={() => setSheet(true)} filterActive={active} />
      <div className="space-y-3 mt-4">
        {loading ? (
          [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted text-sm mt-12">No tribes match your filters.</p>
        ) : filtered.map((t) => <TribeCard key={t.id} tribe={t} />)}
      </div>

      <FilterSheet open={sheet} onClose={() => setSheet(false)} sections={CAT_SECTION}
        value={filter} onApply={setFilter} />
    </div>
  );
}
