import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { InventoryItem } from "@shared/schema";
import { RecentlySold } from "./recently-sold";

vi.mock("wouter", () => ({
  Link: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) =>
    <a href={href} className={className}>{children}</a>,
}));

const now = new Date("2026-10-20T12:00:00Z");
const watch = (id: number, soldDate: string | null, deliveredDate: string | null, extra = {}) => ({
  id, brand: "Test", model: `Watch ${id}`, referenceNumber: `REF${id}`, status: "sold",
  purchasePrice: 10000, salePrice: 12000, soldDate, deliveredDate, ...extra,
} as unknown as InventoryItem);
const watches = [
  watch(7, "2026-09-01", null),
  watch(4, "2026-09-27", "2026-10-05"),
  watch(1, "2026-09-30", null),
  watch(6, "2026-09-25", "2026-10-10"),
  watch(2, "2026-09-29", "2026-10-06"),
  watch(5, "2026-09-26", "2026-10-07"),
  watch(3, null, "2026-10-19", { dateSold: "2026-09-28" }),
  watch(8, "2026-10-20", null, { status: "in_stock" }),
];
function render(items = watches, time = now) {
  return renderToStaticMarkup(<RecentlySold watches={items} now={time}
    calcProfit={() => 2000} formatCurrency={value => `EUR ${(value / 100).toFixed(2)}`} />);
}

describe("dashboard Recently Sold", () => {
  it("shows six most recent sold watches, supports both sale dates, and preserves the total and links", () => {
    const originalOrder = watches.map(w => w.id);
    const html = render();
    expect(Array.from(html.matchAll(/href="\/inventory\/(\d+)"/g), match => Number(match[1])))
      .toEqual([1, 2, 3, 4, 5, 6]);
    expect(html).toContain("7 total");
    expect(html).not.toContain("Watch 7");
    expect(html).not.toContain("Watch 8");
    expect(html).toContain("EUR 120.00");
    expect(html).toContain("+EUR 20.00");
    expect(watches.map(w => w.id)).toEqual(originalOrder);
  });

  it("shows delivery-based remaining days, the last day, expired and unconfirmed states", () => {
    const html = render();
    expect(html).toContain("Delivery not confirmed");
    expect(html).toContain("Last day");
    expect(html).toContain("13 days remaining");
    expect(html).toContain("1 day remaining");
    expect(html).toContain("4 days remaining");
    expect(html).toContain("Return window ended");
    expect(html).toContain("Deadline: 20 Oct 2026 (Amsterdam)");
    expect(html).toContain("Deadline: 2 Nov 2026 (Amsterdam)");
    expect(html).toContain("Delivered");
  });

  it("reflects the next Amsterdam date without changing sale or delivery data", () => {
    const items = [watch(1, "2026-09-01", "2026-10-06")];
    expect(render(items, new Date("2026-10-20T21:59:59Z"))).toContain("Last day");
    expect(render(items, new Date("2026-10-20T22:00:00Z"))).toContain("Return window ended");
  });

  it("handles fewer than six sales, missing or invalid dates and the empty state", () => {
    const html = render([watch(1, null, "invalid"), watch(2, "invalid", null)]);
    expect(Array.from(html.matchAll(/href="\/inventory\//g))).toHaveLength(2);
    expect(html).toContain("Delivery not confirmed");
    expect(html).not.toContain("Invalid Date");
    expect(render([])).toContain("No watches sold yet.");
  });
});
