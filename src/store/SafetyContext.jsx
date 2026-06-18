import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  collection, doc, addDoc, setDoc, deleteDoc, updateDoc, onSnapshot,
  query, where, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase.js";
import { compressImage } from "../lib/image.js";
import { overallOf } from "../lib/safety.js";
import { tapSuccess } from "../lib/haptics.js";
import { track } from "../lib/analytics.js";
import { useAuth } from "./AuthContext.jsx";

const SafetyContext = createContext(null);

const tryLocate = () => new Promise((res) => {
  if (!navigator.geolocation) return res(null);
  navigator.geolocation.getCurrentPosition(
    (p) => res({ lat: Math.round(p.coords.latitude * 1e5) / 1e5, lng: Math.round(p.coords.longitude * 1e5) / 1e5, at: Date.now() }),
    () => res(null), { timeout: 8000, maximumAge: 60000 }
  );
});

export function SafetyProvider({ children }) {
  const { user, profile } = useAuth();
  const [myTrips, setMyTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  useEffect(() => {
    if (!user) { setMyTrips([]); setLoadingTrips(false); return; }
    const q = query(collection(db, "tripPlans"), where("ownerId", "==", user.uid), orderBy("createdAt", "desc"), limit(30));
    return onSnapshot(q,
      (snap) => { setMyTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoadingTrips(false); },
      (e) => { console.warn("tripPlans:", e.message); setLoadingTrips(false); });
  }, [user]);

  const activeTrip = useMemo(() => myTrips.find((t) => t.status === "active" || t.status === "overdue"), [myTrips]);

  // ---- Verification ----
  const submitVerification = async (selfieFile) => {
    if (!user || !selfieFile) return;
    const up = await compressImage(selfieFile);
    const snap = await uploadBytes(ref(storage, `verifications/${user.uid}/${Date.now()}-selfie.jpg`), up);
    const selfie = await getDownloadURL(snap.ref);
    await setDoc(doc(db, "verifications", user.uid), { uid: user.uid, selfie, status: "pending", createdAt: serverTimestamp() });
    track("verify_submitted");
    tapSuccess();
  };

  // ---- Vouch / references ----
  const vouchFor = async (targetUid, text) => {
    if (!user || targetUid === user.uid) return;
    await setDoc(doc(db, "users", targetUid, "references", user.uid), {
      fromUid: user.uid,
      fromName: profile?.displayName || user.displayName || "An explorer",
      fromPhoto: profile?.photoURL || user.photoURL || "",
      text: (text || "").trim().slice(0, 600),
      createdAt: serverTimestamp(),
    });
    track("vouch"); tapSuccess();
  };
  const removeVouch = (targetUid) => user && deleteDoc(doc(db, "users", targetUid, "references", user.uid));

  // ---- Reviews ----
  const leaveReview = async (targetUid, ratings, text, tripId = null) => {
    if (!user || targetUid === user.uid) return;
    await setDoc(doc(db, "users", targetUid, "reviews", user.uid), {
      reviewerId: user.uid,
      reviewerName: profile?.displayName || user.displayName || "An explorer",
      reviewerPhoto: profile?.photoURL || user.photoURL || "",
      ratings, overall: overallOf(ratings),
      text: (text || "").trim().slice(0, 1000),
      tripId, visible: true, createdAt: serverTimestamp(),
    });
    track("review_left"); tapSuccess();
  };

  // ---- Trip plans ----
  const createTripPlan = async (plan) => {
    if (!user) return null;
    const docRef = await addDoc(collection(db, "tripPlans"), {
      ownerId: user.uid,
      ownerName: profile?.displayName || user.displayName || "Explorer",
      objective: (plan.objective || "").trim(),
      activity: plan.activity || "",
      area: (plan.area || "").trim(),
      startAt: plan.startAt || null,
      expectedReturnAt: plan.expectedReturnAt || null,
      partners: plan.partners || [],
      emergencyContact: plan.emergencyContact || null,
      shareMedical: !!plan.shareMedical,
      medical: plan.shareMedical ? (plan.medical || null) : null,
      lastKnownLocation: null,
      status: "planned",
      checkedInAt: null,
      escalatedAt: null,
      graceMins: plan.graceMins || 60,
      createdAt: serverTimestamp(),
    });
    track("trip_plan_created"); tapSuccess();
    return docRef.id;
  };
  const startTrip = async (id) => {
    const loc = await tryLocate();
    await updateDoc(doc(db, "tripPlans", id), { status: "active", lastKnownLocation: loc, checkedInAt: null });
    track("trip_started");
  };
  const checkInSafe = async (id) => {
    await updateDoc(doc(db, "tripPlans", id), { status: "safe", checkedInAt: serverTimestamp() });
    track("trip_checkin"); tapSuccess();
  };
  const cancelTrip = (id) => updateDoc(doc(db, "tripPlans", id), { status: "cancelled" });

  return (
    <SafetyContext.Provider value={{
      myTrips, loadingTrips, activeTrip,
      submitVerification, vouchFor, removeVouch, leaveReview,
      createTripPlan, startTrip, checkInSafe, cancelTrip,
    }}>
      {children}
    </SafetyContext.Provider>
  );
}

export const useSafety = () => useContext(SafetyContext);
