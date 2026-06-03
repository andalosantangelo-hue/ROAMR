import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(typeof navigator !== "undefined" && !navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (!offline) return null;
  return (
    <div className="absolute top-0 inset-x-0 z-50 bg-brand-navy text-white/90 text-center text-[12px] font-medium py-1">
      You&apos;re offline — showing saved data
    </div>
  );
}
