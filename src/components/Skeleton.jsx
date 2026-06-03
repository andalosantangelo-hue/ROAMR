export function Box({ className = "" }) {
  return <div className={`bg-black/[0.06] rounded-lg animate-pulse ${className}`} />;
}

export function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
        <Box className="w-9 h-9 rounded-full" />
        <div className="flex-1"><Box className="h-3 w-28 mb-1.5" /><Box className="h-2.5 w-16" /></div>
      </div>
      <div className="px-3"><Box className="w-full h-52 rounded-xl" /></div>
      <div className="px-4 py-4"><Box className="h-3 w-2/3 mb-2" /><Box className="h-2.5 w-1/3" /></div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-3">
      <Box className="w-14 h-14 rounded-xl" />
      <div className="flex-1"><Box className="h-3.5 w-32 mb-2" /><Box className="h-2.5 w-20" /></div>
      <Box className="h-9 w-20 rounded-lg" />
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <Box className="w-full aspect-square rounded-none" />
      <div className="p-3"><Box className="h-3 w-12 mb-2" /><Box className="h-2.5 w-20" /></div>
    </div>
  );
}
