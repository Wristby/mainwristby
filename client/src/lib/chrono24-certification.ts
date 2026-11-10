type CertificationFlag = { chrono24CertificationSent?: boolean | null };

export function countChrono24CertificationSent(items: readonly CertificationFlag[] | undefined): number {
  return items?.reduce((count, item) => count + (item.chrono24CertificationSent === true ? 1 : 0), 0) ?? 0;
}
