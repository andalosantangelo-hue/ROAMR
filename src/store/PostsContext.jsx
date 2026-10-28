import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  collection, collectionGroup, addDoc, setDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, where, limit, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase.js";
import { tapLight, tapSuccess } from "../lib/haptics.js";
import { compressImage, writeOrQueue, requireOnlineForPhotos } from "../lib/image.js";
import { toggleSet, isDemoId } from "../lib/util.js";
import { track } from "../lib/analytics.js";
import { useAuth } from "./AuthContext.jsx";
import { posts as seed } from "../data/feed.js";

const PostsContext = createContext(null);

export function PostsProvider({ children }) {
  const { user, profile, blockedIds } = useAuth();
  const [remote, setRemote] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const pending = useRef(new Set()); // ids with a like/save write in flight (ignores double taps)

  // Re-subscribes whenever the signed-in user changes. Subscribing once at app start
  // meant a user who signed in (or signed up) during the session got a permission
  // error before auth and never retried — a brand-new user saw an empty feed until
  // they restarted the app.
  const uid = user?.uid;
  useEffect(() => {
    if (!uid) { setRemote([]); setLoading(false); return; }
    setLoading(true);
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(
      q,
      (snap) => { setRemote(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (err) => { console.warn("Firestore posts:", err.message); setLoading(false); }
    );
  }, [uid]);

  useEffect(() => {
    if (!uid) { setLikedIds(new Set()); setSavedIds(new Set()); return; }
    const ul = onSnapshot(
      query(collectionGroup(db, "likes"), where("uid", "==", uid)),
      (snap) => {
        const s = new Set();
        snap.forEach((d) => {
          const p = d.ref.parent.parent;            // .../{postId}/likes/{uid}
          if (p && p.parent.id === "posts") s.add(p.id); // ignore activity likes
        });
        setLikedIds(s);
      },
      (e) => console.warn("likes:", e.message)
    );
    const us = onSnapshot(
      collection(db, "users", uid, "saves"),
      (snap) => setSavedIds(new Set(snap.docs.map((d) => d.id))),
      (e) => console.warn("saves:", e.message)
    );
    return () => { ul(); us(); };
  }, [uid]);

  const base = remote.length ? remote : (import.meta.env.DEV ? seed : []);
  const posts = base.filter((p) => !blockedIds.has(p.authorId));

  const addPost = async ({ title, location, rating, file }) => {
    if (!user) return;
    requireOnlineForPhotos(!!file);
    let photo = null;
    if (file) {
      const up = await compressImage(file);
      const snap = await uploadBytes(ref(storage, `posts/${user.uid}/${Date.now()}-${up.name}`), up);
      photo = await getDownloadURL(snap.ref);
    }
    await writeOrQueue(addDoc(collection(db, "posts"), {
      authorId: user.uid,
      authorName: (profile?.displayName || user.displayName || (user.email ? user.email.split("@")[0] : "Explorer")).slice(0, 40),
      authorPhotoURL: profile?.photoURL || user.photoURL || null,
      title, location: location || "", photo, rating: rating || 0,
      likeCount: 0, commentCount: 0, createdAt: serverTimestamp(),
    }));
    tapSuccess();
    track("create_success", { type: "post" });
  };

  // Writes for ANY real post. The old "is it in the latest 20?" check skipped the
  // write for older posts (e.g. liked from someone's profile) while the heart still
  // filled — the like silently vanished on reload. Only demo items are skipped now.
  const toggleLike = async (post) => {
    if (!user) return;
    const id = post.id;
    if (pending.current.has(`like:${id}`)) return;
    const was = likedIds.has(id);
    tapLight();
    setLikedIds((prev) => toggleSet(prev, id));
    if (isDemoId(id)) return;
    pending.current.add(`like:${id}`);
    try {
      const lref = doc(db, "posts", id, "likes", user.uid);
      if (was) { await deleteDoc(lref); }            // likeCount maintained by Cloud Function
      else { await setDoc(lref, { uid: user.uid, createdAt: serverTimestamp() }); track("post_like"); }
    } catch (e) {
      setLikedIds((prev) => toggleSet(prev, id));
      console.warn("like:", e.message);
    } finally { pending.current.delete(`like:${id}`); }
  };

  // Shared by posts and activities (collectionName says which). Saves are keyed by
  // "<collection>_<id>" so a post and an activity with the same id can't collide.
  const toggleSave = async (item, collectionName = "posts") => {
    if (!user) return;
    const key = collectionName === "posts" ? item.id : `${collectionName}_${item.id}`;
    if (pending.current.has(`save:${key}`)) return;
    const was = savedIds.has(key);
    tapLight();
    setSavedIds((prev) => toggleSet(prev, key));
    if (isDemoId(item.id)) return;
    pending.current.add(`save:${key}`);
    try {
      const sref = doc(db, "users", user.uid, "saves", key);
      if (was) await deleteDoc(sref);
      else await setDoc(sref, { postId: item.id, collection: collectionName, createdAt: serverTimestamp() });
    } catch (e) {
      setSavedIds((prev) => toggleSet(prev, key));
      console.warn("save:", e.message);
    } finally { pending.current.delete(`save:${key}`); }
  };
  const isSaved = (item, collectionName = "posts") =>
    savedIds.has(collectionName === "posts" ? item.id : `${collectionName}_${item.id}`);

  return (
    <PostsContext.Provider value={{ posts, loading, likedIds, savedIds, isSaved, addPost, toggleLike, toggleSave }}>
      {children}
    </PostsContext.Provider>
  );
}

export const usePosts = () => useContext(PostsContext);
