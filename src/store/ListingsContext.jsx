import { createContext, useContext, useEffect, useState } from "react";
import {
  collection, setDoc, updateDoc, doc, onSnapshot, query, where, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase.js";
import { tapSuccess } from "../lib/haptics.js";
import { compressImage, requireOnlineForPhotos } from "../lib/image.js";
import { track } from "../lib/analytics.js";
import { useAuth } from "./AuthContext.jsx";

const ListingsContext = createContext(null);

export function ListingsProvider({ children }) {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Re-subscribes when the signed-in user changes (see PostsContext for why).
  const uid = user?.uid;
  useEffect(() => {
    if (!uid) { setListings([]); setLoading(false); return; }
    setLoading(true);
    const q = query(collection(db, "listings"), where("status", "==", "active"), orderBy("createdAt", "desc"), limit(30));
    return onSnapshot(q, (snap) => { setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (e) => { console.warn("listings:", e.message); setLoading(false); });
  }, [uid]);

  // The seller's own listings in every status — marking one "reserved" used to make it
  // vanish from the marketplace with no way back to it.
  useEffect(() => {
    if (!uid) { setMyListings([]); return; }
    const q = query(collection(db, "listings"), where("sellerId", "==", uid), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(q, (snap) => setMyListings(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.warn("my listings:", e.message));
  }, [uid]);

  // Photos upload first (under a pre-generated id); the listing is written once, after.
  // Creating it first meant a failed upload left a photo-less listing live, and the
  // user's retry created a duplicate.
  const addListing = async ({ title, description, price, type, category = "Other", files }) => {
    if (!user) return null;
    requireOnlineForPhotos((files || []).length > 0);
    const docRef = doc(collection(db, "listings"));
    const urls = [];
    for (const f of files || []) {
      const up = await compressImage(f);
      const snap = await uploadBytes(ref(storage, `listings/${user.uid}/${docRef.id}/${Date.now()}-${up.name}`), up);
      urls.push(await getDownloadURL(snap.ref));
    }
    await setDoc(docRef, {
      sellerId: user.uid,
      sellerName: (profile?.displayName || user.displayName || (user.email ? user.email.split("@")[0] : "Explorer")).slice(0, 40),
      title, description: description || "", price: Number(price) || 0, currency: "USD",
      type, category: category || "Other", photos: urls.slice(0, 6), status: "active", createdAt: serverTimestamp(),
    });
    tapSuccess();
    track("create_success", { type: "listing" });
    return docRef.id;
  };

  const setStatus = async (id, status) => {
    await updateDoc(doc(db, "listings", id), { status });
  };

  return (
    <ListingsContext.Provider value={{ listings, myListings, loading, addListing, setStatus }}>
      {children}
    </ListingsContext.Provider>
  );
}

export const useListings = () => useContext(ListingsContext);
