import { describe, expect, it } from "vitest";
import { compareSoldDates, getSoldDate } from "./sold-date";

describe("sold-watch dates", () => {
  it("supports both date fields and safely handles missing/invalid dates", () => {
    expect(getSoldDate({ soldDate: "bad", dateSold: "2026-10-05" })?.toISOString()).toBe("2026-10-05T00:00:00.000Z");
    expect(getSoldDate({ soldDate: "2026-10-06", dateSold: "2026-10-05" })?.getUTCDate()).toBe(6);
    expect(getSoldDate({ dateSold: "bad" })).toBeNull();
    expect(getSoldDate({})).toBeNull();
  });
  it("sorts by actual sale date, not creation ID, with undated sales last", () => {
    const items = [
      { id: 100, soldDate: "2026-09-01" },
      { id: 1, dateSold: "2026-10-06" },
      { id: 300, soldDate: null },
      { id: 200, soldDate: "invalid" },
    ];
    expect([...items].sort((a, b) => compareSoldDates(a, b, "desc")).map(item => item.id)).toEqual([1, 100, 300, 200]);
    expect([...items].sort((a, b) => compareSoldDates(a, b, "asc")).map(item => item.id)).toEqual([100, 1, 300, 200]);
  });
  it("uses a deterministic order for sales on the same date", () => {
    expect(compareSoldDates({ id: 1, soldDate: "2026-10-06" }, { id: 2, soldDate: "2026-10-06" }, "desc")).toBe(1);
  });
});
