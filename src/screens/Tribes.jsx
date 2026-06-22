import { useState } from "react";
import SearchBar from "../components/SearchBar.jsx";
import FilterSheet from "../components/FilterSheet.jsx";
import TribeCard from "../components/TribeCard.jsx";
import { RowSkeleton } from "../components/Skeleton.jsx";
import { useTribes } from "../store/TribesContext.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { useFeedScope } from "../store/FeedScopeContext.jsx";
import { applyScope, feedCtx } from "../lib/feed.js";

const CAT_SECTION = [{
  key: "cat", title: "Activity",
  options: [
    { id: "outdoor", label: "Outdoor" }, { id: "water", label: "Water" }, { id: "wheel", label: "Wheels" },
    { id: "nature", label: "Nature" }, { id: "snow", label: "Snow" },
  ],
}];

const SCOPE_EMPTY = {
  following: "No tribes from people you follow yet.",
  nearby: "No tribes near your home base yet.",
};

export default function Tribes() {
  const { tribes, loading } = useTribes();
  const { user, profile, followingIds } = useAuth();
  const { scope } = useFeedScope();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState({ location: "", cat: null });
  const [sheet, setSheet] = useState(false);
  const loc = (filter.location || "").toLowerCase();
  const active = !!(filter.location || filter.cat);

  const ctx = feedCtx(profile, followingIds, user?.uid);
  const scoped = applyScope(tribes, scope, ctx);
  const filtered = scoped.filter((t) =>
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
          <p className="text-center text-muted text-sm mt-12">
            {(q || active) ? "No tribes match your filters." : (SCOPE_EMPTY[scope] || "No tribes yet.")}
          </p>
        ) : filtered.map((t) => <TribeCard key={t.id} tribe={t} />)}
      </div>

      <FilterSheet open={sheet} onClose={() => setSheet(false)} sections={CAT_SECTION}
        value={filter} onApply={setFilter} />
    </div>
  );
}
