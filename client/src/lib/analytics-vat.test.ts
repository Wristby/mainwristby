import { describe, expect, it } from "vitest";
import { summarizeConfirmedSalesVat } from "./analytics-vat";

describe("Analytics VAT estimate", () => {
  it("uses positive per-watch profit for priced sold watches only", () => {
    const result = summarizeConfirmedSalesVat([
      { status: "sold", salePrice: 700_000, purchasePrice: 500_000, platformFees: 10_000 },
      { status: "sold", salePrice: 550_000, purchasePrice: 600_000 },
      { status: "sold", salePrice: null, purchasePrice: 100_000 },
      { status: "in_stock", salePrice: 900_000, purchasePrice: 100_000 },
      { status: "sold", salePrice: 0, soldPrice: 400_000, purchasePrice: 300_000 },
    ], 21, 0);

    expect(result.confirmedSales).toBe(3);
    // €1,900 positive net profit from the first and legacy-price watches; VAT rounds per watch.
    expect(result.vatAmountCents).toBe(Math.round(190_000 * 0.21) + Math.round(100_000 * 0.21));
  });

  it("respects the watch-register fee setting when calculating profit", () => {
    const result = summarizeConfirmedSalesVat([
      { status: "sold", salePrice: 110_000, purchasePrice: 100_000, watchRegister: true },
    ], 21, 6_000);

    expect(result.vatAmountCents).toBe(Math.round(4_000 * 0.21));
  });
});
