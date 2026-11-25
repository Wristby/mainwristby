import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

const harness = vi.hoisted(() => ({
  sales: [] as any[],
  soldWatches: [] as any[],
  inventoryStatus: undefined as string | undefined,
}));

vi.mock("@/hooks/use-sales", () => ({
  useSales: () => ({ data: harness.sales, isLoading: false, isError: false }),
  returnNextActionLabels: { relist: "Ready to relist", service: "Send for service", hold: "Hold for now" },
  returnStatusLabels: { requested: "Requested", received: "Received for inspection" },
}));
vi.mock("@/hooks/use-inventory", () => ({
  useInventory: (status?: string) => {
    harness.inventoryStatus = status;
    return { data: harness.soldWatches };
  },
}));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode; [key: string]: unknown }) =>
    <a href={href} {...props}>{children}</a>,
}));

import ReturnsPage from "./returns";
import type { InventorySaleWithReturns } from "@shared/sales-lifecycle";

const sale = (receivedDate: string | null): InventorySaleWithReturns => ({
  id: 4,
  inventoryId: 17,
  cycleNumber: 1,
  brandSnapshot: "Omega",
  modelSnapshot: "Seamaster",
  referenceNumberSnapshot: "210.30",
  serialNumberSnapshot: null,
  salePrice: 1_000_000,
  soldTo: null,
  buyerId: null,
  platformFees: 0,
  chrono24FeeRate: null,
  shippingFee: 0,
  insuranceFee: 0,
  soldDate: new Date("2026-03-01T00:00:00.000Z"),
  soldPlatform: null,
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
  profitAtSaleCents: 300_000,
  createdAt: new Date("2026-03-01T00:00:00.000Z"),
  updatedAt: new Date("2026-03-02T00:00:00.000Z"),
  returns: [{
    id: 31,
    saleId: 4,
    status: receivedDate ? "received" : "requested",
    requestDate: "2026-03-03",
    reason: "",
    returnShippedDate: null,
    receivedDate,
    carrier: null,
    trackingNumber: null,
    shippingCostCents: 0,
    shippingPayer: "seller",
    refundAmountCents: 0,
    refundDate: null,
    inspectionCondition: null,
    missingItems: null,
    inspectionNotes: null,
    inspectionCostCents: 0,
    nextAction: "relist",
    platformFeeRefunded: false,
    cogsRestoredCents: 0,
    completedDate: null,
    createdAt: new Date("2026-03-03T00:00:00.000Z"),
    updatedAt: new Date("2026-03-03T00:00:00.000Z"),
  }],
});

function render() {
  return renderToStaticMarkup(<ReturnsPage />);
}

describe("Returns page sold-status warning", () => {
  beforeEach(() => {
    harness.sales = [sale("2026-03-04")];
    harness.soldWatches = [{ id: 17, status: "sold" }];
    harness.inventoryStatus = undefined;
  });

  it("warns for a received return whose linked watch is still Sold and links to Watch Details", () => {
    const html = render();

    expect(harness.inventoryStatus).toBe("sold");
    expect(html).toContain("This return has been received, but the watch is still marked Sold");
    expect(html).toContain("remains in current-Sold sales metrics");
    expect(html).toContain('href="/inventory/17"');
    expect(html).toContain("Open Watch Details to update its status");
  });

  it("does not warn before the return is received", () => {
    harness.sales = [sale(null)];

    expect(render()).not.toContain("This return has been received");
  });

  it("does not warn when the linked watch is no longer currently Sold", () => {
    harness.soldWatches = [];

    expect(render()).not.toContain("This return has been received");
  });

  it("does not warn for an older return after the watch has entered a later sale cycle", () => {
    harness.sales = [
      sale("2026-03-04"),
      { ...sale(null), id: 5, cycleNumber: 2, returns: [] },
    ];

    expect(render()).not.toContain("This return has been received");
  });
});
