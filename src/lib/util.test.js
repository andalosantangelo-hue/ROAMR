import { describe, it, expect } from "vitest";
import { toggleSet, membershipState, initials, isDemoId, safeText, safeReturnPath, isSafeMediaUrl } from "./util.js";

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

describe("isDemoId", () => {
  it("treats numeric seed ids as demo and Firestore string ids as real", () => {
    expect(isDemoId(1)).toBe(true);
    expect(isDemoId("aB3xQ9")).toBe(false);
  });
});

describe("safeText", () => {
  it("passes strings through and truncates", () => {
    expect(safeText("hi")).toBe("hi");
    expect(safeText("abcdef", 3)).toBe("abc");
  });
  it("renders numbers and booleans as text", () => {
    expect(safeText(4)).toBe("4");
    expect(safeText(false)).toBe("false");
  });
  it("drops objects, arrays and nullish values instead of crashing render", () => {
    expect(safeText({ x: 1 })).toBe("");
    expect(safeText(["a"])).toBe("");
    expect(safeText(null)).toBe("");
    expect(safeText(undefined)).toBe("");
  });
});

describe("safeReturnPath", () => {
  it("keeps in-app deep links", () => {
    expect(safeReturnPath("/tribe/abc123")).toBe("/tribe/abc123");
    expect(safeReturnPath("/invite/activity/x9")).toBe("/invite/activity/x9");
  });
  it("rejects external or protocol-relative targets", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "evil.com", null, 42]) {
      expect(safeReturnPath(bad)).toBe(null);
    }
  });
  it("ignores auth pages so users don't loop", () => {
    expect(safeReturnPath("/login")).toBe(null);
    expect(safeReturnPath("/onboarding")).toBe(null);
    expect(safeReturnPath("/")).toBe(null);
  });
});

describe("isSafeMediaUrl", () => {
  it("accepts our Storage bucket and the local emulator", () => {
    expect(isSafeMediaUrl("https://firebasestorage.googleapis.com/v0/b/x/o/posts%2Fa%2F1.jpg")).toBe(true);
    expect(isSafeMediaUrl("http://127.0.0.1:9199/v0/b/x/o/1.jpg")).toBe(true);
  });
  it("rejects other hosts, look-alikes and non-strings", () => {
    expect(isSafeMediaUrl("https://evil.example/p.gif")).toBe(false);
    expect(isSafeMediaUrl("https://firebasestorage.googleapis.com.evil.example/p.gif")).toBe(false);
    expect(isSafeMediaUrl("http://firebasestorage.googleapis.com/p.gif")).toBe(false);
    expect(isSafeMediaUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeMediaUrl({ url: "x" })).toBe(false);
    expect(isSafeMediaUrl("https://firebasestorage.googleapis.com/" + "a".repeat(2000))).toBe(false);
  });
});

describe("membershipState", () => {
  const ids = (s) => [...s].sort();
  it("joins every member doc; confirms only the server-acknowledged ones", () => {
    const { joined, confirmed } = membershipState([{ tribeId: "a", pending: false }, { tribeId: "b", pending: true }]);
    expect(ids(joined)).toEqual(["a", "b"]);
    expect(ids(confirmed)).toEqual(["a"]);
  });
  it("keeps an in-flight join shown as joined but unconfirmed before its write lands", () => {
    const { joined, confirmed } = membershipState([], new Map([["t", "join"]]));
    expect(ids(joined)).toEqual(["t"]);
    expect(ids(confirmed)).toEqual([]);
  });
  it("hides an in-flight leave even while the doc is still in the snapshot", () => {
    const { joined, confirmed } = membershipState([{ tribeId: "t", pending: false }], new Map([["t", "leave"]]));
    expect(ids(joined)).toEqual([]);
    expect(ids(confirmed)).toEqual([]);
  });
  it("confirms a join once the server ack arrives, even if the tap is still in flight", () => {
    const { confirmed } = membershipState([{ tribeId: "t", pending: false }], new Map([["t", "join"]]));
    expect(ids(confirmed)).toEqual(["t"]);
  });
  it("skips docs with no parent tribe", () => {
    expect(membershipState([{ tribeId: undefined, pending: false }]).joined.size).toBe(0);
  });
});
