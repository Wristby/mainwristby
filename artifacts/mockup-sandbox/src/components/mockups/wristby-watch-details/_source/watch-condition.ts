export function normalizeWatchCondition(condition?: string | null) {
  if (condition === "New") return "Like New";
  if (condition === "Mint") return "Excellent";
  return condition || "Good";
}
