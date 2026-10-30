import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";
import type { SalesPatternSource } from "@/lib/sales-patterns";

const harness = vi.hoisted(() => ({
  inventory: [] as SalesPatternSource[],
  settings: { watch_register_fee: 600 },
  states: [] as unknown[],
  index: 0,
  inventoryArgs: [] as unknown[],
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const index = harness.index++;
      if (!(index in harness.states)) {
        harness.states[index] = typeof initial === "function" ? (initial as () => unknown)() : initial;
      }
      return [harness.states[index], (value: unknown) => { harness.states[index] = value; }];
    },
    useMemo: (callback: () => unknown) => callback(),
  };
});
vi.mock("@/hooks/use-inventory", () => ({
  useInventory: (status?: string, includeArchived?: boolean) => {
    harness.inventoryArgs = [status, includeArchived];
    return { data: harness.inventory, isLoading: false, isError: false, refetch: vi.fn() };
  },
}));
vi.mock("@/hooks/use-settings", () => ({
  useSettings: () => ({ settings: harness.settings, isLoading: false, isError: false, refetch: vi.fn() }),
}));
vi.mock("wouter", () => ({ Link: "a" }));

import SalesPatterns, { SalesPatternsPreview } from "./sales-patterns";

function makeWatch(overrides: Partial<SalesPatternSource> = {}): SalesPatternSource {
  return {
    id: 1,
    brand: "Rolex",
    model: "Submariner",
    referenceNumber: "126610",
    status: "sold",
    dateListed: new Date("2025-01-01T12:00:00Z"),
    soldDate: new Date("2025-01-31T12:00:00Z"),
    dateSold: null,
    salePrice: 2_000_000,
    soldPrice: null,
    purchasePrice: 1_500_000,
    importFee: 50_000,
    serviceFee: 10_000,
    polishFee: 0,
    platformFees: 20_000,
    shippingFee: 5_000,
    insuranceFee: 0,
    watchRegister: true,
    watchRegisterFeeSnapshot: 6_000,
    ...overrides,
  };
}

function nodes(node: ReactNode): ReactElement<any>[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<any>;
  return [element, ...nodes(element.props.children)];
}

function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join(" ");
  if (node && typeof node === "object" && "props" in node) return text((node as ReactElement<any>).props.children);
  return "";
}

function renderPage() {
  harness.index = 0;
  return SalesPatterns();
}

describe("Sales Patterns page", () => {
  beforeEach(() => {
    harness.inventory = [makeWatch()];
    harness.states = [];
    harness.index = 0;
    harness.inventoryArgs = [];
  });

  it("loads sold records including archived history and renders a brand-by-month map", () => {
    const tree = renderPage();
    expect(harness.inventoryArgs).toEqual(["sold", true]);
    expect(text(tree)).toContain("Brand × sale month");
    expect(text(tree)).toContain("Rolex");
    expect(text(tree)).toContain("Jan");
  });

  it("opens the sold watches behind a selected heatmap cell", () => {
    const tree = renderPage();
    const cell = nodes(tree).find((node) => node.type === "button" && String(node.props["aria-label"]).startsWith("Rolex, Jan:"));
    expect(cell).toBeDefined();
    cell!.props.onClick();

    const selected = renderPage();
    expect(text(selected)).toContain("Selected cell");
    expect(text(selected)).toContain("Submariner");
    const detailLink = nodes(selected).find((node) => node.type === "a" && node.props.href === "/inventory/1");
    expect(detailLink).toBeDefined();
  });

  it("changes the map metric and preserves sample-aware values", () => {
    const tree = renderPage();
    const metric = nodes(tree).find((node) => node.type === "select" && node.props["aria-label"] === "Choose heatmap metric");
    metric!.props.onChange({ target: { value: "days" } });
    const updated = renderPage();
    const cell = nodes(updated).find((node) => node.type === "button" && String(node.props["aria-label"]).startsWith("Rolex, Jan:"));
    expect(cell!.props["aria-label"]).toContain("30d, 1 samples");
  });

  it("explains an empty selected year and lets the user return to all years", () => {
    const tree = renderPage();
    const year = nodes(tree).find((node) => node.type === "select" && node.props["aria-label"] === "Filter by sale year");
    year!.props.onChange({ target: { value: "2026" } });
    const filtered = renderPage();
    expect(text(filtered)).toContain("No sales recorded in 2026");
    const allYearsButton = nodes(filtered).find((node) => node.type === "button" && text(node.props.children).includes("Show all years"));
    expect(allYearsButton).toBeDefined();
    allYearsButton!.props.onClick();
    expect(text(renderPage())).toContain("Rolex");
  });

  it("shows a live month-by-month preview and a link from Analytics", () => {
    harness.index = 0;
    const preview = SalesPatternsPreview({
      inventory: harness.inventory as unknown as import("@shared/schema").InventoryItem[],
      watchRegisterFeeCents: 600,
      periodLabel: "2025",
    });
    expect(text(preview)).toContain("1 sale · 2025");
    expect(nodes(preview).some((node) => node.type === "a" && node.props.href === "/sales-patterns")).toBe(true);
  });
});
