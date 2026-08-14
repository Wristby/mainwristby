/**
 * VAT and profit calculations for a watch inventory item.
 *
 * All monetary values are in euro cents (integers).
 * vatRate is a percentage (e.g. 21 means 21 %).
 *
 * Rules:
 *  - If the watch has no sale price recorded (salePrice = 0), profit is 0.
 *  - If profit ≤ 0, vatAmount is 0 (VAT is only due on a positive margin).
 *  - netAfterVat = profit - vatAmount  (can be negative when selling at a loss).
 */

export interface WatchFinancials {
  /** Gross sale price in cents (0 when unsold). */
  salePrice: number;
  /** Sum of all cost lines in cents. */
  totalCosts: number;
  /** VAT rate as a percentage, e.g. 21. */
  vatRate: number;
}

export interface VatResult {
  profit: number;
  vatAmount: number;
  netAfterVat: number;
}

export function computeVat({ salePrice, totalCosts, vatRate }: WatchFinancials): VatResult {
  const profit = salePrice > 0 ? salePrice - totalCosts : 0;
  const vatAmount = profit > 0 ? Math.round(profit * (vatRate / 100)) : 0;
  const netAfterVat = profit - vatAmount;
  return { profit, vatAmount, netAfterVat };
}
