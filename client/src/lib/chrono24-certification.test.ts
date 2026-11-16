import { describe, expect, it } from "vitest";
import { api } from "@shared/routes";
import { countChrono24CertificationSent, getChrono24CertificationWatches } from "./chrono24-certification";

describe("Chrono24 Certification tracking", () => {
  it("accepts the certification flag independently of shipping and fee fields", () => {
    expect(api.inventory.update.input.parse({ chrono24CertificationSent: true }))
      .toEqual({ chrono24CertificationSent: true });
    expect(api.inventory.update.input.parse({ chrono24CertificationSent: false }))
      .toEqual({ chrono24CertificationSent: false });
  });

  it("counts only explicitly marked watches, including sold and archived records", () => {
    expect(countChrono24CertificationSent([
      { chrono24CertificationSent: true },
      { chrono24CertificationSent: true },
      { chrono24CertificationSent: false },
      {},
      { chrono24CertificationSent: null },
    ])).toBe(2);
    expect(countChrono24CertificationSent(undefined)).toBe(0);
  });

  it("returns the exact marked set for analytics drill-downs", () => {
    const watches = [
      { id: 1, status: "in_stock", archivedAt: null, chrono24CertificationSent: true },
      { id: 2, status: "sold", archivedAt: null, chrono24CertificationSent: true },
      { id: 3, status: "sold", archivedAt: new Date(), chrono24CertificationSent: true },
      { id: 4, status: "in_stock", archivedAt: null, chrono24CertificationSent: false },
    ];

    expect(getChrono24CertificationWatches(watches).map(({ id }) => id)).toEqual([1, 2, 3]);
  });
});
