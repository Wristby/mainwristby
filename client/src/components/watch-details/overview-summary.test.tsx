import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { InventoryItem } from "@shared/schema";
import { OverviewSummary } from "./overview-summary";

const baseItem = {
  id: 42,
  brand: "Omega",
  model: "Seamaster",
  referenceNumber: "210.30.42.20.01.001",
  serialNumber: "OMEGA-42",
  year: 2021,
  condition: "Very Good",
  status: "sold",
  purchaseDate: "2026-04-12",
  dateReceived: "2026-04-15",
  dateListed: "2026-04-20",
  soldDate: "2026-11-01",
  deliveredDate: "2026-11-10",
  buyerId: 8,
  soldTo: "Morgan Buyer",
  listPrice: 150_000,
  purchasePrice: 100_000,
  salePrice: 120_000,
  box: true,
  papers: true,
  storeWarrantyMonths: 12,
  manufacturerPurchaseDate: null,
  manufacturerWarrantyExpires: null,
  manufacturerWarrantyCardPresent: false,
  manufacturerWarrantyDetails: null,
} as unknown as InventoryItem;

const render = (item: InventoryItem, buyer?: { id: number; name: string }) => renderToStaticMarkup(
  <OverviewSummary
    item={item}
    buyer={buyer as any}
    buyerLoading={false}
    buyerUnavailable={false}
    now={new Date("2026-11-20T12:00:00Z")}
    holdTime={item.dateReceived ? 200 : null}
    salePrice={120_000}
    profit={20_000}
    margin={16.7}
    formatCurrency={(cents) => `€${(cents / 100).toFixed(2)}`}
    onOpenSection={() => {}}
  />,
);

describe("Watch Details overview summary", () => {
  it("uses the saved watch, buyer, sale, delivery, return, and warranty values", () => {
    const html = render(baseItem, { id: 8, name: "Morgan Buyer" });
    expect(html).toContain("Omega Seamaster");
    expect(html).toContain("210.30.42.20.01.001");
    expect(html).toContain("Morgan Buyer");
    expect(html).toContain("Sale price");
    expect(html).toContain("Net profit");
    expect(html).toContain("€1200.00");
    expect(html).toContain("€200.00");
    expect(html).toContain("Full Set");
    expect(html).toContain("Hold time · 200 days");
    expect(html).not.toContain("Rolex Submariner");
  });

  it("keeps unsold and missing-sale details distinct from a realized sale", () => {
    const unsold = {
      ...baseItem,
      status: "in_stock",
      soldDate: null,
      deliveredDate: null,
      buyerId: null,
      soldTo: null,
      salePrice: 0,
      listPrice: 150_000,
      papers: false,
    } as unknown as InventoryItem;
    const html = render(unsold);
    expect(html).toContain("Box only");
    expect(html).toContain("Hold time");
    expect(html).toContain("COGS");
    expect(html).toContain("Asking price");
    expect(html).toContain("€1000.00");
    expect(html).toContain("€1500.00");
    expect(html).not.toContain("Net profit");
    expect(html).not.toContain("Sale price");
    expect(html).not.toContain("Return window · not applicable");
  });
});
