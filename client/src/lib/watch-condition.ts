export const WATCH_DETAIL_CONDITIONS = ["Good", "Very Good", "Excellent", "Like New"] as const;

export type WatchDetailCondition = typeof WATCH_DETAIL_CONDITIONS[number];

export function normalizeWatchCondition(condition: string | null | undefined): WatchDetailCondition {
  if ((WATCH_DETAIL_CONDITIONS as readonly string[]).includes(condition || "")) {
    return condition as WatchDetailCondition;
  }
  if (condition === "New") return "Like New";
  if (condition === "Mint") return "Excellent";
  return "Good";
}

export function serializeWatchCondition(condition: WatchDetailCondition | undefined): WatchDetailCondition {
  return condition ?? "Good";
}
