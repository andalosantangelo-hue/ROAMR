// Skeleton building blocks. Shapes get the `.skeleton` shimmer from index.css and are
// hidden from screen readers; SkeletonRegion announces the whole block once instead.

// Wraps a loading area: one "Loading posts"-style label, busy until real content swaps in.
export function SkeletonRegion({ label, className = "", children }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}

// Any block (image, button, chip). Pass size + radius; defaults to rounded-lg.
export function SkeletonBox({ className = "" }) {
  const radius = /\brounded/.test(className) ? "" : "rounded-lg";
  return <div aria-hidden="true" className={`skeleton ${radius} ${className}`} />;
}

export function SkeletonCircle({ className = "w-9 h-9" }) {
  return <div aria-hidden="true" className={`skeleton rounded-full shrink-0 ${className}`} />;
}

// A line of text. `box` is the real text's line-box height (so nothing shifts when the
// text arrives); `bar` is the visible bar's thickness; `className` sets its width.
export function SkeletonLine({ className = "w-24", box = "h-5", bar = "h-2.5" }) {
  return (
    <div aria-hidden="true" className={`flex items-center ${box}`}>
      <div className={`skeleton rounded-full max-w-full ${bar} ${className}`} />
    </div>
  );
}
