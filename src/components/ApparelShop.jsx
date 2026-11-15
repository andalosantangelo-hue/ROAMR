import { useEffect, useMemo, useState } from "react";
import SearchBar from "./SearchBar.jsx";
import { SkeletonRegion, ListingCardSkeleton } from "./skeletons";
import {
  CATEGORIES, loadCatalog, findVariant, checkoutUrl, openExternal, money, loadBag, saveBag, SHOP_URL,
} from "../lib/shop.js";

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "low", label: "Price: low → high" },
  { id: "high", label: "Price: high → low" },
];

function BagIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function ProductSheet({ p, onClose, onAdd }) {
  const [chosen, setChosen] = useState(() => p.variants.find((v) => v.available)?.options || p.variants[0].options);
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const variant = findVariant(p, chosen);
  const images = [...new Set([variant.image, ...p.images].filter(Boolean))];
  const single = p.options.length === 1 && p.options[0].values.length === 1;

  const isAvailable = (optIdx, val) => p.variants.some((v) => v.available && v.options[optIdx] === val &&
    v.options.every((x, i) => i === optIdx || !chosen[i] || chosen[i] === x));

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/45" />
      <div className="relative bg-white rounded-t-3xl max-h-[92%] overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="sticky top-0 z-10 flex justify-between items-center px-4 pt-3 pb-2 bg-white/90 backdrop-blur">
          <div className="w-10 h-1.5 rounded-full bg-black/15 absolute left-1/2 -translate-x-1/2 top-2" />
          <span />
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-brand-tint text-brand-navy grid place-items-center text-xl mt-1">×</button>
        </div>
        <div className="px-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-brand-tint">
            <img src={images[img] || images[0]} alt={p.name} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
              {images.map((src, i) => (
                <button key={src} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden ring-2 ${i === img ? "ring-brand-green" : "ring-transparent"}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          <h2 className="text-xl font-extrabold text-brand-navy mt-4 leading-tight">{p.name}</h2>
          <p className="text-lg font-bold text-brand-green mt-1">{money(variant.price)}</p>

          {!single && p.options.map((o, oi) => (
            <div key={o.name} className="mt-4">
              <p className="text-sm font-semibold text-ink/80 mb-2">{o.name}{chosen[oi] ? <span className="font-normal text-muted"> · {chosen[oi]}</span> : null}</p>
              <div className="flex flex-wrap gap-2">
                {o.values.map((val) => {
                  const on = chosen[oi] === val;
                  const ok = isAvailable(oi, val);
                  return (
                    <button key={val} onClick={() => { setChosen((c) => { const n = [...c]; n[oi] = val; return n; }); setImg(0); }}
                      className={`min-h-[40px] min-w-[48px] px-3.5 rounded-full text-sm font-semibold transition ${
                        on ? "bg-brand-navy text-white" : "bg-brand-tint text-brand-navy"} ${ok ? "" : "opacity-40 line-through"}`}>
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 mt-5">
            <div className="flex items-center rounded-full bg-brand-tint">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Fewer" className="w-11 h-11 text-xl text-brand-navy">−</button>
              <span className="w-6 text-center font-semibold text-brand-navy">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(9, q + 1))} aria-label="More" className="w-11 h-11 text-xl text-brand-navy">+</button>
            </div>
            <p className="text-[12px] text-muted flex-1">{variant.available ? "Made to order · ships in ~1 week" : "Sold out in this option"}</p>
          </div>

          {p.description && <p className="text-[13px] text-muted leading-relaxed mt-4 line-clamp-6">{p.description}</p>}
        </div>

        <div className="sticky bottom-0 bg-white px-4 pt-3 pb-6 mt-4 border-t border-black/5 flex gap-2">
          <button disabled={!variant.available} onClick={() => { onAdd(p, variant, qty); onClose(); }}
            className="flex-1 rounded-xl py-4 font-semibold bg-brand-tint text-brand-navy disabled:opacity-50">Add to bag</button>
          <button disabled={!variant.available} onClick={() => openExternal(checkoutUrl([{ variantId: variant.id, qty }]))}
            className="flex-1 rounded-xl py-4 font-semibold bg-brand-green hover:bg-brand-greenDark text-white disabled:opacity-50">Buy now</button>
        </div>
      </div>
    </div>
  );
}

function BagSheet({ bag, setBag, onClose }) {
  const total = bag.reduce((n, l) => n + Number(l.price) * l.qty, 0);
  const setQty = (i, q) => setBag(bag.map((l, j) => (j === i ? { ...l, qty: q } : l)).filter((l) => l.qty > 0));
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/45" />
      <div className="relative bg-white rounded-t-3xl p-5 pb-7 max-h-[80%] overflow-y-auto no-scrollbar">
        <div className="w-10 h-1.5 rounded-full bg-black/15 mx-auto mb-4" />
        <h2 className="text-lg font-extrabold text-brand-navy mb-3">Your bag</h2>
        {bag.length === 0 ? <p className="text-muted text-sm py-6 text-center">Nothing here yet.</p> : bag.map((l, i) => (
          <div key={l.variantId} className="flex items-center gap-3 py-3 border-b border-black/5">
            <img src={l.image} alt="" className="w-14 h-14 rounded-lg object-cover bg-brand-tint" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-ink truncate">{l.name}</p>
              <p className="text-[12px] text-muted truncate">{l.variantTitle !== "Default Title" ? l.variantTitle : ""}</p>
              <p className="text-[13px] font-semibold text-brand-navy">{money(l.price)}</p>
            </div>
            <div className="flex items-center rounded-full bg-brand-tint">
              <button onClick={() => setQty(i, l.qty - 1)} aria-label="Fewer" className="w-9 h-9 text-brand-navy">−</button>
              <span className="w-5 text-center text-sm font-semibold">{l.qty}</span>
              <button onClick={() => setQty(i, Math.min(9, l.qty + 1))} aria-label="More" className="w-9 h-9 text-brand-navy">+</button>
            </div>
          </div>
        ))}
        {bag.length > 0 && (
          <>
            <div className="flex justify-between mt-4 font-semibold text-brand-navy"><span>Subtotal</span><span>{money(total)}</span></div>
            <p className="text-[11px] text-muted mt-1">Shipping & tax calculated at checkout on roamrapparel.org.</p>
            <button onClick={() => openExternal(checkoutUrl(bag))}
              className="w-full mt-4 rounded-xl py-4 font-semibold bg-brand-green hover:bg-brand-greenDark text-white">Checkout securely</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ApparelShop() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("featured");
  const [open, setOpen] = useState(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [bag, setBagState] = useState(loadBag);
  const setBag = (b) => { setBagState(b); saveBag(b); };

  useEffect(() => {
    const ctl = new AbortController();
    loadCatalog({ signal: ctl.signal }).then(setData).catch(() => {});
    return () => ctl.abort();
  }, []);

  const counts = useMemo(() => {
    const c = { all: data?.products.length || 0 };
    (data?.products || []).forEach((p) => { c[p.category] = (c[p.category] || 0) + 1; });
    return c;
  }, [data]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = (data?.products || []).filter((p) =>
      (cat === "all" || p.category === cat) &&
      (!s || `${p.title} ${p.type} ${p.tags.join(" ")}`.toLowerCase().includes(s)));
    if (sort === "low") return [...list].sort((a, b) => a.minPrice - b.minPrice);
    if (sort === "high") return [...list].sort((a, b) => b.minPrice - a.minPrice);
    return list;
  }, [data, q, cat, sort]);

  const addToBag = (p, v, qty) => {
    const i = bag.findIndex((l) => l.variantId === v.id);
    if (i >= 0) setBag(bag.map((l, j) => (j === i ? { ...l, qty: Math.min(9, l.qty + qty) } : l)));
    else setBag([...bag, { variantId: v.id, qty, name: p.name, variantTitle: v.title, price: v.price, image: v.image || p.images[0] }]);
  };
  const bagCount = bag.reduce((n, l) => n + l.qty, 0);

  return (
    <>
      <div className="rounded-2xl bg-brand-navy text-white p-4 mb-4 relative overflow-hidden">
        <p className="font-extrabold text-brand-greenBright">Official ROAMR Gear</p>
        <p className="text-white/80 text-[13px] mt-1 pr-16">Made-to-order, eco-minded layers for getting outside. Checkout runs on our Shopify store.</p>
        <button onClick={() => setBagOpen(true)} aria-label={`Bag, ${bagCount} items`}
          className="absolute top-3 right-3 w-11 h-11 rounded-full bg-white/10 grid place-items-center">
          <BagIcon className="w-5 h-5" />
          {bagCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-greenBright text-brand-navy text-[10px] font-bold grid place-items-center">{bagCount}</span>}
        </button>
      </div>

      <SearchBar placeholder="Search hoodies, hats, jackets…" value={q} onChange={setQ} />

      <div className="flex gap-2 my-3 overflow-x-auto no-scrollbar -mx-4 px-4">
        {CATEGORIES.filter((c) => c.id === "all" || counts[c.id]).map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`shrink-0 min-h-[36px] px-3.5 rounded-full text-[13px] font-semibold transition ${cat === c.id ? "bg-brand-navy text-white" : "bg-brand-tint text-brand-navy"}`}>
            {c.label}{counts[c.id] ? <span className={cat === c.id ? "text-white/60" : "text-brand-navy/50"}> {counts[c.id]}</span> : null}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] text-muted">{data ? `${shown.length} item${shown.length === 1 ? "" : "s"}` : "Loading…"}</p>
        <label className="flex items-center gap-1 text-[12px] text-brand-navy font-semibold">
          <span className="sr-only">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent outline-none text-right">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {!data ? (
        <SkeletonRegion label="Loading apparel" className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <ListingCardSkeleton key={i} />)}</SkeletonRegion>
      ) : shown.length === 0 ? (
        <p className="text-center text-muted text-sm mt-10">No gear matches that. <button onClick={() => { setQ(""); setCat("all"); }} className="text-brand-green font-semibold">Clear</button></p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {shown.map((p) => (
            <button key={p.id} onClick={() => setOpen(p)} className="text-left bg-white rounded-2xl shadow-card overflow-hidden active:scale-[0.99] transition">
              <div className="aspect-square bg-brand-tint relative">
                {p.images[0] && <img src={`${p.images[0]}${p.images[0].includes("?") ? "&" : "?"}width=480`} alt="" loading="lazy" className="w-full h-full object-cover" />}
                {!p.available && <span className="absolute top-2 left-2 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-white text-brand-navy">Sold out</span>}
              </div>
              <div className="p-3">
                <span className="font-bold text-brand-navy">{money(p.minPrice)}{p.maxPrice > p.minPrice ? "+" : ""}</span>
                <p className="text-ink text-[13px] mt-0.5 line-clamp-2 font-medium leading-snug">{p.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {data && !data.live && (
        <p className="text-[11px] text-muted text-center mt-4">Showing saved catalog · <a href={SHOP_URL} target="_blank" rel="noreferrer" className="underline">open store</a></p>
      )}

      {open && <ProductSheet p={open} onClose={() => setOpen(null)} onAdd={addToBag} />}
      {bagOpen && <BagSheet bag={bag} setBag={setBag} onClose={() => setBagOpen(false)} />}
    </>
  );
}
