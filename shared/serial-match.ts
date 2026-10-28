export type WatchSerialField = "serialNumber" | "internalSerial";

export function normalizeWatchSerial(value: unknown): string {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getMatchingSerialFields(
  watch: Record<WatchSerialField, unknown>,
  candidateSerials: unknown[],
): WatchSerialField[] {
  const candidates = new Set(candidateSerials.map(normalizeWatchSerial).filter(Boolean));
  if (!candidates.size) return [];
  return (["serialNumber", "internalSerial"] as const).filter((field) => {
    const normalized = normalizeWatchSerial(watch[field]);
    return normalized.length > 0 && candidates.has(normalized);
  });
}
