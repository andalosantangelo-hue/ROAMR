import { describe, it, expect } from "vitest";
import { compressImage, friendlyError, ImageUploadError, MAX_INPUT_BYTES } from "./image.js";

describe("compressImage guards", () => {
  it("returns null/undefined unchanged", async () => {
    expect(await compressImage(null)).toBe(null);
    expect(await compressImage(undefined)).toBe(undefined);
  });
  it("rejects non-image files with a readable message (never uploads the original)", async () => {
    const txt = new File(["hello"], "notes.txt", { type: "text/plain" });
    await expect(compressImage(txt)).rejects.toThrow(/isn't a photo/);
  });
  it("rejects untyped files instead of passing them through unstripped", async () => {
    const blob = new File(["xx"], "mystery", { type: "" });
    await expect(compressImage(blob)).rejects.toBeInstanceOf(ImageUploadError);
  });
  it("rejects oversized files before decoding", async () => {
    const big = { name: "big.jpg", type: "image/jpeg", size: MAX_INPUT_BYTES + 1 };
    await expect(compressImage(big)).rejects.toThrow(/too large/);
  });
});

describe("friendlyError", () => {
  it("shows ImageUploadError messages as-is", () => {
    expect(friendlyError(new ImageUploadError("Pick another photo."))).toBe("Pick another photo.");
  });
  it("hides raw Firebase permission errors", () => {
    const raw = Object.assign(new Error("Firebase Storage: User does not have permission to access 'avatars/abc'"), { code: "storage/unauthorized" });
    expect(friendlyError(raw)).not.toMatch(/Firebase|avatars/);
    const rules = Object.assign(new Error("PERMISSION_DENIED: evaluation error at L90"), { code: "permission-denied" });
    expect(friendlyError(rules)).not.toMatch(/L90|PERMISSION/);
  });
  it("explains offline failures", () => {
    expect(friendlyError({ code: "unavailable" })).toMatch(/offline/);
  });
  it("falls back to the caller's message", () => {
    expect(friendlyError(new Error("weird"), "Couldn't save.")).toBe("Couldn't save.");
  });
});
