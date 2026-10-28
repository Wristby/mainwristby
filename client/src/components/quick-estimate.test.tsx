import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-settings", () => ({
  useSettings: () => ({
    settings: {
      quick_estimate_platform_fees: [],
      watch_register_fee: 600,
      vat_rate: 21,
    },
  }),
}));

import { calculateQuickEstimate, QuickEstimate } from "./quick-estimate";

describe("quick estimate VAT", () => {
  it("shows before-VAT profit, estimated VAT, and after-VAT profit without a calculate button", () => {
    const html = renderToStaticMarkup(<QuickEstimate initialBuyPriceCents={500_000} />);

    expect(html).toContain("Profit Before VAT");
    expect(html).toContain("Estimated VAT (21%)");
    expect(html).toContain("Net After VAT");
    expect(html).not.toContain("Calculate Estimate");
  });

  it("uses the configured VAT rate and rounds in cents", () => {
    const result = calculateQuickEstimate({
      buyPrice: 5_000,
      serviceCost: 100,
      salePrice: 7_000,
      shipping: 0,
      selectedPlatform: null,
      watchRegister: false,
      watchRegisterFeeCents: 600,
      vatRate: 21,
    });

    expect(result.profitBeforeVat).toBe(1_900);
    expect(result.vatAmount).toBe(399);
    expect(result.netAfterVat).toBe(1_501);
  });

  it("does not estimate VAT on a loss", () => {
    const result = calculateQuickEstimate({
      buyPrice: 5_000,
      serviceCost: 0,
      salePrice: 4_000,
      shipping: 0,
      selectedPlatform: null,
      watchRegister: false,
      watchRegisterFeeCents: 600,
      vatRate: 21,
    });

    expect(result.profitBeforeVat).toBe(-1_000);
    expect(result.vatAmount).toBe(0);
    expect(result.netAfterVat).toBe(-1_000);
  });
});
