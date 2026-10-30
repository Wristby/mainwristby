import { describe, expect, it } from "vitest";
import { buildSalesPatternData, type SalesPatternSource } from "./sales-patterns";

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

describe("Sales Patterns data", () => {
  it("groups sold watches by sale month and brand, using legacy sale dates when needed", () => {
    const result = buildSalesPatternData([
      makeWatch(),
      makeWatch({ id: 2, model: "Datejust", soldDate: null, dateSold: "2025-01-15T12:00:00Z" }),
      makeWatch({ id: 3, brand: "Omega", soldDate: "2025-02-10T12:00:00Z" }),
      makeWatch({ id: 4, status: "in_stock" }),
      makeWatch({ id: 5, soldDate: "invalid", dateSold: null }),
    ], 600);

    expect(result.totalSales).toBe(3);
    expect(result.years).toEqual([2025]);
    expect(result.monthlySalesCounts[0]).toBe(2);
    expect(result.monthlySalesCounts[1]).toBe(1);
    expect(result.rows.map((row) => [row.brand, row.totalSales])).toEqual([
      ["Rolex", 2],
      ["Omega", 1],
    ]);
  });

  it("calculates weighted realized margin after all recorded costs and uses the fee snapshot", () => {
    const first = makeWatch();
    const second = makeWatch({
      id: 2,
      salePrice: 4_000_000,
      purchasePrice: 3_800_000,
      importFee: 0,
      serviceFee: 0,
      platformFees: 0,
      shippingFee: 0,
      watchRegister: false,
    });
    const result = buildSalesPatternData([first, second], 999_999);
    const cell = result.rows[0].cells[0];
    const expectedProfit = (2_000_000 - 1_591_000) + (4_000_000 - 3_800_000);
    expect(cell.marginSampleCount).toBe(2);
    expect(cell.marginPercent).toBeCloseTo(expectedProfit / 6_000_000 * 100);
  });

  it("uses the current register fee only when a watch has no saved fee snapshot", () => {
    const watch = makeWatch({ watchRegisterFeeSnapshot: null });
    const result = buildSalesPatternData([watch], 1_200);
    const cell = result.rows[0].cells[0];
    expect(cell.marginPercent).toBeCloseTo((2_000_000 - 1_586_200) / 2_000_000 * 100);
  });

  it("keeps sale counts while leaving unavailable margin and listing-time metrics blank", () => {
    const result = buildSalesPatternData([
      makeWatch({ salePrice: 0, soldPrice: null, dateListed: null }),
      makeWatch({ id: 2, purchasePrice: 0, dateListed: null }),
    ], 600);
    const cell = result.rows[0].cells[0];
    expect(cell.salesCount).toBe(2);
    expect(cell.marginPercent).toBeNull();
    expect(cell.marginSampleCount).toBe(0);
    expect(cell.medianDaysToSell).toBeNull();
    expect(cell.daysToSellSampleCount).toBe(0);
  });

  it("computes median days from listing to sale and supports filtering to a year", () => {
    const result = buildSalesPatternData([
      makeWatch(),
      makeWatch({ id: 2, dateListed: "2025-01-11T12:00:00Z", soldDate: "2025-01-31T12:00:00Z" }),
      makeWatch({ id: 3, soldDate: "2026-01-31T12:00:00Z" }),
    ], 600, 2025);
    const january = result.rows[0].cells[0];
    expect(january.medianDaysToSell).toBe(25);
    expect(january.daysToSellSampleCount).toBe(2);
    expect(january.salesCount).toBe(2);
    expect(result.years).toEqual([2026, 2025]);
  });

  it("does not treat a listing date after the sale date as a valid time-to-sell sample", () => {
    const result = buildSalesPatternData([
      makeWatch({ dateListed: "2025-02-01T12:00:00Z", soldDate: "2025-01-31T12:00:00Z" }),
    ], 600);
    expect(result.rows[0].cells[0].medianDaysToSell).toBeNull();
    expect(result.rows[0].cells[0].salesCount).toBe(1);
  });
});
