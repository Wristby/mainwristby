import { describe, expect, it } from "vitest";
import type { InventoryItem } from "./schema";
import {
  findNaturalInventoryMatches,
  naturalInventoryFiltersSchema,
  type NaturalInventoryFilters,
} from "./natural-inventory-search";

function makeWatch(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 1,
    brand: "Rolex",
    model: "Submariner Date",
    referenceNumber: "126610LN",
    serialNumber: "ABC123",
    internalSerial: "WR-001",
    year: 2022,
    purchasedFrom: null,
    paidWith: null,
    purchasePrice: 900000,
    importFee: 0,
    watchRegister: false,
    serviceFee: 0,
    polishFee: 0,
    serviceStartDate: null,
    dateSentToService: null,
    dateReturnedFromService: null,
    serviceNotes: null,
    salePrice: 0,
    soldTo: null,
    platformFees: 0,
    chrono24FeeRate: null,
    shippingFee: 0,
    insuranceFee: 0,
    targetSellPrice: 1100000,
    soldPrice: null,
    dateReceived: null,
    purchaseDate: null,
    dateListed: null,
    soldDate: null,
    dateSold: null,
    condition: "Excellent",
    status: "in_stock",
    archivedAt: null,
    box: true,
    papers: true,
    images: null,
    gdriveLink: null,
    notes: null,
    listPrice: 1050000,
    linkCount: null,
    listingTitle: null,
    description: null,
    trackingNumber: null,
    shippingPartner: null,
    soldPlatform: null,
    ...overrides,
  } as InventoryItem;
}

describe("natural inventory filters", () => {
  const watches = [
    makeWatch(),
    makeWatch({
      id: 2,
      brand: "Cartier",
      model: "Santos",
      referenceNumber: "WSSA0037",
      year: 2021,
      status: "sold",
      purchasePrice: 700000,
      listPrice: 950000,
      salePrice: 1000000,
      box: false,
      papers: true,
    }),
  ];

  it("combines brand, status, and asking-price filters", () => {
    const filters: NaturalInventoryFilters = {
      brand: "Rolex",
      status: "in_stock",
      maxPriceEuro: 11000,
    };
    expect(findNaturalInventoryMatches(watches, filters).map((watch) => watch.id)).toEqual([1]);
  });

  it("uses the selected price basis and excludes records without that value", () => {
    expect(findNaturalInventoryMatches(watches, {
      status: "sold",
      minPriceEuro: 9900,
      priceField: "salePrice",
    }).map((watch) => watch.id)).toEqual([2]);
  });

  it("matches reference and serial identifiers", () => {
    expect(findNaturalInventoryMatches(watches, { referenceNumber: "wssa" }).map((watch) => watch.id)).toEqual([2]);
    expect(findNaturalInventoryMatches(watches, { serialNumber: "wr-001" }).map((watch) => watch.id)).toEqual([1]);
  });

  it("rejects unsupported filter keys and inverted ranges", () => {
    expect(naturalInventoryFiltersSchema.safeParse({ status: "in_stock", sql: "anything" }).success).toBe(false);
    expect(naturalInventoryFiltersSchema.safeParse({ minYear: 2025, maxYear: 2020 }).success).toBe(false);
    expect(naturalInventoryFiltersSchema.safeParse({ minPriceEuro: 200, maxPriceEuro: 100 }).success).toBe(false);
  });
});
