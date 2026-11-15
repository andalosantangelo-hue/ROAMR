// Screen-shaped placeholders. Each mirrors the padding, sizes and line heights of the
// real component named beside it, so the swap to real content doesn't jump.
// Line boxes: body line-height is 1.5, so text-[15px] → 22.5px, text-[13px] → 19.5px, etc.
import { SkeletonBox, SkeletonCircle, SkeletonLine } from "./primitives.jsx";

const Icon = ({ className = "" }) => <SkeletonBox className={`w-[22px] h-[22px] rounded-md ${className}`} />;
// JoinButton: px-6 py-2 text-sm → 36px tall, ~76px wide.
const JoinBtn = ({ className = "" }) => <SkeletonBox className={`w-[76px] h-9 rounded-lg shrink-0 ${className}`} />;

// Avatar + name + date, as in PostCard / ActivityCard.
function AuthorRow() {
  return (
    <>
      <SkeletonCircle className="w-9 h-9" />
      <div className="flex-1 min-w-0">
        <SkeletonLine box="h-[22.5px]" bar="h-3" className="w-28" />
        <SkeletonLine box="h-[18px]" className="w-20" />
      </div>
    </>
  );
}

// Like · comment · share · save.
function ActionRow({ className = "" }) {
  return (
    <div className={`flex items-center gap-5 ${className}`}>
      <SkeletonBox className="w-10 h-[22px] rounded-md" />
      <SkeletonBox className="w-10 h-[22px] rounded-md" />
      <Icon className="ml-auto" />
      <Icon />
    </div>
  );
}

// PostCard
export function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5"><AuthorRow /></div>
      <div className="px-3"><SkeletonBox className="w-full h-52 rounded-xl" /></div>
      <div className="px-4 pt-3">
        <SkeletonLine box="h-6" bar="h-3" className="w-3/4" />
        <SkeletonLine box="h-[19.5px] mt-1" className="w-1/3" />
      </div>
      <ActionRow className="px-4 py-3.5" />
    </div>
  );
}

// ActivityCard
export function ActivityCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-card px-4 py-3.5">
      <div className="flex items-center gap-3"><AuthorRow /></div>
      <SkeletonLine box="h-[22.5px] mt-2.5" bar="h-3" className="w-11/12" />
      <SkeletonLine box="h-[19.5px] mt-2" className="w-1/2" />
      <div className="flex items-center gap-3 mt-3">
        <SkeletonBox className="w-14 h-14 rounded-xl shrink-0" />
        <div className="flex -space-x-2">
          {[0, 1, 2].map((i) => <SkeletonCircle key={i} className="w-7 h-7 border-2 border-white" />)}
        </div>
        <JoinBtn className="ml-auto" />
      </div>
      <ActionRow className="mt-3 pt-3 border-t border-black/5" />
    </div>
  );
}

// TribeCard
export function TribeCardSkeleton() {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-3">
      <SkeletonBox className="w-14 h-14 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <SkeletonLine box="h-5" bar="h-3" className="w-32" />
        <SkeletonLine box="h-[19.5px] mt-0.5" className="w-24" />
      </div>
      <div className="w-9 h-9 grid place-items-center shrink-0"><SkeletonBox className="w-5 h-5 rounded-md" /></div>
      <JoinBtn />
    </div>
  );
}

// Marketplace gear tile
export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <SkeletonBox className="w-full aspect-square rounded-none" />
      <div className="p-3">
        <div className="flex items-center justify-between">
          <SkeletonLine box="h-6" bar="h-3" className="w-12" />
          <SkeletonBox className="w-10 h-[19px] rounded-full" />
        </div>
        <SkeletonLine box="h-[19.5px] mt-0.5" className="w-4/5" />
        <SkeletonLine box="h-[16.5px] mt-0.5" bar="h-2" className="w-1/2" />
      </div>
    </div>
  );
}

