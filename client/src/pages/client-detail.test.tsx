import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Client, InventoryItem } from "@shared/schema";
import type { ReactNode } from "react";
import ClientDetail from "./client-detail";

const state = vi.hoisted(() => ({
  clients: [] as Client[],
  inventory: [] as InventoryItem[],
  clientsError: false,
  inventoryError: false,
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    data: queryKey[0] === "/api/clients" ? state.clients : state.inventory,
    isLoading: false,
    isError: queryKey[0] === "/api/clients" ? state.clientsError : state.inventoryError,
  }),
}));
vi.mock("wouter", () => ({
  useParams: () => ({ id: "12" }),
  useLocation: () => ["/clients/12", vi.fn()],
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/hooks/use-clients", () => ({
  useUpdateClient: () => ({ mutate: vi.fn() }),
  useDeleteClient: () => ({ mutate: vi.fn() }),
}));
vi.mock("@/lib/queryClient", () => ({ queryClient: { invalidateQueries: vi.fn() } }));

const watch = (id: number, extra = {}) => ({
  id, brand: "Fixture", model: `Watch-${id}`, referenceNumber: `REF-${id}`,
  purchasePrice: 100000, salePrice: 123456, soldDate: "2026-10-21",
  status: "sold", clientId: null, buyerId: null, ...extra,
} as unknown as InventoryItem);
const render = () => renderToStaticMarkup(<ClientDetail />);
const sections = (html: string) => ({
  sales: html.split("Watches sold to this client")[1]?.split("Watches bought from this client")[0] ?? "",
  purchases: html.split("Watches bought from this client")[1] ?? "",
});

beforeEach(() => {
  state.clients = [{ id: 12, name: "Renamed client", type: "client", isVip: false } as Client];
  state.inventory = [];
  state.clientsError = false;
  state.inventoryError = false;
});

describe("client watch histories", () => {
  it("shows buyer-only sales by buyerId even after a rename, with date, exact amount and links", () => {
    state.inventory = [watch(1, { buyerId: 12, soldTo: "Old name" }), watch(2, { buyerId: 99 })];
    const { sales, purchases } = sections(render());
    expect(sales).toContain("Watch-1");
    expect(sales).toContain('href="/inventory/1"');
    expect(sales).toContain("21 Oct 2026");
    expect(sales).toContain("1.234,56");
    expect(sales).not.toContain("Watch-2");
    expect(purchases).toContain("No watches bought from this client yet.");
  });

  it("preserves seller-only purchase history separately", () => {
    state.inventory = [watch(1, { clientId: 12, buyerId: 99 })];
    const { sales, purchases } = sections(render());
    expect(sales).toContain("No watches sold to this client yet.");
    expect(purchases).toContain("Watch-1");
    expect(purchases).toContain('href="/inventory/1"');
    expect(purchases).toContain("1.000");
  });

  it("shows both roles independently, including the same watch in each when applicable", () => {
    state.inventory = [watch(1, { clientId: 12 }), watch(2, { buyerId: 12 }), watch(3, { clientId: 12, buyerId: 12 })];
    const { sales, purchases } = sections(render());
    expect(sales).toContain("Watch-2");
    expect(sales).toContain("Watch-3");
    expect(sales).not.toContain("Watch-1");
    expect(purchases).toContain("Watch-1");
    expect(purchases).toContain("Watch-3");
    expect(purchases).not.toContain("Watch-2");
    expect(render()).toContain('mt-1">4</p>');
  });

  it("removes a reversed sale from buyer history and transaction count without changing seller history", () => {
    state.inventory = [watch(1, { buyerId: 12, clientId: 12 })];
    expect(sections(render()).sales).toContain("Watch-1");
    expect(render()).toContain('mt-1">2</p>');
    state.inventory[0].status = "in_stock";
    const html = render();
    expect(sections(html).sales).not.toContain("Watch-1");
    expect(sections(html).sales).toContain("No watches sold to this client yet.");
    expect(sections(html).purchases).toContain("Watch-1");
    expect(html).toContain('mt-1">1</p>');
    expect(state.inventory[0].buyerId).toBe(12);
  });

  it("shows not found for a deleted client without reviving name-only sales", () => {
    state.clients = [];
    state.inventory = [watch(1, { soldTo: "Renamed client" })];
    expect(render()).toContain("Client not found");
    expect(render()).not.toContain("Watch-1");
  });

  it("shows empty histories and excludes legacy name-only sales and same-name clients", () => {
    state.inventory = [watch(1, { soldTo: "Renamed client" }), watch(2, { buyerId: 99, soldTo: "Renamed client" })];
    const before = JSON.stringify(state.inventory);
    const html = render();
    expect(html).toContain("No watches sold to this client yet.");
    expect(html).toContain("No watches bought from this client yet.");
    expect(html).not.toContain("Watch-1");
    expect(html).not.toContain("Watch-2");
    expect(JSON.stringify(state.inventory)).toBe(before);
  });

  it("sorts newest sales first, handles legacy/invalid dates and missing/zero amounts without mutating data", () => {
    state.inventory = [
      watch(1, { buyerId: 12, soldDate: "invalid", dateSold: "2026-01-02", salePrice: null, soldPrice: 120099 }),
      watch(2, { buyerId: 12, soldDate: null, salePrice: null }),
      watch(3, { buyerId: 12, salePrice: 0 }),
    ];
    const html = sections(render()).sales;
    expect(html.indexOf("Watch-3")).toBeLessThan(html.indexOf("Watch-1"));
    expect(html.indexOf("Watch-1")).toBeLessThan(html.indexOf("Watch-2"));
    expect(html).toContain("02 Jan 2026");
    expect(html).toContain("1.200,99");
    expect(html).toContain("0,00");
    expect(html).toContain("Not recorded");
    expect(html).not.toContain("Invalid Date");
    expect(state.inventory.map(item => item.id)).toEqual([1, 2, 3]);
  });

  it("uses a legacy recorded price when modern price is default zero and preserves genuine zeros", () => {
    state.inventory = [
      watch(1, { buyerId: 12, salePrice: 0, soldPrice: 987654 }),
      watch(2, { buyerId: 12, salePrice: 0, soldPrice: null }),
      watch(3, { buyerId: 12, salePrice: 0, soldPrice: 0 }),
      watch(4, { buyerId: 12, salePrice: 123456, soldPrice: 999999 }),
    ];
    const html = sections(render()).sales;
    expect(html).toContain("9.876,54");
    expect(html.match(/>0,00/g)).toHaveLength(2);
    expect(html).toContain("1.234,56");
    expect(html).not.toContain("9.999,99");
  });

  it.each(["clientsError", "inventoryError"] as const)("does not present %s as empty history", key => {
    state[key] = true;
    expect(render()).toContain("Unable to load client history");
    expect(render()).not.toContain("No watches sold");
  });
});
