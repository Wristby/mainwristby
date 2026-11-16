type CertificationFlag = {
  chrono24CertificationSent?: boolean | null;
  chrono24CertificationSentAt?: string | Date | null;
};

export function getChrono24CertificationWatches<T extends CertificationFlag>(
  items: readonly T[] | undefined,
): T[] {
  return items?.filter((item) => item.chrono24CertificationSent === true) ?? [];
}

export interface Chrono24CertificationStats {
  allTime: number;
  undated: number;
  byMonth: Array<{ monthKey: string; count: number }>;
}

export function getChrono24CertificationStats(
  items: readonly CertificationFlag[] | undefined,
): Chrono24CertificationStats {
  const counts = new Map<string, number>();
  let allTime = 0;
  let undated = 0;

  for (const item of items ?? []) {
    if (item.chrono24CertificationSent !== true) continue;
    allTime += 1;
    const sentAt = item.chrono24CertificationSentAt;
    const date = sentAt ? new Date(sentAt) : null;
    if (!date || Number.isNaN(date.getTime())) {
      undated += 1;
      continue;
    }

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    counts.set(monthKey, (counts.get(monthKey) ?? 0) + 1);
  }

  return {
    allTime,
    undated,
    byMonth: Array.from(counts.entries())
      .map(([monthKey, count]) => ({ monthKey, count }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey)),
  };
}

export function countChrono24CertificationSent(items: readonly CertificationFlag[] | undefined): number {
  return getChrono24CertificationWatches(items).length;
}
