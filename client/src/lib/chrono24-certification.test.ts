import { describe, expect, it } from "vitest";
import { api } from "@shared/routes";
import { getChrono24CertificationStats, getChrono24CertificationWatches } from "./chrono24-certification";

describe("Chrono24 Certification tracking", () => {
  it("accepts the certification flag independently of shipping and fee fields", () => {
    expect(api.inventory.update.input.parse({ chrono24CertificationSent: true }))
      .toEqual({ chrono24CertificationSent: true });
    expect(api.inventory.update.input.parse({ chrono24CertificationSent: false }))
      .toEqual({ chrono24CertificationSent: false });
    expect(api.inventory.update.input.parse({
      chrono24CertificationSent: true,
      chrono24CertificationSentAt: "2025-12-20T10:00:00.000Z",
    })).toEqual({ chrono24CertificationSent: true });
  });

  it("counts only explicitly marked watches, including sold and archived records", () => {
    expect(getChrono24CertificationStats([
      { chrono24CertificationSent: true },
      { chrono24CertificationSent: true, chrono24CertificationSentAt: "2025-12-20T10:00:00.000Z" },
      { chrono24CertificationSent: false },
      {},
      { chrono24CertificationSent: true, chrono24CertificationSentAt: null },
      { chrono24CertificationSent: true, chrono24CertificationSentAt: "invalid" },
    ])).toEqual({
      allTime: 4,
      undated: 3,
      byMonth: [{ monthKey: "2025-12", count: 1 }],
    });
    expect(getChrono24CertificationStats(undefined)).toEqual({ allTime: 0, undated: 0, byMonth: [] });
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
