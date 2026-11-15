import { describe, it, expect, vi } from "vitest";

vi.mock("./firebase.js", () => ({ db: {} }));
const { validateGuideApplication, guideBadge, GUIDE_LIMITS } = await import("./guide.js");

const nextYear = `${new Date().getFullYear() + 1}-06-30`;
const good = {
  fullName: "  Sam Rivers ", specialties: ["Fly fishing"], region: "Bozeman, MT", experienceYears: "6",
  certifications: "WFR, Orvis-endorsed", license: "MT Outfitter Guide #12345",
  insuranceProvider: "Outdoor Underwriters", insurancePolicy: "OU-998877", insuranceExpires: nextYear,
  website: "https://samrivers.example", bio: "Drift trips on the Madison.",
};

describe("validateGuideApplication", () => {
  it("accepts a complete application and trims it to the doc shape", () => {
    const r = validateGuideApplication(good);
    expect(r.ok).toBe(true);
    expect(r.data.fullName).toBe("Sam Rivers");
    expect(r.data.experienceYears).toBe(6);
    expect(Object.keys(r.data).sort()).toEqual([
      "bio", "certifications", "experienceYears", "fullName", "insuranceExpires", "insurancePolicy",
      "insuranceProvider", "license", "region", "specialties", "website",
    ]);
  });

  it("requires licence, insurance and at least one specialty", () => {
    const r = validateGuideApplication({ ...good, license: "", insuranceProvider: "", insurancePolicy: "", specialties: [] });
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(["insurancePolicy", "insuranceProvider", "license", "specialties"]);
    expect(r.data).toBeNull();
  });

  it("rejects expired or missing insurance dates", () => {
    expect(validateGuideApplication({ ...good, insuranceExpires: "2001-01-01" }).errors.insuranceExpires).toMatch(/expired/);
    expect(validateGuideApplication({ ...good, insuranceExpires: "" }).errors.insuranceExpires).toBeTruthy();
  });

  it("rejects bad experience years, too many specialties and non-http links", () => {
    expect(validateGuideApplication({ ...good, experienceYears: "2.5" }).errors.experienceYears).toBeTruthy();
    expect(validateGuideApplication({ ...good, experienceYears: "" }).errors.experienceYears).toBeTruthy();
    const many = Array.from({ length: GUIDE_LIMITS.specialties + 1 }, (_, i) => `S${i}`);
    expect(validateGuideApplication({ ...good, specialties: many }).errors.specialties).toBeTruthy();
    expect(validateGuideApplication({ ...good, website: "javascript:alert(1)" }).errors.website).toBeTruthy();
    expect(validateGuideApplication({ ...good, website: "" }).ok).toBe(true);
  });
});

describe("guideBadge", () => {
  it("shows only for verified guides, with up to two specialties", () => {
    expect(guideBadge(null)).toBeNull();
    expect(guideBadge({ guide: { verified: false } })).toBeNull();
    expect(guideBadge({ guide: { verified: true } })).toBe("Verified guide");
    expect(guideBadge({ guide: { verified: true, specialties: ["Fly fishing", "Kayaking & canoeing", "Hunting"] } }))
      .toBe("Verified guide · Fly fishing, Kayaking & canoeing");
  });
});
