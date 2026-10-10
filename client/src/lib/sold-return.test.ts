import { describe, expect, it } from "vitest";
import { compareReturnDeadlines, matchesReturnWindowFilter } from "./sold-return";

describe("sold inventory return overview", () => {
  const now = new Date("2026-10-20T12:00:00Z");
  it("never treats missing or invalid delivery dates as ended windows", () => {
    for (const deliveredDate of [undefined, null, "", "bad", "2026-02-30"]) {
      const item = { deliveredDate };
      expect(matchesReturnWindowFilter(item, "all", now)).toBe(true);
      expect(matchesReturnWindowFilter(item, "unconfirmed", now)).toBe(true);
      expect(matchesReturnWindowFilter(item, "active", now)).toBe(false);
    }
  });
  it("includes the last day in active windows until Amsterdam midnight", () => {
    const item = { deliveredDate: "2026-10-06" };
    expect(matchesReturnWindowFilter(item, "active", new Date("2026-10-20T21:59:59Z"))).toBe(true);
    expect(matchesReturnWindowFilter(item, "active", new Date("2026-10-20T22:00:00Z"))).toBe(false);
    expect(matchesReturnWindowFilter(item, "unconfirmed", now)).toBe(false);
    expect(matchesReturnWindowFilter({ deliveredDate: "2026-10-05" }, "active", now)).toBe(false);
    expect(matchesReturnWindowFilter({ deliveredDate: "2026-10-10" }, "active", now)).toBe(true);
  });
  it("keeps unconfirmed deliveries last in either deadline direction", () => {
    const items = [
      { id: 1, deliveredDate: null },
      { id: 2, deliveredDate: "2026-10-10" },
      { id: 3, deliveredDate: "2026-10-05" },
      { id: 4, deliveredDate: "bad" },
      { id: 5, deliveredDate: "2026-10-06" },
    ];
    const sort = (order: "asc" | "desc") =>
      [...items].sort((a, b) => compareReturnDeadlines(a, b, order, now)).map(item => item.id);
    expect(sort("asc")).toEqual([3, 5, 2, 4, 1]);
    expect(sort("desc")).toEqual([2, 5, 3, 4, 1]);
  });
  it("breaks tied deadlines by newest sale date, then ID", () => {
    const items = [
      { id: 9, deliveredDate: "2026-10-06", soldDate: "2026-09-01" },
      { id: 2, deliveredDate: "2026-10-06", dateSold: "2026-10-05" },
      { id: 3, deliveredDate: "2026-10-06", soldDate: "2026-10-05" },
      { id: 10, deliveredDate: "2026-10-06" },
    ];
    for (const order of ["asc", "desc"] as const) {
      expect([...items].sort((a, b) => compareReturnDeadlines(a, b, order, now)).map(item => item.id))
        .toEqual([3, 2, 9, 10]);
    }
  });
  it("updates filtering and sorting when delivery confirmation is corrected or cleared", () => {
    const first = { id: 1, deliveredDate: "2026-10-05" as string | null };
    const second = { id: 2, deliveredDate: "2026-10-06" };
    expect(matchesReturnWindowFilter(first, "active", now)).toBe(false);
    expect(compareReturnDeadlines(first, second, "asc", now)).toBeLessThan(0);
    first.deliveredDate = "2026-10-10";
    expect(matchesReturnWindowFilter(first, "active", now)).toBe(true);
    expect(compareReturnDeadlines(first, second, "asc", now)).toBeGreaterThan(0);
    first.deliveredDate = null;
    expect(matchesReturnWindowFilter(first, "unconfirmed", now)).toBe(true);
    expect(compareReturnDeadlines(first, second, "desc", now)).toBeGreaterThan(0);
  });
  it("uses calendar deadlines across DST and year rollover", () => {
    expect(matchesReturnWindowFilter({ deliveredDate: "2026-10-20" }, "active", new Date("2026-11-03T22:59:59Z"))).toBe(true);
    expect(matchesReturnWindowFilter({ deliveredDate: "2026-10-20" }, "active", new Date("2026-11-03T23:00:00Z"))).toBe(false);
    expect(compareReturnDeadlines(
      { id: 1, deliveredDate: "2026-12-25" },
      { id: 2, deliveredDate: "2027-01-01" }, "asc", now,
    )).toBeLessThan(0);
  });
});
