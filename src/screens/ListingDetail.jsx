import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import { useListings } from "../store/ListingsContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import { Market } from "../components/Icons.jsx";

const STATUSES = ["active", "reserved", "sold"];

export default function ListingDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { setStatus } = useListings();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, "listings", id))
      .then((s) => setListing(s.exists() ? { id: s.id, ...s.data() } : null))
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = listing && user && listing.sellerId === user.uid;
  const changeStatus = async (st) => {
    const prev = listing.status;
    setListing((l) => ({ ...l, status: st }));
    try { await setStatus(id, st); } catch { setListing((l) => ({ ...l, status: prev })); }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Listing</h1>
      </div>

      {loading ? (
        <div className="flex-1 grid place-items-center text-muted">Loading…</div>
      ) : !listing ? (
        <div className="flex-1 grid place-items-center text-muted">Listing not found.</div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x px-4">
              {(listing.photos?.length ? listing.photos : [null]).map((p, i) => (
                <div key={i} className="snap-center shrink-0 w-[88%] aspect-square rounded-2xl bg-brand-tint overflow-hidden">
                  {p ? <img src={p} alt="" className="w-full h-full object-cover" />
                     : <div className="w-full h-full grid place-items-center text-brand-navy/40"><Market className="w-10 h-10" /></div>}
                </div>
              ))}
            </div>

            <div className="px-5 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold text-brand-navy">${listing.price}</span>
                <span className="text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-brand-tint text-brand-navy">
                  {listing.type === "rent" ? "For rent" : "For sale"}
                </span>
              </div>
              <h2 className="text-lg font-bold text-ink mt-2">{listing.title}</h2>
              {listing.status !== "active" && (
                <span className="inline-block mt-1 text-sm font-semibold text-amber-600 capitalize">{listing.status}</span>
              )}
              <p className="text-muted text-sm mt-1">Listed by {listing.sellerName}</p>
              {listing.description && <p className="text-ink text-[15px] mt-4 leading-relaxed">{listing.description}</p>}

              {isOwner && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-ink/80 mb-2">Status</p>
                  <div className="flex rounded-xl border border-black/10 overflow-hidden">
                    {STATUSES.map((st) => (
                      <button key={st} onClick={() => changeStatus(st)}
                        className={`flex-1 py-3 text-sm font-semibold capitalize ${listing.status === st ? "bg-brand-green text-white" : "bg-white text-ink"}`}>
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isOwner && (
            <div className="px-5 pb-7 pt-3">
              <button onClick={() => listing.sellerId && nav(`/u/${listing.sellerId}`)}
                className="w-full rounded-xl bg-brand-green hover:bg-brand-greenDark transition text-white font-semibold py-4">
                View seller profile
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
