import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import { useMessages } from "../store/MessagesContext.jsx";
import { useSafety } from "../store/SafetyContext.jsx";
import * as P from "../lib/profile.js";
import { trustLabel, VERIFY_TIERS } from "../lib/safety.js";
import StatusBar from "../components/StatusBar.jsx";
import PostCard from "../components/PostCard.jsx";
import FollowButton from "../components/FollowButton.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import { Profile as UserIcon, Comment, Edit, Check, Star } from "../components/Icons.jsx";

const ACT = Object.fromEntries(P.ACTIVITIES.map((a) => [a.id, a.label]));

const Heading = ({ children }) => (
  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/55 mb-2">{children}</p>
);
const Vital = ({ label, value }) => value ? (
  <div className="rounded-xl bg-brand-tint px-3 py-2">
    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-navy/50">{label}</p>
    <p className="text-ink text-[14px] font-semibold leading-tight mt-0.5">{value}</p>
  </div>
) : null;
const ChipList = ({ items, dark }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((x) => (
      <span key={x} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${dark ? "bg-brand-navy text-white" : "bg-white border border-brand-green/30 text-brand-navy"}`}>{x}</span>
    ))}
  </div>
);
const PromptCard = ({ q, a }) => (
  <div className="rounded-2xl bg-white border border-black/5 shadow-card p-4">
    <p className="text-[12px] font-semibold text-brand-navy/55">{q}</p>
    <p className="text-ink text-[17px] font-medium leading-snug mt-1">{a}</p>
  </div>
);

export default function PublicProfile() {
  const { uid } = useParams();
  const nav = useNavigate();
  const { user, blockedIds, unblockUser } = useAuth();
  const { openThread } = useMessages();
  const { vouchFor, removeVouch } = useSafety();
  const [p, setP] = useState(null);
  const [loadingP, setLoadingP] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refs, setRefs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [opening, setOpening] = useState(false);
  const [vouchOpen, setVouchOpen] = useState(false);
  const [vouchText, setVouchText] = useState("");
  const isMe = user && user.uid === uid;
  const blocked = blockedIds?.has(uid);
  const iVouched = !!(user && refs.some((r) => r.id === user.uid));

  useEffect(() => {
    setLoadingP(true);
    getDoc(doc(db, "users", uid)).then((s) => setP(s.exists() ? s.data() : null)).catch(() => setP(null)).finally(() => setLoadingP(false));
  }, [uid]);
  useEffect(() => {
    const q = query(collection(db, "posts"), where("authorId", "==", uid), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(q, (snap) => { setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoadingPosts(false); },
      (e) => { console.warn("profile posts:", e.message); setLoadingPosts(false); });
  }, [uid]);
  useEffect(() => onSnapshot(collection(db, "users", uid, "references"),
    (snap) => setRefs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}), [uid]);
  useEffect(() => onSnapshot(query(collection(db, "users", uid, "reviews"), limit(20)),
    (snap) => setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.visible !== false)), () => {}), [uid]);

  const name = p?.displayName || (p?.email ? p.email.split("@")[0] : "Explorer");
  const photos = (p?.photos?.length ? p.photos : (p?.photoURL ? [p.photoURL] : []));
  const interests = Array.isArray(p?.interests) ? p.interests : [];
  const skills = p?.skillLevels || {};
  const exp = p?.experience || {};
  const prompts = Array.isArray(p?.prompts) ? p.prompts.filter((x) => x && x.a) : [];
  const extraPhotos = photos.slice(1);
  const arr = (v) => (Array.isArray(v) ? v : []);
  const bucket = arr(p?.bucketList);
  const trust = trustLabel(p?.ratingAvg, p?.ratingCount);

  const message = async () => {
    if (opening) return;
    setOpening(true);
    try { const tid = await openThread({ uid, name, photo: photos[0] || "" }); if (tid) nav(`/chat/${tid}`); }
    catch (e) { console.warn("openThread:", e.message); } finally { setOpening(false); }
  };
  const submitVouch = async () => {
    try { await vouchFor(uid, vouchText); setVouchOpen(false); setVouchText(""); } catch (e) { console.warn(e.message); }
  };

  const stream = [];
  const maxLen = Math.max(prompts.length, extraPhotos.length);
  for (let i = 0; i < maxLen; i++) {
    if (prompts[i]) stream.push({ t: "prompt", v: prompts[i], k: `p${i}` });
    if (extraPhotos[i]) stream.push({ t: "photo", v: extraPhotos[i], k: `ph${i}` });
  }
  const hasStyle = p?.intensity || p?.pace || p?.risk || p?.type2 || p?.planning || p?.fitness || p?.trainingFor || arr(p?.terrain).length || arr(p?.tripDuration).length;
  const hasLogistics = arr(p?.availability).length || arr(p?.seasons).length || p?.leadTime || p?.willTravel;
  const hasFit = arr(p?.lookingFor).length || arr(p?.partnerWants).length || arr(p?.dealbreakers).length;

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy truncate">{loadingP ? "Profile" : name}</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-2">
        <div className="relative">
          {photos[0] ? <img src={photos[0]} alt="" className="w-full aspect-square object-cover" />
            : <div className="w-full aspect-square bg-brand-navy grid place-items-center"><UserIcon className="w-24 h-24 text-brand-greenBright" /></div>}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute left-5 right-5 bottom-3 text-white">
            <h2 className="text-2xl font-extrabold drop-shadow flex items-center gap-2">
              {name}
              {p?.verified && <span className="w-6 h-6 rounded-full bg-brand-greenBright text-brand-navy grid place-items-center shrink-0" title="Verified"><Check className="w-4 h-4" /></span>}
            </h2>
            {p?.location && <p className="text-white/90 text-sm font-medium drop-shadow">{p.location}</p>}
          </div>
        </div>

        <div className="px-5 pt-4">
          {/* Trust strip */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] mb-3">
            {p?.verified && <span className="inline-flex items-center gap-1 text-brand-green font-semibold"><Check className="w-4 h-4" />{VERIFY_TIERS[p.verifiedTier] || "Verified"}</span>}
            {(p?.adventuresCompleted > 0) && <span className="text-ink/80 font-medium">✓ {p.adventuresCompleted} adventures</span>}
            <span className="inline-flex items-center gap-1 text-ink/80 font-medium"><Star className="w-4 h-4 text-brand-green" />{trust.isNew ? "New partner" : trust.text}</span>
            {(p?.vouchCount > 0) && <span className="text-ink/80 font-medium">👍 {p.vouchCount} vouches</span>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div><span className="font-bold text-brand-navy">{p?.followerCount ?? 0}</span> <span className="text-muted text-sm">followers</span></div>
              <div><span className="font-bold text-brand-navy">{p?.followingCount ?? 0}</span> <span className="text-muted text-sm">following</span></div>
            </div>
            {isMe ? (
              <button onClick={() => nav("/edit-profile")} className="rounded-full px-5 py-2 text-sm font-semibold bg-brand-tint text-brand-navy flex items-center gap-1.5"><Edit className="w-4 h-4" /> Edit</button>
            ) : blocked ? (
              <button onClick={() => unblockUser(uid)} className="rounded-full px-5 py-2 text-sm font-semibold bg-red-50 text-red-600 border border-red-200">Unblock</button>
            ) : (
              <div className="flex items-center gap-2">
                <FollowButton targetUid={uid} variant="pill" />
                <button onClick={message} disabled={opening} className="rounded-full px-5 py-2 text-sm font-semibold bg-brand-tint text-brand-navy flex items-center gap-1.5 active:scale-[0.98] transition"><Comment className="w-4 h-4" /> Message</button>
              </div>
            )}
          </div>

          {/* Vouch / review actions */}
          {!isMe && !blocked && user && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => (iVouched ? removeVouch(uid) : setVouchOpen((v) => !v))}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${iVouched ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>
                {iVouched ? "Vouched ✓" : "👍 Vouch"}
              </button>
              <button onClick={() => nav(`/review/${uid}`)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-brand-tint text-brand-navy">★ Review</button>
            </div>
          )}
          {vouchOpen && (
            <div className="mt-2 rounded-xl border border-black/10 p-3">
              <textarea value={vouchText} onChange={(e) => setVouchText(e.target.value)} rows={2} maxLength={600} placeholder={`Why do you vouch for ${name}?`}
                className="w-full rounded-lg bg-brand-tint px-3 py-2 text-[15px] outline-none resize-none placeholder:text-muted" />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setVouchOpen(false)} className="text-muted text-sm font-semibold px-3 py-1.5">Cancel</button>
                <button onClick={submitVouch} className="bg-brand-green text-white text-sm font-semibold rounded-lg px-4 py-1.5">Post vouch</button>
              </div>
            </div>
          )}

          {p?.bio && (
            <div className="mt-4 rounded-2xl bg-brand-tint p-4">
              <Heading>About me</Heading>
              <p className="text-ink/90 text-[15px] leading-relaxed">{p.bio}</p>
              {(arr(p?.languages).length > 0 || p?.pets) && (
                <p className="text-ink/70 text-[13px] mt-2">
                  {arr(p.languages).length > 0 && <>Speaks {p.languages.join(", ")}</>}
                  {arr(p.languages).length > 0 && p?.pets ? " · " : ""}
                  {p?.pets && P.labelOf(P.PETS, p.pets)}
                </p>
              )}
            </div>
          )}

          {interests.length > 0 && (
            <div className="mt-5">
              <Heading>Activities</Heading>
              <div className="space-y-2">
                {interests.map((i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-brand-tint px-3.5 py-2.5">
                    <span className="font-semibold text-brand-navy text-[14px]">{ACT[i] || i}</span>
                    <span className="text-[12px] text-ink/70 font-medium">
                      {skills[i] && <span className="text-brand-green font-bold">{skills[i]}</span>}
                      {skills[i] && exp[i] ? " · " : ""}{exp[i] || ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasStyle && (
            <div className="mt-5">
              <Heading>Outdoor style</Heading>
              <div className="grid grid-cols-2 gap-2">
                <Vital label="Intensity" value={P.labelOf(P.INTENSITY, p.intensity)} />
                <Vital label="Pace" value={P.labelOf(P.PACE, p.pace)} />
                <Vital label="Risk" value={P.labelOf(P.RISK, p.risk)} />
                <Vital label="Type 2 fun" value={P.labelOf(P.TYPE2, p.type2)} />
                <Vital label="Planning" value={P.labelOf(P.PLANNING, p.planning)} />
                <Vital label="Fitness" value={P.labelOf(P.FITNESS, p.fitness)} />
              </div>
              {p?.trainingFor && <p className="text-ink/80 text-[13px] mt-2">Training for: <span className="font-semibold">{p.trainingFor}</span></p>}
              {arr(p?.terrain).length > 0 && <div className="mt-3"><ChipList items={p.terrain} /></div>}
              {arr(p?.tripDuration).length > 0 && <div className="mt-2"><ChipList items={p.tripDuration} /></div>}
            </div>
          )}

          {hasLogistics && (
            <div className="mt-5">
              <Heading>Availability & travel</Heading>
              <div className="grid grid-cols-2 gap-2">
                <Vital label="Lead time" value={P.labelOf(P.LEAD_TIME, p.leadTime)} />
                <Vital label="Will travel" value={P.labelOf(P.TRAVEL, p.willTravel)} />
              </div>
              {arr(p?.availability).length > 0 && <div className="mt-2"><ChipList items={p.availability} /></div>}
              {arr(p?.seasons).length > 0 && <div className="mt-2"><ChipList items={p.seasons} /></div>}
            </div>
          )}

          {hasFit && (
            <div className="mt-5">
              <Heading>Looking for</Heading>
              {arr(p?.lookingFor).length > 0 && <ChipList items={p.lookingFor} dark />}
              {arr(p?.partnerWants).length > 0 && <div className="mt-2"><ChipList items={p.partnerWants} /></div>}
              {arr(p?.dealbreakers).length > 0 && <p className="text-muted text-[12px] mt-2">Not my vibe: {p.dealbreakers.join(", ")}</p>}
            </div>
          )}
        </div>

        {stream.length > 0 && (
          <div className="px-4 mt-5 space-y-3">
            {stream.map((s) => s.t === "prompt" ? <PromptCard key={s.k} q={s.v.q} a={s.v.a} /> : <img key={s.k} src={s.v} alt="" className="w-full rounded-2xl object-cover" />)}
          </div>
        )}

        {(arr(p?.certifications).length > 0 || arr(p?.gearShare).length > 0) && (
          <div className="px-5 mt-5 space-y-4">
            {arr(p?.certifications).length > 0 && (
              <div><Heading>Certified</Heading>
                <div className="flex flex-wrap gap-2">
                  {p.certifications.map((c) => <span key={c} className="px-3 py-1.5 rounded-full bg-brand-tint text-brand-navy text-[12px] font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5 text-brand-green" /> {c}</span>)}
                </div>
              </div>
            )}
            {arr(p?.gearShare).length > 0 && <div><Heading>Gear to share</Heading><ChipList items={p.gearShare} /></div>}
          </div>
        )}

        {(bucket.length > 0 || p?.recentTrips) && (
          <div className="px-5 mt-5 space-y-3">
            {bucket.length > 0 && <div><Heading>Bucket list</Heading><ul className="space-y-1.5">{bucket.map((b, i) => <li key={i} className="text-ink text-[14px] flex gap-2"><span className="text-brand-green">▸</span>{b}</li>)}</ul></div>}
            {p?.recentTrips && <div><Heading>Recent trips</Heading><p className="text-ink/90 text-[14px] leading-relaxed">{p.recentTrips}</p></div>}
          </div>
        )}

        {/* Vouches */}
        {refs.length > 0 && (
          <div className="px-5 mt-5">
            <Heading>Vouched for by {refs.length}</Heading>
            <div className="space-y-2">
              {refs.slice(0, 6).map((r) => (
                <div key={r.id} className="flex gap-3 rounded-xl bg-brand-tint p-3">
                  {r.fromPhoto ? <img src={r.fromPhoto} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" /> : <span className="w-9 h-9 rounded-full bg-brand-navy text-brand-greenBright grid place-items-center shrink-0"><UserIcon className="w-5 h-5" /></span>}
                  <div className="min-w-0"><p className="font-semibold text-brand-navy text-[13px]">{r.fromName}</p>{r.text && <p className="text-ink/80 text-[13px]">{r.text}</p>}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="px-5 mt-5">
            <Heading>Partner reviews{!trust.isNew ? ` · ${trust.text}` : ""}</Heading>
            <div className="space-y-2">
              {reviews.slice(0, 8).map((r) => (
                <div key={r.id} className="rounded-xl bg-white border border-black/5 shadow-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-navy text-[13px]">{r.reviewerName}</span>
                    <span className="inline-flex items-center gap-1 text-[13px] text-ink/80"><Star className="w-4 h-4 text-brand-green" />{r.overall}</span>
                  </div>
                  {r.text && <p className="text-ink/80 text-[13px] mt-1">{r.text}</p>}
                </div>
              ))}
            </div>
            {trust.isNew && <p className="text-muted text-[12px] mt-2">New to ROAMR — few reviews yet. Meet in public first and share a trip plan.</p>}
          </div>
        )}

        <div className="px-4 py-5 mt-3 space-y-4 border-t border-black/5">
          <Heading>{isMe ? "My posts" : "Posts"}</Heading>
          {loadingPosts ? [0, 1].map((i) => <PostSkeleton key={i} />)
            : posts.length === 0 ? <p className="text-center text-muted text-sm mt-2">{isMe ? "You haven't posted yet." : "No posts yet."}</p>
              : posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </div>
    </div>
  );
}
