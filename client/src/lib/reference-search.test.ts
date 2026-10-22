import { describe, expect, it } from "vitest";
import { findReferenceMatches, type ReferenceWatch } from "./reference-search";

const watches: ReferenceWatch[] = [
  { id: 1, brand: "Rolex", model: "Explorer", referenceNumber: "124270", serialNumber: "AAA", status: "sold" },
  { id: 4, brand: "Rolex", model: "Explorer", referenceNumber: "124270", serialNumber: "BBB", status: "in_stock" },
  { id: 7, brand: "Rolex", model: "Explorer II", referenceNumber: "124270-LN", serialNumber: null, status: "incoming" },
  { id: 3, brand: "Cartier", model: "Tank", referenceNumber: "WSTA0052", serialNumber: "CCC", internalSerial: "WB-007", year: 2022, notes: "Blue dial", serviceNotes: "Crown replaced", trackingNumber: "1Z9988", status: "received" },
  { id: 2, brand: "Omega", model: "Seamaster", referenceNumber: "210.30", serialNumber: "DDD", status: "servicing" },
];

describe("dashboard reference lookup", () => {
  it("does not list inventory for blank input or return unrelated results", () => {
    expect(findReferenceMatches(watches, "")).toEqual([]);
    expect(findReferenceMatches(watches, "   ")).toEqual([]);
    expect(findReferenceMatches(watches, "unknown")).toEqual([]);
    expect(findReferenceMatches([], "124270")).toEqual([]);
    expect(findReferenceMatches(watches, "Rolex").map(w => w.id)).toEqual([4, 1, 7]);
    expect(findReferenceMatches(watches, "AAA").map(w => w.id)).toEqual([1]);
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
  it("searches brand, model, serial, internal serial, year, notes, service and tracking", () => {
    for (const query of ["cartier", "tank", "ccc", "wb-007", "2022", "blue dial", "crown", "1z9988"]) {
      expect(findReferenceMatches(watches, query).map(w => w.id)).toEqual([3]);
    }
  });
  it("matches multiple terms across fields, in any order", () => {
    expect(findReferenceMatches(watches, "  TaNk   CARTIER 2022 ").map(w => w.id)).toEqual([3]);
    expect(findReferenceMatches(watches, "Cartier Rolex")).toEqual([]);
    expect(findReferenceMatches(watches, "Rolex sold").map(w => w.id)).toEqual([1]);
  });
  it("handles optional values and treats punctuation as literal text", () => {
    expect(findReferenceMatches(watches, "null")).toEqual([]);
    expect(findReferenceMatches(watches, ".*")).toEqual([]);
    expect(findReferenceMatches(watches, "210.30").map(w => w.id)).toEqual([2]);
  });
  it("prioritizes an exact serial over partial reference matches", () => {
    const duplicate = { ...watches[3], id: 10, referenceNumber: "AAA001", serialNumber: null };
    expect(findReferenceMatches([...watches, duplicate], "AAA").map(w => w.id)).toEqual([1, 10]);
  });
});
