import { describe, expect, it } from "vitest";
import { findReferenceMatches, type ReferenceWatch } from "./reference-search";

const watches: ReferenceWatch[] = [
  { id: 1, brand: "Rolex", model: "Explorer", referenceNumber: "124270", serialNumber: "AAA", status: "sold" },
  { id: 4, brand: "Rolex", model: "Explorer", referenceNumber: "124270", serialNumber: "BBB", status: "in_stock" },
  { id: 7, brand: "Rolex", model: "Explorer II", referenceNumber: "124270-LN", serialNumber: null, status: "incoming" },
  { id: 3, brand: "Cartier", model: "Tank", referenceNumber: "WSTA0052", serialNumber: "CCC", status: "received" },
  { id: 2, brand: "Omega", model: "Seamaster", referenceNumber: "210.30", serialNumber: "DDD", status: "servicing" },
];

describe("dashboard reference lookup", () => {
  it("does not list inventory for blank input or return unrelated results", () => {
    expect(findReferenceMatches(watches, "")).toEqual([]);
    expect(findReferenceMatches(watches, "   ")).toEqual([]);
    expect(findReferenceMatches(watches, "unknown")).toEqual([]);
    expect(findReferenceMatches([], "124270")).toEqual([]);
    expect(findReferenceMatches(watches, "Rolex")).toEqual([]);
    expect(findReferenceMatches(watches, "AAA")).toEqual([]);
  });
  it("ignores case and surrounding whitespace", () => {
    expect(findReferenceMatches(watches, " wsta0052 ").map(w => w.id)).toEqual([3]);
    expect(findReferenceMatches(watches, "sta00").map(w => w.id)).toEqual([3]);
  });
  it("prioritizes exact matches, retains duplicates and includes every inventory status", () => {
    expect(findReferenceMatches(watches, "124270").map(w => w.id)).toEqual([4, 1, 7]);
    for (const watch of watches) expect(findReferenceMatches(watches, watch.referenceNumber)).toContain(watch);
    expect(findReferenceMatches([...watches].reverse(), "124270").map(w => w.id)).toEqual([4, 1, 7]);
  });
  it("never mutates source ordering or watch data", () => {
    const snapshot = structuredClone(watches);
    findReferenceMatches(watches, "12");
    expect(watches).toEqual(snapshot);
  });
});
