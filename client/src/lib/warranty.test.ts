import { describe, expect, it } from "vitest";
import { api } from "@shared/routes";
import { watchIntakeDefaults, watchIntakeSchema } from "@/components/watch-intake/model";
import {
  addCalendarMonths,
  getManufacturerWarrantyCoverage,
  getStoreWarrantyCoverage,
  normalizeWarrantyMonths,
} from "@shared/warranty";

describe("store and manufacturer warranty tracking", () => {
  it("adds calendar months and clamps dates at the end of shorter months", () => {
    expect(addCalendarMonths("2024-02-29", 12)).toBe("2025-02-28");
    expect(addCalendarMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addCalendarMonths("2026-10-01", 0)).toBeNull();
    expect(addCalendarMonths("2026-02-30", 12)).toBeNull();
  });

  it("distinguishes missing, no-warranty, awaiting-delivery, active, expiring, and expired store coverage", () => {
    expect(getStoreWarrantyCoverage(null, null, "2026-11-16").status).toBe("not_recorded");
    expect(getStoreWarrantyCoverage(0, "2026-01-01", "2026-11-16").status).toBe("none");
    expect(getStoreWarrantyCoverage(12, null, "2026-11-16").status).toBe("awaiting_delivery");
    expect(getStoreWarrantyCoverage(12, "2025-11-20", "2026-11-16")).toMatchObject({
      status: "expiring",
      startDate: "2025-11-20",
      endDate: "2026-11-20",
      daysRemaining: 4,
    });
    expect(getStoreWarrantyCoverage(12, "2025-11-16", "2026-11-16").status).toBe("expiring");
    expect(getStoreWarrantyCoverage(12, "2024-11-15", "2026-11-16").status).toBe("expired");
  });

  it("tracks manufacturer coverage separately and shows unknown expiry without inventing a countdown", () => {
    expect(getManufacturerWarrantyCoverage(null, null, false, null, "2026-11-16").status).toBe("not_recorded");
    expect(getManufacturerWarrantyCoverage("2025-06-01", null, true, null, "2026-11-16")).toMatchObject({
      status: "end_date_unknown",
      daysRemaining: null,
      percentRemaining: null,
    });
    expect(getManufacturerWarrantyCoverage("2025-06-01", "2027-06-01", true, null, "2026-11-16").status).toBe("active");
    expect(getManufacturerWarrantyCoverage("2025-06-01", "2026-12-01", false, "Card details", "2026-11-16").status).toBe("expiring");
    expect(getManufacturerWarrantyCoverage("2021-01-01", "2022-01-01", true, null, "2026-11-16").status).toBe("expired");
  });

  it("normalizes unsupported defaults and validates saved watch warranty fields", () => {
    expect(normalizeWarrantyMonths(24)).toBe(24);
    expect(normalizeWarrantyMonths(18)).toBe(12);
    expect(api.inventory.update.input.parse({
      storeWarrantyMonths: 0,
      manufacturerPurchaseDate: "2024-04-01",
      manufacturerWarrantyExpires: "2026-04-01",
      manufacturerWarrantyCardPresent: true,
      manufacturerWarrantyDetails: "International warranty card",
    })).toMatchObject({
      storeWarrantyMonths: 0,
      manufacturerPurchaseDate: "2024-04-01",
      manufacturerWarrantyExpires: "2026-04-01",
      manufacturerWarrantyCardPresent: true,
    });
    expect(api.inventory.update.input.safeParse({ storeWarrantyMonths: 18 }).success).toBe(false);
    expect(api.inventory.update.input.safeParse({ manufacturerWarrantyExpires: "2026-02-30" }).success).toBe(false);
    expect(api.inventory.update.input.safeParse({
      manufacturerPurchaseDate: "2026-04-02",
      manufacturerWarrantyExpires: "2026-04-01",
    }).success).toBe(false);
  });

  it("preserves the difference between an unrecorded term and no warranty in intake", () => {
    const base = {
      ...watchIntakeDefaults,
      brand: "Rolex",
      model: "Submariner",
      referenceNumber: "126610LN",
      purchasedFrom: "Private Purchase",
      paidWith: "Wire",
      purchasePrice: 10000,
    };
    expect(watchIntakeSchema.parse({ ...base, storeWarrantyMonths: null }).storeWarrantyMonths).toBeNull();
    expect(watchIntakeSchema.parse({ ...base, storeWarrantyMonths: 0 }).storeWarrantyMonths).toBe(0);
    expect(watchIntakeSchema.safeParse({
      ...base,
      manufacturerPurchaseDate: "2026-04-02",
      manufacturerWarrantyExpires: "2026-04-01",
    }).success).toBe(false);
  });
});
