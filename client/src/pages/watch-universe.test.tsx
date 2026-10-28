import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactElement, ReactNode } from "react";
import type { WatchUniverseSource } from "@/lib/watch-universe";

const harness = vi.hoisted(() => ({
  inventory: [] as WatchUniverseSource[],
  settings: { chrono24_commission: 6.5, watch_register_fee: 600 },
  states: [] as unknown[],
  index: 0,
  now: new Date("2026-10-28T12:00:00Z"),
  navigate: vi.fn(),
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
  useInventory: () => ({ data: harness.inventory, isLoading: false, isError: false, refetch: vi.fn() }),
}));
vi.mock("@/hooks/use-settings", () => ({
  useSettings: () => ({ settings: harness.settings, isLoading: false, isError: false, refetch: vi.fn() }),
}));
vi.mock("@/hooks/use-amsterdam-clock", () => ({
  useAmsterdamClock: () => harness.now,
}));
vi.mock("wouter", () => ({
  Link: "a",
  useLocation: () => ["/watch-universe", harness.navigate],
}));
vi.mock("recharts", () => ({
  CartesianGrid: "cartesian-grid",
  ReferenceLine: "reference-line",
  ResponsiveContainer: "responsive-container",
  Scatter: "scatter",
  ScatterChart: "scatter-chart",
  Tooltip: "chart-tooltip",
  XAxis: "x-axis",
  YAxis: "y-axis",
  ZAxis: "z-axis",
}));

import WatchUniverse from "./watch-universe";

const makeWatch = (id: number, brand: string, model: string): WatchUniverseSource => ({
  id,
  brand,
  model,
  referenceNumber: `REF-${id}`,
  status: "in_stock",
  archivedAt: null,
  dateListed: new Date("2026-10-20T12:00:00Z"),
  listPrice: 1_500_000,
  purchasePrice: 1_000_000,
  importFee: 0,
  serviceFee: 0,
  polishFee: 0,
  watchRegister: false,
  watchRegisterFeeSnapshot: null,
  platformFees: 0,
  shippingFee: 0,
  insuranceFee: 0,
  chrono24FeeRate: null,
});

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

function render() {
  harness.index = 0;
  return WatchUniverse();
}

describe("Watch Universe page", () => {
  beforeEach(() => {
    harness.inventory = [makeWatch(1, "Rolex", "Submariner"), makeWatch(2, "Omega", "Seamaster")];
    harness.states = [];
    harness.index = 0;
    harness.navigate.mockReset();
  });

  it("shows live watch names, references, and accessible detail links", () => {
    const tree = render();
    const html = text(tree);
    expect(html).toContain("Watch Universe");
    expect(html).toContain("Submariner");
    expect(html).toContain("Seamaster");
    const links = nodes(tree).filter((node) => node.type === "a");
    expect(links.map((link) => link.props.href)).toContain("/inventory/1");
    expect(links.map((link) => link.props.href)).toContain("/inventory/2");
  });

  it("filters the watch list by search and opens a watch from a bubble", () => {
    const tree = render();
    const search = nodes(tree).find((node) => node.type === "input" && node.props["aria-label"] === "Search brand, model, or reference");
    expect(search).toBeDefined();
    search!.props.onChange({ target: { value: "Omega" } });

    const filtered = render();
    const html = text(filtered);
    expect(html).toContain("Seamaster");
    expect(html).not.toContain("Submariner");
    const scatter = nodes(filtered).find((node) => node.type === "scatter" && node.props.data?.length);
    expect(scatter).toBeDefined();
    scatter!.props.onClick(scatter!.props.data[0]);
    expect(harness.navigate).toHaveBeenCalledWith("/inventory/2");
  });

  it("shows an empty state when the inventory has no eligible listings", () => {
    harness.inventory = [makeWatch(3, "Cartier", "Tank")];
    harness.inventory[0].listPrice = null;
    const html = text(render());
    expect(html).toContain("No eligible watches yet");
    expect(html).toContain("positive list price");
  });
});
