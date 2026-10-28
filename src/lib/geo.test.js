import { describe, it, expect } from "vitest";
import { milesBetween, placeLabel } from "./geo.js";
import { categoryOf, shortTitle, checkoutUrl, findVariant } from "./shop.js";

describe("geo", () => {
  it("measures Telluride → Ouray at roughly 15 miles", () => {
    const d = milesBetween({ lat: 37.9375, lng: -107.8123 }, { lat: 38.0228, lng: -107.6714 });
    expect(d).toBeGreaterThan(9);
    expect(d).toBeLessThan(13);
  });
  it("treats missing coords as infinitely far", () => {
    expect(milesBetween({ lat: 1, lng: 1 }, null)).toBe(Infinity);
  });
  it("builds compact US place labels", () => {
    expect(placeLabel({ name: "Bear Creek Trail", city: "Telluride", state: "Colorado", country: "United States" }))
      .toBe("Bear Creek Trail, Telluride, Colorado");
  });
});

describe("shop", () => {
  it("categorizes by title keywords with jackets beating hoodies", () => {
    expect(categoryOf({ title: "ROAMR Poly-Tech Soft Shell Jacket", type: "" })).toBe("jackets");
    expect(categoryOf({ title: "Unisex heavy blend zip hoodie", type: "" })).toBe("hoodies");
    expect(categoryOf({ title: "Foam trucker hat", type: "" })).toBe("hats");
    expect(categoryOf({ title: "ROAMR Sport-Wick Fleece Jogger", type: "pants" })).toBe("bottoms");
    expect(categoryOf({ title: "ROAMR Night Explorer Unisex T-Shirt", type: "" })).toBe("tops");
  });
  it("shortens SEO titles", () => {
    expect(shortTitle("ROAMR High-Quality Cotton Hoodie for Outdoor Explorers – Classic Fit")).toBe("ROAMR High-Quality Cotton Hoodie for Outdoor Explorers");
  });
  it("builds a Shopify cart permalink", () => {
    expect(checkoutUrl([{ variantId: 1, qty: 2 }, { variantId: 3, qty: 1 }])).toBe("https://roamrapparel.org/cart/1:2,3:1?ref=roamr_app");
  });
  it("finds the variant for chosen options", () => {
    const p = { variants: [{ id: 1, options: ["Black", "S"] }, { id: 2, options: ["Black", "M"] }] };
    expect(findVariant(p, ["Black", "M"]).id).toBe(2);
  });
});
