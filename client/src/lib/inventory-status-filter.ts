export function matchesInventoryStatus(itemStatus: string, statusFilter: string): boolean {
  if (statusFilter === "all") return true;
  if (statusFilter === "incoming_received") {
    return itemStatus === "incoming" || itemStatus === "received";
  }
  return itemStatus === statusFilter;
}
