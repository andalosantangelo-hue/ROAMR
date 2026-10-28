// ROAMR Apparel — live Shopify catalog (roamrapparel.org) + cart permalink checkout.
// Catalog comes from the `shopCatalog` Cloud Function; if that's unreachable we
// fall back to a snapshot bundled with the app so the tab is never empty.

export const SHOP_URL = "https://roamrapparel.org";
const CATALOG_URL = import.meta.env.VITE_SHOP_CATALOG_URL
  || "https://us-central1-roamr-55afb.cloudfunctions.net/shopCatalog";

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "hoodies", label: "Hoodies & Layers", re: /hood|sweat|pullover|1\/4|crewneck|sweater|zip/i },
  { id: "jackets", label: "Jackets", re: /jacket|windbreaker|puffer|shell|parka/i },
  { id: "tops", label: "Tees & Tops", re: /t-shirt|tee\b|polo|bra|tank|top\b/i },
  { id: "bottoms", label: "Bottoms", re: /jogger|short|pant|legging/i },
  { id: "hats", label: "Hats & Beanies", re: /hat|cap\b|beanie|visor/i },
  { id: "gear", label: "Bags & Gear", re: /bag|backpack|tote|bottle|coozie|gaiter|sticker|mug/i },
];

// Order matters: a "zip hoodie" is a hoodie, a "soft shell jacket" is a jacket.
const ORDER = ["jackets", "hoodies", "bottoms", "hats", "gear", "tops"];
export function categoryOf(p) {
  const hay = `${p.title} ${p.type}`;
  for (const id of ORDER) if (CATEGORIES.find((c) => c.id === id).re.test(hay)) return id;
  return "gear";
}

// Shopify titles are SEO-long ("… – Classic Fit"); show the short name in the grid.
export const shortTitle = (t = "") => t.split(/\s[–|-]\s|\s\|\s/)[0].trim();

export const money = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? `$${v % 1 ? v.toFixed(2) : v.toFixed(0)}` : "";
};

function normalize(p) {
  const prices = p.variants.map((v) => Number(v.price)).filter(Number.isFinite);
  return {
    ...p,
    name: shortTitle(p.title),
    category: categoryOf(p),
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    available: p.variants.some((v) => v.available),
    url: `${SHOP_URL}/products/${p.handle}`,
  };
}

let memo = null;
export async function loadCatalog({ signal } = {}) {
  if (memo) return memo;
  try {
    const r = await fetch(CATALOG_URL, { signal });
    if (!r.ok) throw new Error(String(r.status));
    const json = await r.json();
    if (!Array.isArray(json.products) || !json.products.length) throw new Error("empty");
    memo = { live: true, products: json.products.map(normalize) };
  } catch (e) {
    if (e?.name === "AbortError") throw e;
    const snap = (await import("../data/shopSnapshot.json")).default;
    memo = { live: false, products: snap.products.map(normalize) };
  }
  return memo;
}

// Pick the variant matching the chosen option values.
export function findVariant(p, chosen) {
  return p.variants.find((v) => v.options.every((val, i) => !chosen[i] || chosen[i] === val)) || p.variants[0];
}

// Shopify cart permalink → goes straight to Shopify checkout with these lines.
export function checkoutUrl(lines) {
  const parts = lines.filter((l) => l.qty > 0).map((l) => `${l.variantId}:${l.qty}`);
  return `${SHOP_URL}/cart/${parts.join(",")}?ref=roamr_app`;
}

export function openExternal(url) {
  const w = window.open(url, "_blank", "noopener");
  if (!w) window.location.href = url; // popup blocked → same tab
}

// Bag is a per-device convenience (survives reloads; real order lives in Shopify).
const BAG = "roamr.bag";
export function loadBag() { try { return JSON.parse(localStorage.getItem(BAG) || "[]"); } catch { return []; } }
export function saveBag(b) { try { localStorage.setItem(BAG, JSON.stringify(b)); } catch { /* storage blocked */ } }
