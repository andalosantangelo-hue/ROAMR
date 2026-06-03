// Faux iOS status bar to match the Figma frames
export default function StatusBar({ dark = false }) {
  const c = dark ? "text-white" : "text-ink";
  return (
    <div className={`flex items-center justify-between px-6 pt-3 pb-1 text-[15px] font-semibold ${c}`}>
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4.5" width="3" height="7.5" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
        <svg width="18" height="13" viewBox="0 0 18 13" fill="currentColor"><path d="M9 2.5c2.6 0 5 1 6.8 2.6l1.2-1.4A11 11 0 0 0 9 .8 11 11 0 0 0 1 3.7L2.2 5A9 9 0 0 1 9 2.5Z"/><path d="M9 6.2c1.6 0 3 .6 4.1 1.6l1.2-1.3A8 8 0 0 0 9 4.4a8 8 0 0 0-5.3 2L4.9 7.8A6 6 0 0 1 9 6.2Z"/><path d="M9 9.6c.8 0 1.5.3 2 .8l-2 2.2-2-2.2c.5-.5 1.2-.8 2-.8Z"/></svg>
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x="1" y="1" width="21" height="11" rx="3" stroke="currentColor" strokeOpacity="0.5"/><rect x="3" y="3" width="16" height="7" rx="1.5" fill="currentColor"/><rect x="23.5" y="4" width="2" height="5" rx="1" fill="currentColor" fillOpacity="0.5"/></svg>
      </div>
    </div>
  );
}
