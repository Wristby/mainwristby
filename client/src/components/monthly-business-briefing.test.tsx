import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { NotebookReport } from "@shared/dealers-notebook";
import { MonthlyBusinessBriefing } from "./monthly-business-briefing";

vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const report = {
  period: {
    monthKeys: ["2026-10"],
    label: "October 2026",
    salesCount: 2,
    pricedSalesCount: 2,
    revenueCents: 500_000,
    netProfitCents: 80_000,
    marginPercent: 16,
    medianDaysListed: 12,
    daysSampleCount: 2,
    salesWithPriceHistory: 2,
    salesWithPriceReductions: 1,
    priceReductionCount: 2,
    brands: [],
  },
  comparison: {
    monthKeys: ["2026-09"],
    label: "September 2026",
    salesCount: 1,
    pricedSalesCount: 1,
    revenueCents: 200_000,
    netProfitCents: 30_000,
    marginPercent: 15,
    medianDaysListed: 20,
    daysSampleCount: 1,
    salesWithPriceHistory: 1,
    salesWithPriceReductions: 0,
    priceReductionCount: 0,
    brands: [],
  },
  currentStock: { activeListings: 2, listedCapitalCents: 400_000, candidates: [] },
  inventorySnapshots: [],
  currentOperations: {
    capturedAt: "2026-11-25T12:00:00.000Z",
    inventory: {
      incomingCount: 1,
      receivedCount: 1,
      servicingCount: 0,
      listedCount: 2,
      listedWithoutPriceCount: 1,
    },
    saleProceeds: {
      awaitingDeliveryCount: 1,
      awaitingDeliveryCents: 100_000,
      inReturnWindowCount: 1,
      inReturnWindowCents: 200_000,
      clearedCount: 0,
      clearedCents: 0,
      trackedSaleCount: 2,
      trackedCents: 300_000,
      needsReviewCount: 0,
    },
  },
  overview: "Sales improved, with more profit recorded this month.",
  wins: [],
  challenges: [],
  improvements: [],
  recommendations: [],
  evidence: {},
  dataCaveats: [],
  generatedAt: "2026-11-25T12:00:00.000Z",
} satisfies NotebookReport;

describe("MonthlyBusinessBriefing", () => {
  it("shows saved monthly performance, the operations snapshot, and the full review link", () => {
    const html = renderToStaticMarkup(
      <MonthlyBusinessBriefing monthKey="2026-10" report={report} isLoading={false} isError={false} onRetry={vi.fn()} />,
    );

    expect(html).toContain("October 2026");
    expect(html).toContain("Sales improved");
    expect(html).toContain("Watches sold");
    expect(html).toContain("5.000,00");
    expect(html).toContain("800,00");
    expect(html).toContain("Open full review");
    expect(html).toContain("/dealers-notebook?month=2026-10");
  });

  it("does not generate a report automatically when none is saved", () => {
    const html = renderToStaticMarkup(
      <MonthlyBusinessBriefing monthKey="2026-10" report={null} isLoading={false} isError={false} onRetry={vi.fn()} />,
    );

    expect(html).toContain("No saved review for this month yet");
    expect(html).toContain("Open Notebook");
  });

  it("shows a retry state when the saved review cannot be loaded", () => {
    const html = renderToStaticMarkup(
      <MonthlyBusinessBriefing monthKey="2026-10" report={null} isLoading={false} isError onRetry={vi.fn()} />,
    );

    expect(html).toContain("could not be loaded");
    expect(html).toContain("Retry");
  });
});
