import { describe, expect, it } from "vitest";
import { getSoldDateWriteFields, normalizeSoldDateFields } from "@shared/sold-date";

describe("sale date persistence", () => {
  it("writes both aliases with the canonical date and preserves legacy fallback", () => {
    const canonical = normalizeSoldDateFields({
      soldDate: "2026-11-12T10:00:00.000Z",
      dateSold: "2026-11-10T10:00:00.000Z",
    });
    expect(canonical.soldDate).toEqual(new Date("2026-11-12T10:00:00.000Z"));
    expect(canonical.dateSold).toEqual(canonical.soldDate);

    const legacy = normalizeSoldDateFields({ dateSold: "2026-11-10T10:00:00.000Z" });
    expect(legacy.soldDate).toEqual(new Date("2026-11-10T10:00:00.000Z"));
    expect(legacy.dateSold).toEqual(legacy.soldDate);
  });

  it("falls back from an invalid canonical date, while explicit null clears both", () => {
    expect(getSoldDateWriteFields({ soldDate: "invalid", dateSold: "2026-11-10" }))
      .toEqual({ soldDate: new Date("2026-11-10"), dateSold: new Date("2026-11-10") });
    expect(normalizeSoldDateFields({ soldDate: null }))
      .toEqual({ soldDate: null, dateSold: null });
  });

  it("leaves sale dates untouched when neither alias is part of an update", () => {
    const update = { status: "in_stock" };
    expect(normalizeSoldDateFields(update)).toBe(update);
  });
});
