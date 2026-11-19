import { calculateWatchFinancials, type WatchCostSource } from "@shared/watch-financials";
import { getPositiveSaleAmount } from "@shared/reporting";

export type AnalyticsVatSource = WatchCostSource & {
  status: string;
  salePrice?: number | null;
  soldPrice?: number | null;
};

export interface ConfirmedSalesVatSummary {
  confirmedSales: number;
  vatAmountCents: number;
}

/**
 * Calculates estimated VAT for the already date-scoped sold watches in Analytics.
 * Only sold watches with a positive recorded sale amount count as confirmed sales.
 * VAT is rounded per watch and applies only to positive profit after recorded costs.
 */
export function summarizeConfirmedSalesVat(
  watches: readonly AnalyticsVatSource[],
  vatRatePercent: number,
  defaultWatchRegisterFeeCents: number,
): ConfirmedSalesVatSummary {
  const confirmed = watches.flatMap((watch) => {
    const saleAmount = watch.status === "sold" ? getPositiveSaleAmount(watch) : null;
    return saleAmount == null ? [] : [{ watch, saleAmount }];
  });

  return {
    confirmedSales: confirmed.length,
    vatAmountCents: confirmed.reduce(
      (total, { watch, saleAmount }) => total + calculateWatchFinancials(
        watch,
        saleAmount,
        vatRatePercent,
        defaultWatchRegisterFeeCents,
        true,
      ).vatAmountCents,
      0,
    ),
  };
}
