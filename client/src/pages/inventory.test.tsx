import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";

const harness = vi.hoisted(() => ({
  states: [] as unknown[], index: 0,
  now: new Date("2026-10-20T12:00:00Z"),
  settings: {
    watch_brands: [], sales_platforms: [], shipping_partners: [], purchase_channels: [],
    paid_with_methods: [], default_margin_rate: 10, chrono24_commission: 6.5,
    inventory_export_columns: [] as string[], watch_register_fee: 600,
  },
}));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = harness.index++;
    if (!(index in harness.states)) harness.states[index] = typeof initial === "function" ? initial() : initial;
    return [harness.states[index], (value: unknown) => { harness.states[index] = value; }];
  },
  useMemo: (fn: () => unknown) => fn(),
  useEffect: () => {},
}));
vi.mock("@/hooks/use-amsterdam-clock", () => ({ useAmsterdamClock: () => harness.now }));
vi.mock("@/hooks/use-settings", () => ({
  useSettings: () => ({ settings: harness.settings }), useUpdateSetting: () => ({}),
}));
vi.mock("@/hooks/use-clients", () => ({ useClients: () => ({ data: [] }), useCreateClient: () => ({}) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/inventory"], Link: "a" }));
vi.mock("react-hook-form", () => ({
  Controller: "controller",
  useForm: ({ defaultValues }: { defaultValues: Record<string, unknown> }) => ({
    watch: (key: string) => defaultValues[key], register: () => ({}),
    handleSubmit: () => vi.fn(), formState: { errors: {} }, control: {},
  }),
}));
vi.mock("@/hooks/use-inventory", () => ({
  useCreateInventory: () => ({}),
  useInventory: () => ({
    data: [
      { id: 99, brand: "Rolex", model: "Old", referenceNumber: "A", status: "sold", purchasePrice: 10000, soldDate: "2026-09-01", deliveredDate: "2026-10-05" },
      { id: 1, brand: "Omega", model: "Last day", referenceNumber: "B", status: "sold", purchasePrice: 10000, dateSold: "2026-10-06", deliveredDate: "2026-10-06" },
      { id: 2, brand: "Rolex", model: "Unconfirmed", referenceNumber: "C", status: "sold", purchasePrice: 10000, soldDate: "2026-10-07", deliveredDate: null },
      { id: 3, brand: "Omega", model: "Active", referenceNumber: "D", status: "sold", purchasePrice: 10000, soldDate: "2026-10-05", deliveredDate: "2026-10-10" },
      { id: 4, brand: "Rolex", model: "Listed", referenceNumber: "E", status: "in_stock", purchasePrice: 10000 },
    ],
  }),
}));

import Inventory from "./inventory";
import { Select, SelectItem } from "@/components/ui/select";
import { TableRow } from "@/components/ui/table";
import { RowLink } from "@/components/row-link";
import { Input } from "@/components/ui/input";

function nodes(node: ReactNode): ReactElement<any>[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<any>;
  return [element, ...nodes(element.props.children)];
}
function render() {
  harness.index = 0;
  return Inventory();
}
function select(tree: ReactNode, option: string) {
  return nodes(tree).filter(node => node.type === Select &&
    nodes(node.props.children).some(child => child.type === SelectItem && child.props.value === option)).at(-1)!;
}
function ids(tree: ReactNode) {
  return nodes(tree).filter(node => node.type === RowLink).map(node => Number(node.props.href.split("/").pop()));
}
function sold() {
  select(render(), "sold").props.onValueChange("sold");
  return render();
}
function deadlineButton(tree: ReactNode) {
  return nodes(tree).find(node => node.type === "button" && node.props["aria-label"]?.startsWith("Sort by return deadline"))!;
}
function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join(" ");
  if (node && typeof node === "object" && "props" in node) return text((node as ReactElement<any>).props.children);
  return "";
}
describe("Sold list controls", () => {
  afterEach(() => vi.unstubAllGlobals());
  beforeEach(() => {
    harness.states = [];
    harness.now = new Date("2026-10-20T12:00:00Z");
  });
  it("defaults Sold to newest sale first and sorts deadlines both ways, with unknown deliveries last", () => {
    let tree = sold();
    expect(ids(tree)).toEqual([2, 1, 3, 99]);
    deadlineButton(tree).props.onClick();
    tree = render();
    expect(ids(tree)).toEqual([99, 1, 3, 2]);
    deadlineButton(tree).props.onClick();
    expect(ids(render())).toEqual([3, 1, 99, 2]);
  });
  it("composes return-state and search filters and removes last-day watches at Amsterdam midnight", () => {
    select(sold(), "active").props.onValueChange("active");
    let tree = render();
    expect(ids(tree)).toEqual([1, 3]);
    harness.now = new Date("2026-10-20T22:00:00Z");
    expect(ids(render())).toEqual([3]);
    select(render(), "unconfirmed").props.onValueChange("unconfirmed");
    tree = render();
    expect(ids(tree)).toEqual([2]);
    nodes(tree).find(node => node.type === Input && node.props.value === "")!
      .props.onChange({ target: { value: "Omega" } });
    expect(ids(render())).toEqual([]);
  });
  it("clears Sold-only filters and sorting when leaving Sold, and keeps rows as native links", () => {
    let tree = sold();
    deadlineButton(tree).props.onClick();
    select(render(), "active").props.onValueChange("active");
    select(render(), "sold").props.onValueChange("all");
    tree = render();
    expect(ids(tree)).toEqual([99, 4, 3, 2, 1]);
    expect(deadlineButton(tree)).toBeUndefined();
    expect(nodes(tree).filter(node => node.type === TableRow && node.key !== null).every(node => !node.props.onClick)).toBe(true);
    select(tree, "sold").props.onValueChange("sold");
    expect(ids(render())).toEqual([2, 1, 3, 99]);
  });
  it("renders unconfirmed, last-day, active and ended summaries with delivery dates and deadlines", () => {
    const summaries = nodes(sold()).filter(node => typeof node.type === "function" && node.type.name === "SoldReturnSummary");
    const labels = summaries.map(node => text((node.type as Function)(node.props)));
    expect(labels[0]).toBe("Delivery not confirmed");
    expect(labels[1]).toContain("Last day");
    expect(labels[1]).toContain("6 Oct 2026");
    expect(labels[1]).toContain("20 Oct 2026");
    expect(labels[1]).toContain("(Amsterdam)");
    expect(labels[2]).toContain("4 days remaining");
    expect(labels[3]).toContain("Return window ended");
  });
  it("exports only the filtered watches in current order with the existing configurable columns", async () => {
    let blob: Blob | undefined;
    const link = { setAttribute: vi.fn(), click: vi.fn() };
    vi.stubGlobal("document", {
      createElement: () => link,
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    });
    vi.stubGlobal("URL", {
      createObjectURL: (value: Blob) => { blob = value; return "blob:test"; },
      revokeObjectURL: vi.fn(),
    });
    const original = harness.settings.inventory_export_columns;
    harness.settings.inventory_export_columns = ["ID", "Brand", "Sold Date"];
    try {
      select(sold(), "active").props.onValueChange("active");
      deadlineButton(render()).props.onClick();
      const tree = render();
      nodes(tree).find(node => typeof node.props.onClick === "function" && text(node).includes("Export CSV"))!.props.onClick();
      expect(await blob!.text()).toBe('ID,Brand,Sold Date\n1,"Omega",2026-10-06\n3,"Omega",2026-10-05');
      expect(link.click).toHaveBeenCalledOnce();
    } finally {
      harness.settings.inventory_export_columns = original;
    }
  });
});
