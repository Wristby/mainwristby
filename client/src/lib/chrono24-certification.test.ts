import { describe, expect, it } from "vitest";
import { api } from "@shared/routes";
import { countChrono24CertificationSent } from "./chrono24-certification";

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
});
