type CertificationFlag = { chrono24CertificationSent?: boolean | null };

export function getChrono24CertificationWatches<T extends CertificationFlag>(
  items: readonly T[] | undefined,
): T[] {
  return items?.filter((item) => item.chrono24CertificationSent === true) ?? [];
}

export function countChrono24CertificationSent(items: readonly CertificationFlag[] | undefined): number {
  return getChrono24CertificationWatches(items).length;
}
