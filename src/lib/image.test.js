import { describe, it, expect } from "vitest";
import { compressImage } from "./image.js";

describe("compressImage guards", () => {
  it("returns null/undefined unchanged", async () => {
    expect(await compressImage(null)).toBe(null);
    expect(await compressImage(undefined)).toBe(undefined);
  });
  it("returns non-image files untouched", async () => {
    const txt = new File(["hello"], "notes.txt", { type: "text/plain" });
    expect(await compressImage(txt)).toBe(txt);
  });
});
