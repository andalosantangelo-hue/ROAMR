import { createContext, useContext, useEffect, useState } from "react";
import {
  collection, collectionGroup, addDoc, setDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, where, limit, serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { tapLight, tapSuccess } from "../lib/haptics.js";
import { uploadMedia } from "../lib/media.js";
import { toggleSet } from "../lib/util.js";
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
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const retry = () => { setLoading(true); setError(null); setAttempt((n) => n + 1); };

  useEffect(() => {
    // Rules require sign-in to read; (re)subscribe once auth resolves / user changes.
    if (!user) return undefined;
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(
      q,
      (snap) => { setRemote(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setError(null); setLoading(false); },
      (err) => { console.warn("Firestore posts:", err.message); setError(err); setLoading(false); }
    );
  }, [user?.uid, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) { setLikedIds(new Set()); setSavedIds(new Set()); return; }
    const ul = onSnapshot(
      query(collectionGroup(db, "likes"), where("uid", "==", user.uid)),
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
      collection(db, "users", user.uid, "saves"),
      (snap) => setSavedIds(new Set(snap.docs.map((d) => d.id))),
      (e) => console.warn("saves:", e.message)
    );
    return () => { ul(); us(); };
  }, [user]);

  const base = remote.length ? remote : (import.meta.env.DEV ? seed : []);
  const posts = base.filter((p) => !blockedIds.has(p.authorId));

  const addPost = async ({ title, body = "", location, geo = null, rating, media = [], file, onProgress }) => {
    if (!user) return;
    // Legacy single-photo callers still work.
    const items = media.length ? media : (file ? [{ kind: "image", file, url: URL.createObjectURL(file) }] : []);
    const uploaded = items.length ? await uploadMedia(user.uid, items, onProgress) : [];
    const cover = uploaded.find((m) => m.type === "image" && !m.is360) || uploaded.find((m) => m.poster) || uploaded.find((m) => m.type === "image");
    await addDoc(collection(db, "posts"), {
      authorId: user.uid,
      authorName: profile?.displayName || user.displayName || (user.email ? user.email.split("@")[0] : "Explorer"),
      authorPhotoURL: profile?.photoURL || user.photoURL || null,
      title, body: body || "", location: location || "", geo: geo || null,
      photo: cover ? (cover.poster || cover.url) : null, media: uploaded, rating: rating || 0,
      likeCount: 0, commentCount: 0, createdAt: serverTimestamp(),
    });
    tapSuccess();
    track("create_success", { type: "post", media: uploaded.length });
  };

  const toggleLike = async (post) => {
    if (!user) return;
    const id = post.id;
    const isRemote = remote.some((p) => p.id === id);
    const was = likedIds.has(id);
    tapLight();
    setLikedIds((prev) => toggleSet(prev, id));
    if (!isRemote) return;
    try {
      const lref = doc(db, "posts", id, "likes", user.uid);
      if (was) { await deleteDoc(lref); }            // likeCount maintained by Cloud Function
      else { await setDoc(lref, { uid: user.uid, createdAt: serverTimestamp() }); track("post_like"); }
    } catch (e) {
      setLikedIds((prev) => toggleSet(prev, id));
      console.warn("like:", e.message);
    }
  };

  const toggleSave = async (post, collectionName = "posts") => {
    if (!user) return;
    const id = post.id;
    const isRemote = remote.some((p) => p.id === id);
    const was = savedIds.has(id);
    tapLight();
    setSavedIds((prev) => toggleSet(prev, id));
    if (!isRemote) return;
    try {
      const sref = doc(db, "users", user.uid, "saves", id);
      if (was) await deleteDoc(sref);
      else await setDoc(sref, { postId: id, collection: collectionName, createdAt: serverTimestamp() });
    } catch (e) {
      setSavedIds((prev) => toggleSet(prev, id));
      console.warn("save:", e.message);
    }
  };

  return (
    <PostsContext.Provider value={{ posts, loading, error, retry, likedIds, savedIds, addPost, toggleLike, toggleSave }}>
      {children}
    </PostsContext.Provider>
  );
}

export const usePosts = () => useContext(PostsContext);
