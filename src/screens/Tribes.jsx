import { useState } from "react";
import SearchBar from "../components/SearchBar.jsx";
import FilterSheet from "../components/FilterSheet.jsx";
import TribeCard from "../components/TribeCard.jsx";
import { SkeletonRegion, TribeCardSkeleton } from "../components/skeletons";
import { useTribes } from "../store/TribesContext.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { useFeedScope } from "../store/FeedScopeContext.jsx";
import { applyScope, feedCtx } from "../lib/feed.js";
import EmptyState from "../components/EmptyState.jsx";
import { Tribes as TribesIcon, Search as SearchIcon } from "../components/Icons.jsx";

const CAT_SECTION = [{
  key: "cat", title: "Activity",
  options: [
    { id: "outdoor", label: "Outdoor" }, { id: "water", label: "Water" }, { id: "wheel", label: "Wheels" },
    { id: "nature", label: "Nature" }, { id: "snow", label: "Snow" },
  ],
}];

const SCOPE_EMPTY = {
  following: { title: "No tribes from people you follow", body: "Follow more explorers, or browse every tribe." },
  nearby: { title: "No tribes near you yet", body: "Start one for your area and invite the people you ride, climb or paddle with." },
};

export default function Tribes() {
  const { tribes, loading } = useTribes();
  const { user, profile, followingIds } = useAuth();
  const { scope, setScope } = useFeedScope();
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
          <SkeletonRegion label="Loading tribes" className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => <TribeCardSkeleton key={i} />)}
          </SkeletonRegion>
        ) : filtered.length === 0 ? (
          (q || active)
            ? <EmptyState Icon={SearchIcon} className="mt-12" title="No matches"
                body="Try a different search or clear your filters."
                actions={[{ label: "Clear filters", onClick: () => { setQ(""); setFilter({ location: "", cat: null }); } }]} />
            : SCOPE_EMPTY[scope]
              ? <EmptyState Icon={TribesIcon} className="mt-12" {...SCOPE_EMPTY[scope]}
                  actions={scope === "following"
                    ? [{ label: "Show all tribes", onClick: () => setScope("foryou") }]
                    : [{ label: "Start a tribe", to: "/create-tribe" }, { label: "Show all tribes", onClick: () => setScope("foryou") }]} />
              : <EmptyState Icon={TribesIcon} className="mt-12" title="No tribes yet"
                  body="Start the first one: a crew for your sport, your spot or your skill level."
                  actions={[{ label: "Start a tribe", to: "/create-tribe" }]} />
        ) : filtered.map((t) => <TribeCard key={t.id} tribe={t} />)}
      </div>

      <FilterSheet open={sheet} onClose={() => setSheet(false)} sections={CAT_SECTION}
        value={filter} onApply={setFilter} />
    </div>
  );
}
