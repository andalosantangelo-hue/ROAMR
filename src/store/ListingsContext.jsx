import { createContext, useContext, useEffect, useState } from "react";
import {
  collection, addDoc, updateDoc, doc, onSnapshot, query, where, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase.js";
import { tapSuccess } from "../lib/haptics.js";
import { compressImage } from "../lib/image.js";
import { track } from "../lib/analytics.js";
import { useAuth } from "./AuthContext.jsx";

const ListingsContext = createContext(null);

export function ListingsProvider({ children }) {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "listings"), where("status", "==", "active"), orderBy("createdAt", "desc"), limit(30));
    return onSnapshot(q, (snap) => { setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (e) => { console.warn("listings:", e.message); setLoading(false); });
  }, []);

  const addListing = async ({ title, description, price, type, category = "Other", files }) => {
    if (!user) return null;
    const docRef = await addDoc(collection(db, "listings"), {
      sellerId: user.uid,
      sellerName: profile?.displayName || user.displayName || (user.email ? user.email.split("@")[0] : "Explorer"),
      title, description: description || "", price: Number(price) || 0, currency: "USD",
      type, category: category || "Other", photos: [], status: "active", createdAt: serverTimestamp(),
    });
    const urls = [];
    for (const f of files || []) {
      const up = await compressImage(f);
      const snap = await uploadBytes(ref(storage, `listings/${user.uid}/${docRef.id}/${Date.now()}-${up.name}`), up);
      urls.push(await getDownloadURL(snap.ref));
    }
    if (urls.length) await updateDoc(docRef, { photos: urls });
    tapSuccess();
    track("create_success", { type: "listing" });
    return docRef.id;
  };

  const setStatus = async (id, status) => {
    await updateDoc(doc(db, "listings", id), { status });
  };

  return (
    <ListingsContext.Provider value={{ listings, loading, addListing, setStatus }}>
      {children}
    </ListingsContext.Provider>
  );
}

export const useListings = () => useContext(ListingsContext);
