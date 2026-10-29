import { describe, it, expect } from "vitest";
import { toggleSet, initials, ageOn } from "./util.js";

describe("toggleSet", () => {
  it("adds an id that isn't present", () => {
    expect([...toggleSet(new Set(), "a")]).toEqual(["a"]);
  });
  it("removes an id that is present", () => {
    expect([...toggleSet(new Set(["a", "b"]), "a")]).toEqual(["b"]);
  });
  it("does not mutate the input set", () => {
    const original = new Set(["x"]);
    toggleSet(original, "y");
    expect([...original]).toEqual(["x"]);
  });
  it("round-trips to the original membership", () => {
    const once = toggleSet(new Set(), "z");
    const twice = toggleSet(once, "z");
    expect(twice.has("z")).toBe(false);
  });
});

describe("initials", () => {
  it("takes the first two words", () => {
    expect(initials("Andalo Santangelo")).toBe("AS");
  });
  it("handles a single name", () => {
    expect(initials("Tyler")).toBe("T");
  });
  it("collapses extra whitespace and is uppercase", () => {
    expect(initials("  jane   q  doe ")).toBe("JQ");
  });
  it("returns empty string for empty input", () => {
    expect(initials("")).toBe("");
  });
});

describe("ageOn", () => {
  const today = new Date(2026, 9, 29); // 29 Oct 2026, local time
  it("counts a birthday earlier this year", () => {
    expect(ageOn("2008-01-15", today)).toBe(18);
  });
  it("is still 17 the day before the 18th birthday", () => {
    expect(ageOn("2008-10-30", today)).toBe(17);
  });
  it("turns 18 on the birthday itself", () => {
    expect(ageOn("2008-10-29", today)).toBe(18);
  });
  it("returns NaN for empty or malformed input", () => {
    expect(ageOn("", today)).toBeNaN();
    expect(ageOn("10/29/2008", today)).toBeNaN();
  });
});
