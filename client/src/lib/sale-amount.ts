import type { InventoryItem } from "@shared/schema";

export function getSaleAmount(item: Pick<InventoryItem, "salePrice" | "soldPrice">): number | null {
  // Legacy rows may have a default modern zero and the recorded amount in soldPrice.
  // Otherwise prefer the modern amount, preserving genuine zero amounts.
  return item.salePrice === 0 && item.soldPrice != null && item.soldPrice !== 0
    ? item.soldPrice
    : item.salePrice ?? item.soldPrice ?? null;
}
