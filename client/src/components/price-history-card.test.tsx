import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PriceHistoryCard } from "./price-history-card";
import type { InventoryPriceHistory } from "@shared/schema";

const baseline: InventoryPriceHistory = {
  id: 1,
  inventoryId: 37,
  listPrice: 1_500_000,
  recordedAt: new Date("2026-01-01T12:00:00Z"),
};
const reduced: InventoryPriceHistory = {
  id: 2,
  inventoryId: 37,
  listPrice: 1_425_000,
  recordedAt: new Date("2026-02-01T12:00:00Z"),
};

describe("pricing history card", () => {
  it("shows saved prices newest first with the reduction and current price marked", () => {
    const html = renderToStaticMarkup(
      <PriceHistoryCard history={[baseline, reduced]} currentListPrice={reduced.listPrice}/>,
    );
    expect(html.indexOf("14.250,00")).toBeLessThan(html.indexOf("15.000,00"));
    expect(html).toContain("Current");
    expect(html).toContain("Lower by");
    expect(html).toContain("750,00");
    expect(html).toContain("5.0%");
    expect(html).toContain("Tracking baseline");
    expect(html).toContain("earlier price changes aren’t available");
  });

  it("shows an increase when a saved asking price rises", () => {
    const higher = { ...reduced, id: 3, listPrice: 1_600_000, recordedAt: new Date("2026-03-01T12:00:00Z") };
    const html = renderToStaticMarkup(
      <PriceHistoryCard history={[baseline, higher]} currentListPrice={higher.listPrice}/>,
    );
    expect(html).toContain("Higher by");
    expect(html).toContain("1.000,00");
  });

  it("explains the empty, loading, and error states", () => {
    expect(renderToStaticMarkup(<PriceHistoryCard currentListPrice={null}/>)).toContain("No listed prices recorded yet");
    expect(renderToStaticMarkup(<PriceHistoryCard currentListPrice={null} isLoading/>)).toContain("Loading price history");
    expect(renderToStaticMarkup(<PriceHistoryCard currentListPrice={null} isError/>)).toContain("Your current price is unchanged");
  });
});
