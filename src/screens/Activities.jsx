import { lazy, Suspense, useMemo, useState } from "react";
import SearchBar from "../components/SearchBar.jsx";
import FilterSheet from "../components/FilterSheet.jsx";
import ActivityCard from "../components/ActivityCard.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import { useActivities } from "../store/ActivitiesContext.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { useFeedScope } from "../store/FeedScopeContext.jsx";
import { applyScope, feedCtx, cityToken } from "../lib/feed.js";
import { milesBetween } from "../lib/geo.js";

const ActivitiesMap = lazy(() => import("../components/ActivitiesMap.jsx"));

const SKILL_SECTION = [{
  key: "skill", title: "Skill level",
  options: [{ id: "Beginner", label: "Beginner" }, { id: "Intermediate", label: "Intermediate" }, { id: "Advanced", label: "Advanced" }],
}];

const SCOPE_EMPTY = {
  following: "No activities from people you follow yet.",
  nearby: "No activities near your home base yet.",
};

function ListIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}
function MapIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" />
    </svg>
  );
}

export default function Activities() {
  const { activities, loading } = useActivities();
  const { user, profile, followingIds } = useAuth();
  const { scope } = useFeedScope();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState({ place: null, radius: null, skill: null });
  const [sheet, setSheet] = useState(false);
  const [view, setView] = useState("list"); // list | map
  const s = q.toLowerCase();
  const active = !!(filter.place || filter.skill);

  const filtered = useMemo(() => {
    const ctx = feedCtx(profile, followingIds, user?.uid);
    const scoped = applyScope(activities, scope, ctx);
    const center = filter.place?.lat != null ? filter.place : null;
    const token = cityToken(filter.place?.label || "");
    return scoped.filter((a) => {
      if (!((a.text || "").toLowerCase().includes(s) || (a.user || a.authorName || "").toLowerCase().includes(s))) return false;
      if (filter.skill && a.skillLevel !== filter.skill) return false;
      if (!filter.place) return true;
      // Distance when both sides have coordinates; otherwise fall back to a town-name match.
      if (center && filter.radius && a.geo?.lat != null) return milesBetween(center, a.geo) <= filter.radius;
      return !!token && (a.location || "").toLowerCase().includes(token);
    });
  }, [activities, scope, profile, followingIds, user?.uid, s, filter]);

  const empty = (q || active) ? <p className="text-center text-muted text-sm mt-12">No activities match your filters.</p>
    : SCOPE_EMPTY[scope] ? <p className="text-center text-muted text-sm mt-12">{SCOPE_EMPTY[scope]}</p>
      : <div className="text-center text-muted mt-16 px-8"><p className="font-semibold text-brand-navy text-lg mb-1">Nothing planned</p><p className="text-sm">Tap + to propose an adventure.</p></div>;

  return (
    <div className="px-4 pt-1 pb-6">
      <h1 className="text-center text-2xl font-extrabold text-brand-navy mb-4">Activities</h1>
      <SearchBar placeholder="Search activities" value={q} onChange={setQ}
        onFilter={() => setSheet(true)} filterActive={active} />

      <div className="flex items-center justify-between mt-3">
        <p className="text-[13px] text-muted truncate pr-2">
          {filter.place ? <>Near <span className="text-ink font-medium">{filter.place.label.split(",")[0]}</span>{filter.radius ? ` · ${filter.radius} mi` : ""}</> : `${filtered.length} ${filtered.length === 1 ? "activity" : "activities"}`}
        </p>
        <div role="tablist" aria-label="View" className="flex bg-white rounded-full p-1 shadow-card shrink-0">
          {[{ id: "list", Icon: ListIcon, label: "List" }, { id: "map", Icon: MapIcon, label: "Map" }].map(({ id, Icon, label }) => (
            <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
              className={`flex items-center gap-1.5 px-3.5 min-h-[36px] rounded-full text-[13px] font-semibold transition ${view === id ? "bg-brand-green text-white" : "text-brand-navy"}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {view === "map" ? (
        <div className="mt-3">
          <Suspense fallback={<div className="rounded-2xl bg-white shadow-card h-[360px] grid place-items-center text-muted text-sm">Loading map…</div>}>
            <ActivitiesMap items={filtered} center={filter.place?.lat != null ? filter.place : null} radiusMiles={filter.radius}
              onSearchArea={(c) => setFilter((f) => ({ ...f, place: { label: "Map area", ...c }, radius: f.radius || 25 }))} />
          </Suspense>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {loading ? [0, 1, 2].map((i) => <PostSkeleton key={i} />)
            : filtered.length === 0 ? empty
              : filtered.map((a) => <ActivityCard key={a.id} item={a} />)}
        </div>
      )}

      <FilterSheet open={sheet} onClose={() => setSheet(false)} sections={SKILL_SECTION}
        value={filter} onApply={setFilter} locationMode="place" onViewMap={() => setView("map")} />
    </div>
  );
}
