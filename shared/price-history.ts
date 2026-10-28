/** Only positive, changed prices are useful history entries. */
export function shouldRecordListedPrice(
  previousPrice: number | null | undefined,
  nextPrice: number | null | undefined,
): nextPrice is number {
  return nextPrice != null && Number.isInteger(nextPrice) && nextPrice > 0 && nextPrice !== previousPrice;
}

export function getListedPriceChange(previousPrice: number, nextPrice: number) {
  const difference = nextPrice - previousPrice;
  if (difference === 0) return null;
  return {
    direction: difference < 0 ? "down" as const : "up" as const,
    amount: Math.abs(difference),
    percent: previousPrice > 0 ? Math.abs(difference) / previousPrice * 100 : null,
  };
}
