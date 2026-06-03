import { useState } from "react";
import SearchBar from "../components/SearchBar.jsx";
import TribeCard from "../components/TribeCard.jsx";
import { RowSkeleton } from "../components/Skeleton.jsx";
import { useTribes } from "../store/TribesContext.jsx";

export default function Tribes() {
  const { tribes, loading } = useTribes();
  const [q, setQ] = useState("");
  const filtered = tribes.filter((t) => (t.name || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="px-4 pt-1 pb-6">
      <h1 className="text-center text-2xl font-extrabold text-brand-navy mb-4">Tribes</h1>
      <SearchBar placeholder="Search tribes" value={q} onChange={setQ} />
      <div className="space-y-3 mt-4">
        {loading ? (
          [0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted text-sm mt-12">No tribes match “{q}”.</p>
        ) : filtered.map((t) => <TribeCard key={t.id} tribe={t} />)}
      </div>
    </div>
  );
}
