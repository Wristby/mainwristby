import { describe, expect, it } from "vitest";
import { buyerReviewSchema, planLegacyBuyers, possibleBuyerNameMatch, type LegacyBuyerWatch } from "@shared/client-backfill";

const watch = (id: number, name: string | null, buyerId: number | null = null): LegacyBuyerWatch => ({
  id, soldTo: name, buyerId, brand: "Cartier", model: "Tank", referenceNumber: "TEST",
});
const contact = { id: 4, name: "José Smith", email: "saved@example.invalid", phone: null, country: null };

describe("historical buyer planning", () => {
  it("only auto-creates unique named buyers without possible matches", () => {
    const plan = planLegacyBuyers([
      watch(1, "Unique Person"), watch(2, "JOSE  SMITH"),
      watch(3, "Repeated Name"), watch(4, "repeated name"),
      watch(5, null), watch(6, "   "), watch(7, "N/A"), watch(8, "Already linked", 4),
    ], [contact]);
    expect(plan.ready.map(row => row.watch.id)).toEqual([1]);
    expect(plan.pending.map(row => row.watch.id)).toEqual([2, 3, 4]);
    expect(plan.pending[0].matches).toEqual([contact]);
    expect(plan.pending[1].repeatedName).toBe(true);
  });
  it("uses names as conservative review hints, not automatic links", () => {
    expect(possibleBuyerNameMatch("José Smith", "smith jose")).toBe(true);
    expect(possibleBuyerNameMatch("Alex", "Alex Example")).toBe(true);
    expect(possibleBuyerNameMatch("Jane", "Janet")).toBe(false);
    expect(possibleBuyerNameMatch("", "")).toBe(false);
  });
  it("does not mutate historical snapshots or existing contact details", () => {
    const watches = [watch(1, "  José Smith  ")], contacts = [contact];
    const before = structuredClone({ watches, contacts });
    planLegacyBuyers(watches, contacts);
    expect({ watches, contacts }).toEqual(before);
  });
  it("requires a specific watch, snapshot and explicit review action", () => {
    expect(buyerReviewSchema.safeParse({ action: "link", watchId: 1, expectedName: "Name" }).success).toBe(false);
    expect(buyerReviewSchema.safeParse({ action: "create", watchId: -1, expectedName: "" }).success).toBe(false);
    expect(buyerReviewSchema.parse({ action: "create", watchId: 1, expectedName: "Name" }).action).toBe("create");
  });
});
