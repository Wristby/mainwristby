import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NotebookInventorySnapshots } from "./notebook-inventory-snapshots";
import type { NotebookInventorySnapshot } from "@shared/dealers-notebook";

const snapshot: NotebookInventorySnapshot = {
  monthKey: "2026-09", savedAt: "2026-09-30T21:59:59.000Z",
  activeWatchCount: 2, listedWatchCount: 1, costBasisCents: 200_125, listingValueCents: 150_099,
  watches: [
    { brand: "Omega", model: "Tank", condition: "Excellent", isListed: true, costBasisCents: 100_000, listPriceCents: 150_099 },
    { brand: "Rolex", model: "Explorer", condition: "Good", isListed: false, costBasisCents: 100_125, listPriceCents: null },
  ],
  dataCaveats: ["Fixture cost basis policy"],
};

describe("month-end inventory evidence", () => {
  const render = (overrides: Partial<React.ComponentProps<typeof NotebookInventorySnapshots>> = {}) =>
    renderToStaticMarkup(<NotebookInventorySnapshots
      monthKey="2026-09" snapshot={snapshot} comparisonSnapshots={[{ monthKey: "2026-08", snapshot: null }]}
      canCapture={false} busy={false} onCapture={vi.fn()} {...overrides} />);

  it("shows immutable recorded totals, asking prices, missing prices and missing comparison snapshots", () => {
    const html = render();
    for (const text of ["Saved separately from live inventory", "2,001.25", "1,500.99", "Omega", "Explorer",
      "Price not recorded", "September 2026", "August 2026", "historical inventory is unknown",
      "Fixture cost basis policy", "Refreshing the review does not replace", "Europe/Amsterdam"]) {
      expect(html).toContain(text);
    }
    expect(html).not.toContain("Save month-end inventory</button>");
  });

  it("makes actual zero stock different from a missing snapshot", () => {
    const html = render({ snapshot: { ...snapshot, activeWatchCount: 0, listedWatchCount: 0, costBasisCents: 0, listingValueCents: 0, watches: [] }, comparisonSnapshots: [] });
    expect(html).toContain("No active watches were recorded at capture time.");
    expect(html).not.toContain("historical inventory is unknown");
  });

  it("explains unavailable historical stock without suggesting regeneration can create it", () => {
    const html = render({ snapshot: null });
    expect(html).toContain("cannot be reconstructed reliably");
    expect(html).toContain("will not fabricate a snapshot");
  });

  it("offers capture on the final day with an irreversible-save warning and pending state", () => {
    const html = render({ snapshot: null, monthKey: "9999-12", canCapture: true });
    expect(html).toContain("Save month-end inventory");
    expect(html).toContain("It cannot be replaced");
    const pending = render({ snapshot: null, monthKey: "9999-12", canCapture: true, busy: true });
    expect(pending).toContain("disabled");
    expect(pending).toContain("Saving inventory");
  });
});
