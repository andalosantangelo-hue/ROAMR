import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

let appState = null;
const submit = vi.fn(async () => {});
vi.mock("../lib/firebase.js", () => ({ db: {} }));
vi.mock("../lib/analytics.js", () => ({ track: vi.fn() }));
vi.mock("../store/AuthContext.jsx", () => ({ useAuth: () => ({ user: { uid: "me" }, profile: globalThis.__profile || {} }) }));
vi.mock("../lib/guide.js", async (orig) => {
  const real = await orig();
  return {
    ...real,
    submitGuideApplication: (...a) => submit(...a),
    watchGuideApplication: (_uid, cb) => { cb(appState); return () => {}; },
  };
});
const { default: GuideApply } = await import("./GuideApply.jsx");

const view = () => render(<MemoryRouter><GuideApply /></MemoryRouter>);
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => { appState = null; globalThis.__profile = {}; submit.mockClear(); });

describe("GuideApply", () => {
  it("shows the form when there's no application, and blocks an incomplete submit", () => {
    view();
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Check the highlighted fields");
    expect(submit).not.toHaveBeenCalled();
  });

  it("submits a complete application once the details are confirmed", async () => {
    view();
    type("Full legal name", "Sam Rivers");
    fireEvent.click(screen.getByRole("button", { name: "Fly fishing" }));
    type("Where you guide", "Bozeman, MT");
    type("Years guiding", "6");
    type("Guide licence or permit", "MT Outfitter Guide #12345");
    type("Liability insurance provider", "Outdoor Underwriters");
    type("Policy number", "OU-998877");
    type("Policy expires", `${new Date().getFullYear() + 1}-06-30`);
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Confirm your details");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    await vi.waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0]).toBe("me");
    expect(submit.mock.calls[0][1]).toMatchObject({ fullName: "Sam Rivers", specialties: ["Fly fishing"], experienceYears: 6 });
  });

  it("shows 'under review' for a pending application, with no form", () => {
    appState = { status: "pending", fullName: "Sam", specialties: ["Fly fishing"] };
    view();
    expect(screen.getByText("Application under review")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit application" })).not.toBeInTheDocument();
  });

  it("prefills a rejected application for resubmission", () => {
    appState = { status: "rejected", fullName: "Sam Rivers", specialties: ["Fly fishing"], region: "Bozeman, MT", experienceYears: 6 };
    view();
    expect(screen.getByText(/couldn't approve your application yet/)).toBeInTheDocument();
    expect(screen.getByLabelText("Full legal name")).toHaveValue("Sam Rivers");
    expect(screen.getByRole("button", { name: "Resubmit application" })).toBeInTheDocument();
  });

  it("shows the badge for an approved guide", () => {
    appState = { status: "approved" };
    globalThis.__profile = { guide: { verified: true, specialties: ["Fly fishing"] } };
    view();
    expect(screen.getByText("You're a verified guide")).toBeInTheDocument();
    expect(screen.getByText(/Verified guide · Fly fishing/)).toBeInTheDocument();
  });
});
