import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DashboardReferenceSearch } from "./dashboard-reference-search";

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

describe("dashboard search shell", () => {
  it("labels the search accessibly without listing all inventory before typing", () => {
    const html = renderToStaticMarkup(<DashboardReferenceSearch watches={[{ id: 1, brand: "Rolex", model: "Explorer", referenceNumber: "124270", serialNumber: null, status: "sold" }]}/>);
    expect(html).toContain("Search inventory by reference number");
    expect(html).toContain("role=\"search\"");
    expect(html).toContain("aria-live=\"polite\"");
    expect(html).not.toContain("placeholder=");
    expect(html).not.toContain("href=\"/inventory/1\"");
  });
  it("does not claim no matches when inventory could not be loaded", () => {
    const html = renderToStaticMarkup(<DashboardReferenceSearch watches={[]} unavailable/>);
    expect(html).toContain("Inventory could not be loaded");
    expect(html).toContain("disabled");
    expect(html).not.toContain("No watches found");
  });
});