// Rows in Messages / Notifications / Comments.
export function ListRowSkeleton({ variant = "message" }) {
  if (variant === "notification") {
    return (
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-black/5">
        <SkeletonCircle className="w-9 h-9" />
        <div className="flex-1 min-w-0"><SkeletonLine box="h-[21px]" className="w-4/5" /></div>
        <SkeletonLine box="h-[18px]" className="w-10" />
      </div>
    );
  }
  if (variant === "comment") {
    return (
      <div className="flex gap-3">
        <SkeletonCircle className="w-8 h-8" />
        <div className="flex-1 min-w-0">
          <SkeletonBox className="h-[59px] w-3/4 rounded-2xl rounded-tl-sm" />
          <div className="ml-2"><SkeletonLine box="h-[16.5px]" bar="h-2" className="w-12" /></div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <SkeletonCircle className="w-12 h-12" />
      <div className="flex-1 min-w-0">
        <SkeletonLine box="h-6" bar="h-3" className="w-32" />
        <SkeletonLine box="h-[19.5px]" className="w-48" />
      </div>
    </div>
  );
}

// ChatThread bubbles: theirs left, mine right, varied widths. Single-line bubble is
// py-2 + 15px leading-snug ≈ 37px.
const BUBBLES = [["l", "w-2/5"], ["l", "w-3/5"], ["r", "w-1/2"], ["l", "w-1/3"], ["r", "w-3/5"], ["r", "w-2/5"], ["l", "w-1/2"]];
export function ChatSkeleton() {
  return BUBBLES.map(([side, w], i) => (
    <div key={i} className={`flex ${side === "r" ? "justify-end" : "justify-start"}`}>
      <SkeletonBox className={`h-[37px] rounded-2xl ${side === "r" ? "rounded-br-md" : "rounded-bl-md"} ${w}`} />
    </div>
  ));
}

// variant "public": PublicProfile hero + stats. "compact": the Profile tab's avatar block.
export function ProfileHeaderSkeleton({ variant = "public" }) {
  if (variant === "compact") {
    return (
      <div className="flex flex-col items-center">
        <SkeletonCircle className="w-28 h-28" />
        <SkeletonLine box="h-8 mt-4" bar="h-5" className="w-40" />
        <SkeletonLine box="h-[22.5px]" className="w-48" />
        <SkeletonLine box="h-[19.5px] mt-2" className="w-24" />
      </div>
    );
  }
  return (
    <>
      <div className="relative">
        <SkeletonBox className="w-full aspect-square rounded-none" />
        <div className="absolute left-5 bottom-3 space-y-1">
          <SkeletonBox className="h-6 w-44 rounded-full bg-white/40" />
          <SkeletonBox className="h-3.5 w-24 rounded-full bg-white/40" />
        </div>
      </div>
      <div className="px-5 pt-4">
        <div className="flex gap-4 mb-3">
          <SkeletonLine box="h-[19.5px]" className="w-24" />
          <SkeletonLine box="h-[19.5px]" className="w-20" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-6">
            <SkeletonLine box="h-6" className="w-20" />
            <SkeletonLine box="h-6" className="w-20" />
          </div>
          <SkeletonBox className="w-24 h-9 rounded-full" />
        </div>
        <SkeletonBox className="mt-4 w-full h-28 rounded-2xl" />
      </div>
    </>
  );
}

// variant "listing": ListingDetail body. "tribe": TribeDetail header block.
export function DetailSkeleton({ variant = "listing" }) {
  if (variant === "tribe") {
    return (
      <div className="px-5 pt-4 pb-4 border-b border-black/5">
        <div className="flex items-center gap-3">
          <SkeletonBox className="w-16 h-16 rounded-2xl shrink-0" />
          <div className="flex-1 min-w-0">
            <SkeletonLine box="h-[25px]" bar="h-4" className="w-36" />
            <SkeletonLine box="h-[19.5px]" className="w-24" />
          </div>
          <JoinBtn />
        </div>
        <div className="flex gap-2 mt-3">
          <SkeletonBox className="h-[26px] w-16 rounded-full" />
          <SkeletonBox className="h-[26px] w-20 rounded-full" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex gap-2 overflow-hidden px-4">
        <SkeletonBox className="shrink-0 w-[88%] aspect-square rounded-2xl" />
        <SkeletonBox className="shrink-0 w-[88%] aspect-square rounded-2xl" />
      </div>
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between">
          <SkeletonLine box="h-8" bar="h-5" className="w-20" />
          <SkeletonBox className="w-20 h-6 rounded-full" />
        </div>
        <SkeletonLine box="h-7 mt-2" bar="h-3.5" className="w-2/3" />
        <SkeletonLine box="h-5 mt-1" className="w-1/3" />
        <div className="mt-4">
          <SkeletonLine box="h-6" className="w-full" />
          <SkeletonLine box="h-6" className="w-11/12" />
          <SkeletonLine box="h-6" className="w-3/5" />
        </div>
      </div>
    </div>
  );
}

// TripPlans card
export function TripCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white shadow-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <SkeletonLine box="h-5" bar="h-3" className="w-40" />
          <SkeletonLine box="h-[19.5px] mt-0.5" className="w-28" />
        </div>
        <SkeletonBox className="w-16 h-[24.5px] rounded-full shrink-0" />
      </div>
      <SkeletonLine box="h-[18px] mt-2" className="w-48" />
      <SkeletonBox className="mt-3 w-full h-10 rounded-xl" />
    </div>
  );
}

// EditProfile form: completeness card, open Photos section, then collapsed sections.
function SectionHead() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <SkeletonCircle className="w-2.5 h-2.5" />
      <div className="flex-1">
        <SkeletonLine box="h-6" bar="h-3" className="w-32" />
        <SkeletonLine box="h-[18px]" className="w-44" />
      </div>
    </div>
  );
}
export function FormSkeleton() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white shadow-card p-4">
        <SkeletonLine box="h-5 mb-2" bar="h-3" className="w-40" />
        <SkeletonBox className="h-2 w-full rounded-full" />
      </div>
      <div className="rounded-2xl border border-black/5 bg-white shadow-card overflow-hidden">
        <SectionHead />
        <div className="px-4 pb-4 pt-1 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => <SkeletonBox key={i} className="aspect-square rounded-xl" />)}
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-black/5 bg-white shadow-card overflow-hidden"><SectionHead /></div>
      ))}
    </div>
  );
}

// Discover "People to follow" strip (cards are w-32, avatar w-14, Follow pill).
export function PeopleStripSkeleton() {
  return (
    <section>
      <div className="px-1 mb-2"><SkeletonLine box="h-6" bar="h-3" className="w-32" /></div>
      <div className="flex gap-3 overflow-hidden pb-1 -mx-4 px-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="shrink-0 w-32 bg-white rounded-2xl shadow-card p-3 flex flex-col items-center">
            <SkeletonCircle className="w-14 h-14" />
            <SkeletonLine box="h-[19.5px] mt-2" className="w-16" />
            <SkeletonBox className="mt-2 w-[88px] h-9 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

// Invite landing: eyebrow, title, blurb, CTA.
export function InviteSkeleton() {
  return (
    <div className="w-full flex flex-col items-center">
      <SkeletonLine box="h-5 mb-1" className="w-24" />
      <SkeletonLine box="h-[30px] mb-2" bar="h-5" className="w-48" />
      <SkeletonLine box="h-5 mb-7" className="w-56" />
      <SkeletonBox className="w-full max-w-xs h-14 rounded-xl" />
    </div>
  );
}
