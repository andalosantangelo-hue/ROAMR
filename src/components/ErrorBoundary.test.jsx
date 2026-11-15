import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary.jsx";

function Boom() { throw new Error("boom"); }

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(<ErrorBoundary><div>safe content</div></ErrorBoundary>);
    expect(screen.getByText("safe content")).toBeInTheDocument();
  });
  it("shows the fallback when a child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/reload roamr/i)).toBeInTheDocument();
  });
  it("a scoped boundary hides only the broken card; siblings still render", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<div><ErrorBoundary fallback={null}><Boom /></ErrorBoundary><p>other card</p></div>);
    expect(screen.getByText("other card")).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });
});
