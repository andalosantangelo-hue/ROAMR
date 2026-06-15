import { useState } from "react";
import SearchBar from "../components/SearchBar.jsx";
import FilterSheet from "../components/FilterSheet.jsx";
import ActivityCard from "../components/ActivityCard.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import { useActivities } from "../store/ActivitiesContext.jsx";

const SKILL_SECTION = [{
  key: "skill", title: "Skill level",
  options: [{ id: "Beginner", label: "Beginner" }, { id: "Intermediate", label: "Intermediate" }, { id: "Advanced", label: "Advanced" }],
}];

export default function Activities() {
  const { activities, loading } = useActivities();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState({ location: "", skill: null });
  const [sheet, setSheet] = useState(false);
  const s = q.toLowerCase();
  const loc = (filter.location || "").toLowerCase();
  const active = !!(filter.location || filter.skill);

  const filtered = activities.filter((a) =>
    ((a.text || "").toLowerCase().includes(s) || (a.user || a.authorName || "").toLowerCase().includes(s)) &&
    (!filter.skill || a.skillLevel === filter.skill) &&
    (!loc || (a.location || "").toLowerCase().includes(loc)));

  return (
    <div className="px-4 pt-1 pb-6">
      <h1 className="text-center text-2xl font-extrabold text-brand-navy mb-4">Activities</h1>
      <SearchBar placeholder="Search activities" value={q} onChange={setQ}
        onFilter={() => setSheet(true)} filterActive={active} />
      <div className="space-y-4 mt-4">
        {loading ? (
          [0, 1, 2].map((i) => <PostSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          (q || active) ? <p className="text-center text-muted text-sm mt-12">No activities match your filters.</p>
            : <div className="text-center text-muted mt-16 px-8"><p className="font-semibold text-brand-navy text-lg mb-1">Nothing planned</p><p className="text-sm">Tap + to propose an adventure.</p></div>
        ) : filtered.map((a) => <ActivityCard key={a.id} item={a} />)}
      </div>

      <FilterSheet open={sheet} onClose={() => setSheet(false)} sections={SKILL_SECTION}
        value={filter} onApply={setFilter} />
    </div>
  );
}
