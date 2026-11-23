import { describe, expect, it } from "vitest";
import { matchesInventoryStatus } from "./inventory-status-filter";

describe("matchesInventoryStatus", () => {
  it("matches both incoming and received watches for the combined filter", () => {
    expect(matchesInventoryStatus("incoming", "incoming_received")).toBe(true);
    expect(matchesInventoryStatus("received", "incoming_received")).toBe(true);
    expect(matchesInventoryStatus("in_stock", "incoming_received")).toBe(false);
  });

  it("preserves the existing all and individual status filters", () => {
    expect(matchesInventoryStatus("sold", "all")).toBe(true);
    expect(matchesInventoryStatus("in_stock", "in_stock")).toBe(true);
    expect(matchesInventoryStatus("incoming", "received")).toBe(false);
  });
});
