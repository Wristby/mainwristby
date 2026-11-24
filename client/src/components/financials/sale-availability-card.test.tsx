import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { InventorySaleWithReturns } from "@shared/sales-lifecycle";
import { calculateSaleAvailability } from "@shared/sale-availability";
import { SaleAvailabilityCard } from "./sale-availability-card";

const formatCurrency = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const sale = (overrides: Partial<InventorySaleWithReturns> = {}): InventorySaleWithReturns => ({
  id: 1,
  inventoryId: null,
  cycleNumber: 1,
  brandSnapshot: "Omega",
  modelSnapshot: "Seamaster",
  referenceNumberSnapshot: "210.30",
  serialNumberSnapshot: null,
  salePrice: 1_000_000,
  soldTo: null,
  buyerId: null,
  platformFees: 65_000,
  chrono24FeeRate: 650,
  shippingFee: 0,
  insuranceFee: 0,
  soldDate: new Date("2026-03-01T00:00:00.000Z"),
  soldPlatform: "Chrono24",
  shippingPartner: null,
  trackingNumber: null,
  dateShipped: null,
  deliveredDate: "2026-03-02",
  purchaseDateSnapshot: null,
  dateListedSnapshot: null,
  purchasePriceSnapshot: 700_000,
  importFeeSnapshot: 0,
  serviceFeeSnapshot: 0,
  polishFeeSnapshot: 0,
  watchRegisterFeeSnapshot: 0,
  watchRegisterSnapshot: false,
  acquisitionCostCents: 700_000,
  profitAtSaleCents: 220_000,
  createdAt: new Date("2026-03-01T00:00:00.000Z"),
  updatedAt: new Date("2026-03-02T00:00:00.000Z"),
  returns: [],
  ...overrides,
});

describe("SaleAvailabilityCard", () => {
  it("shows held proceeds, release timing, and clarifies the balance is not a payout balance", () => {
    const summary = calculateSaleAvailability([sale()], new Date("2026-03-10T12:00:00.000Z"));
    const html = renderToStaticMarkup(
      <SaleAvailabilityCard summary={summary} isLoading={false} isError={false} formatCurrency={formatCurrency} />,
    );
    expect(html).toContain("Incoming Sale Proceeds");
    expect(html).toContain("Inside return window");
    expect(html).toContain("Total proceeds in pipeline");
    expect(html).toContain("€9350.00");
    expect(html).toContain("€9350.00");
    expect(html).toContain("Available 17 Mar 2026 · 7 days");
    expect(html).toContain("shown as it moves toward payout");
    expect(html).toContain("Delivery-to-release timeline");
    expect(html).toContain("Return period · day 8 · 7 days until release");
    expect(html).toContain("Day 14 · return period ends");
    expect(html).toContain("Day 17 · payout ends");
    expect(html).toContain('data-testid="sale-timeline-entry-1"');
  });

  it("shows one combined total across the active proceeds stages", () => {
    const summary = calculateSaleAvailability([
      sale({ id: 1, deliveredDate: null }),
      sale({ id: 2, deliveredDate: "2026-03-02" }),
      sale({ id: 3, deliveredDate: "2026-02-22" }),
    ], new Date("2026-03-10T12:00:00.000Z"));
    const html = renderToStaticMarkup(
      <SaleAvailabilityCard summary={summary} isLoading={false} isError={false} formatCurrency={formatCurrency} />,
    );
    expect(html).toContain("€28050.00");
    expect(html).toContain("3 sales");
  });

  it("shows clear error and no-sale states", () => {
    const summary = calculateSaleAvailability([]);
    const errorHtml = renderToStaticMarkup(
      <SaleAvailabilityCard summary={summary} isLoading={false} isError formatCurrency={formatCurrency} />,
    );
    expect(errorHtml).toContain("Sale availability could not be loaded");

    const emptyHtml = renderToStaticMarkup(
      <SaleAvailabilityCard summary={summary} isLoading={false} isError={false} formatCurrency={formatCurrency} />,
    );
    expect(emptyHtml).toContain("No sale proceeds to track yet");
  });

  it("renders only the quick-glance summary in compact mode", () => {
    const summary = calculateSaleAvailability([sale()], new Date("2026-03-10T12:00:00.000Z"));
    const html = renderToStaticMarkup(
      <SaleAvailabilityCard summary={summary} isLoading={false} isError={false} formatCurrency={formatCurrency} compact />,
    );
    expect(html).toContain("Awaiting delivery");
    expect(html).toContain("Inside return window");
    expect(html).toContain("Cleared from return hold");
    expect(html).not.toContain("Delivery-to-release timeline");
    expect(html).not.toContain("Upcoming releases");
  });
});
