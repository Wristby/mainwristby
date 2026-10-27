import { describe, expect, it } from "vitest";
import type { InventoryItem } from "@shared/schema";
import {
  findNaturalInventoryMatches,
  getNaturalInventoryAggregate,
  naturalInventoryFiltersSchema,
  naturalInventorySearchIntentSchema,
  type NaturalInventoryFilters,
} from "@shared/natural-inventory-search";

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

describe("natural inventory search and summaries", () => {
  const watches = [
    makeWatch(),
    makeWatch({
      id: 2,
      brand: "Cartier",
      model: "Santos",
      referenceNumber: "WSSA0037",
      internalSerial: null,
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

  it("counts sold watches in a requested year using their sale date", () => {
    const records = [
      makeWatch({ id: 1, status: "sold", soldDate: new Date("2026-04-10T12:00:00Z") }),
      makeWatch({ id: 2, status: "sold", soldDate: null, dateSold: new Date("2025-12-31T12:00:00Z") }),
      makeWatch({ id: 3, status: "in_stock", soldDate: new Date("2026-04-10T12:00:00Z") }),
    ];
    const filters = { status: "sold", soldYear: 2026 } as const;

    expect(findNaturalInventoryMatches(records, filters).map((watch) => watch.id)).toEqual([1]);
    expect(getNaturalInventoryAggregate(records, filters, "count")).toEqual({ type: "count", value: 1 });
  });

  it("groups matching records by validated inventory fields", () => {
    const records = [
      makeWatch({ id: 1, brand: "Rolex", status: "in_stock" }),
      makeWatch({ id: 2, brand: "rolex", status: "in_stock" }),
      makeWatch({ id: 3, brand: "Cartier", status: "sold" }),
      makeWatch({ id: 4, brand: "Omega", status: "in_stock" }),
    ];

    expect(getNaturalInventoryAggregate(records, { status: "in_stock" }, "count", "brand")).toEqual({
      type: "grouped_count",
      field: "brand",
      groups: [
        { label: "Omega", count: 1 },
        { label: "Rolex", count: 2 },
      ],
      total: 3,
    });
    expect(getNaturalInventoryAggregate(records, {}, "count", "status")).toEqual({
      type: "grouped_count",
      field: "status",
      groups: [
        { label: "in stock", count: 3 },
        { label: "sold", count: 1 },
      ],
      total: 4,
    });
    expect(getNaturalInventoryAggregate([], {}, "count", "brand")).toEqual({
      type: "grouped_count",
      field: "brand",
      groups: [],
      total: 0,
    });
  });

  it("totals recorded asking prices and reports records with missing prices", () => {
    const records = [
      makeWatch({ id: 1, listPrice: 1050000 }),
      makeWatch({ id: 2, listPrice: 50000 }),
      makeWatch({ id: 3, listPrice: null }),
    ];

    expect(getNaturalInventoryAggregate(records, { brand: "Rolex" }, "asking_price_total")).toEqual({
      type: "asking_price_total",
      valueInCents: 1100000,
      pricedCount: 2,
      missingPriceCount: 1,
    });
  });

  it("totals recorded asking prices by an allowed group and reports missing prices per group", () => {
    const records = [
      makeWatch({ id: 1, brand: "Rolex", listPrice: 1050000 }),
      makeWatch({ id: 2, brand: "rolex", listPrice: 50000 }),
      makeWatch({ id: 3, brand: "Cartier", listPrice: 900000 }),
      makeWatch({ id: 4, brand: "Cartier", listPrice: null }),
    ];

    expect(getNaturalInventoryAggregate(records, {}, "asking_price_total", "brand")).toEqual({
      type: "grouped_asking_price_total",
      field: "brand",
      groups: [
        { label: "Cartier", valueInCents: 900000, pricedCount: 1, missingPriceCount: 1, watchCount: 2 },
        { label: "Rolex", valueInCents: 1100000, pricedCount: 2, missingPriceCount: 0, watchCount: 2 },
      ],
      total: 4,
    });
    expect(getNaturalInventoryAggregate([], {}, "asking_price_total", "brand")).toEqual({
      type: "grouped_asking_price_total",
      field: "brand",
      groups: [],
      total: 0,
    });
  });

  it("rejects unsupported filters, aggregates, and inverted ranges", () => {
    expect(naturalInventoryFiltersSchema.safeParse({ status: "in_stock", sql: "anything" }).success).toBe(false);
    expect(naturalInventoryFiltersSchema.safeParse({ minYear: 2025, maxYear: 2020 }).success).toBe(false);
    expect(naturalInventoryFiltersSchema.safeParse({ minPriceEuro: 200, maxPriceEuro: 100 }).success).toBe(false);
    expect(naturalInventoryFiltersSchema.safeParse({ soldYear: 2026 }).success).toBe(false);
    expect(naturalInventorySearchIntentSchema.safeParse({ filters: {}, aggregate: "average_price" }).success).toBe(false);
    expect(naturalInventorySearchIntentSchema.safeParse({ filters: {}, total: 5 }).success).toBe(false);
    expect(naturalInventorySearchIntentSchema.safeParse({ filters: {}, aggregate: "count", groupBy: "brand" }).success).toBe(true);
    expect(naturalInventorySearchIntentSchema.safeParse({ filters: {}, aggregate: "asking_price_total", groupBy: "brand" }).success).toBe(true);
    expect(naturalInventorySearchIntentSchema.safeParse({ filters: {}, groupBy: "brand" }).success).toBe(false);
    expect(naturalInventorySearchIntentSchema.safeParse({ filters: {}, aggregate: "count", groupBy: "serialNumber" }).success).toBe(false);
  });
});
