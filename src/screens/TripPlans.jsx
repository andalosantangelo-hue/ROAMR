import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSafety } from "../store/SafetyContext.jsx";
import { TRIP_STATUS } from "../lib/safety.js";
import StatusBar from "../components/StatusBar.jsx";
import { Plus } from "../components/Icons.jsx";
import { SkeletonRegion, TripCardSkeleton } from "../components/skeletons";

const fmt = (ts) => {
  const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
  return d ? d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
};

export default function TripPlans() {
  const nav = useNavigate();
  const { myTrips, loadingTrips, startTrip, checkInSafe, cancelTrip } = useSafety();
  const [busyId, setBusyId] = useState(null);
  const [tripError, setTripError] = useState(null);
  // Start can wait up to 8s for GPS; without a busy state people tapped again, and
  // failures were unhandled with no feedback.
  const run = async (id, action) => {
    if (busyId) return;
    setBusyId(id); setTripError(null);
    try { await action(id); }
    catch { setTripError({ id, msg: "That didn't go through. Check your connection and try again." }); }
    finally { setBusyId(null); }
  };

  return (
    <div className="h-full flex flex-col bg-brand-tint/40">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy flex-1">Trip plans</h1>
        <button onClick={() => nav("/safety/new-trip")} aria-label="New trip" className="w-9 h-9 rounded-full bg-brand-green text-white grid place-items-center"><Plus className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-3">
        {loadingTrips ? (
          <SkeletonRegion label="Loading trip plans" className="space-y-3">
            {[0, 1].map((i) => <TripCardSkeleton key={i} />)}
          </SkeletonRegion>
        )
          : myTrips.length === 0 ? (
            <div className="text-center mt-16 px-8">
              <p className="font-extrabold text-brand-navy text-lg mb-1">No trip plans yet</p>
              <p className="text-muted text-sm mb-4">Log a plan before you head out — share it with an emergency contact and check in when you're back.</p>
              <button onClick={() => nav("/safety/new-trip")} className="rounded-xl bg-brand-green text-white font-semibold px-5 py-3">Create a trip plan</button>
            </div>
          ) : myTrips.map((t) => {
            const st = TRIP_STATUS[t.status] || TRIP_STATUS.planned;
            return (
              <div key={t.id} className="rounded-2xl bg-white shadow-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-brand-navy leading-tight">{t.objective || "Trip"}</p>
                    {t.area && <p className="text-muted text-[13px] mt-0.5 truncate">{t.area}</p>}
                  </div>
                  <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                </div>
                <div className="flex gap-4 mt-2 text-[12px] text-ink/70">
                  {t.startAt && <span>Start {fmt(t.startAt)}</span>}
                  {t.expectedReturnAt && <span>Back by {fmt(t.expectedReturnAt)}</span>}
                </div>
                {t.emergencyContact?.name && <p className="text-[12px] text-ink/60 mt-1">Contact: {t.emergencyContact.name}</p>}
                {tripError?.id === t.id && <p role="alert" className="text-red-600 text-[13px] mt-2">{tripError.msg}</p>}

                {t.status === "planned" && (
                  <div className="flex gap-2 mt-3">
                    <button disabled={busyId === t.id} onClick={() => run(t.id, startTrip)} className="flex-1 rounded-xl bg-brand-green text-white font-semibold py-2.5 text-sm disabled:opacity-60">{busyId === t.id ? "Starting…" : "Start trip"}</button>
                    <button disabled={busyId === t.id} onClick={() => run(t.id, cancelTrip)} className="rounded-xl bg-brand-tint text-brand-navy font-semibold py-2.5 px-4 text-sm disabled:opacity-60">Cancel</button>
                  </div>
                )}
                {(t.status === "active" || t.status === "overdue") && (
                  <div className="mt-3">
                    {t.status === "overdue" && <p className="text-red-600 text-[13px] font-semibold mb-2">You're past your return time. Check in now so your partners know you're safe.</p>}
                    <button disabled={busyId === t.id} onClick={() => run(t.id, checkInSafe)} className="w-full rounded-xl bg-brand-green text-white font-semibold py-2.5 text-sm disabled:opacity-60">✓ Check in — I'm back safe</button>
                  </div>
                )}
              </div>
            );
          })}
        <p className="text-muted text-[12px] text-center px-6 pt-2">The overdue alert runs on our servers. It activates once the backend is deployed.</p>
      </div>
    </div>
  );
}
