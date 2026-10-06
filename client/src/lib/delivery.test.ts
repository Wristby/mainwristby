import { afterEach, describe, expect, it, vi } from "vitest";
import { amsterdamToday, deliveryDateError, formatDeliveryDate, isCalendarDate, msUntilNextAmsterdamDay, returnWindow } from "@shared/delivery";
import { api } from "@shared/routes";

describe("delivery calendar dates", () => {
  afterEach(() => vi.useRealTimers());
  it("uses the Amsterdam calendar day rather than the UTC or browser day", () => {
    expect(amsterdamToday(new Date("2026-10-06T22:30:00Z"))).toBe("2026-10-07");
    expect(amsterdamToday(new Date("2026-12-06T23:30:00Z"))).toBe("2026-12-07");
  });
  it.each(["", "2026-02-30", "2026-13-01", "bad", "2026-2-3", "2026-10-06T00:00:00Z", "0000-01-01"])("rejects invalid calendar value %s", value => {
    expect(isCalendarDate(value)).toBe(false);
    expect(deliveryDateError(value)).toBe("Enter a valid delivery date.");
  });
  it("validates leap days and future dates", () => {
    expect(isCalendarDate("2024-02-29")).toBe(true);
    expect(isCalendarDate("2025-02-29")).toBe(false);
    const now = new Date("2026-10-06T22:30:00Z");
    expect(deliveryDateError("2026-10-07", now)).toBeNull();
    expect(deliveryDateError("2026-10-08", now)).toBe("Delivery date cannot be in the future.");
  });
  it("handles unconfirmed, first day, last day, and ended states", () => {
    expect(returnWindow(null)).toBeNull();
    expect(returnWindow("bad")).toBeNull();
    expect(returnWindow("2026-10-06", new Date("2026-10-06T12:00:00Z"))).toEqual({
      deadline: "2026-10-20", daysRemaining: 14, label: "14 days remaining",
    });
    expect(returnWindow("2026-10-06", new Date("2026-10-19T12:00:00Z"))?.label).toBe("1 day remaining");
    expect(returnWindow("2026-10-06", new Date("2026-10-20T21:59:59Z"))?.label).toBe("Last day");
    expect(returnWindow("2026-10-06", new Date("2026-10-20T22:00:00Z"))?.label).toBe("Return window ended");
  });
  it("recalculates after correction or clearing without changing the sale date", () => {
    const now = new Date("2026-10-10T12:00:00Z");
    expect(returnWindow("2026-10-06", now)?.daysRemaining).toBe(10);
    expect(returnWindow("2026-10-08", now)?.daysRemaining).toBe(12);
    expect(returnWindow(null, now)).toBeNull();
  });
  it("counts calendar days across DST and year boundaries", () => {
    expect(returnWindow("2026-03-20", new Date("2026-04-03T12:00:00Z"))).toEqual({
      deadline: "2026-04-03", daysRemaining: 0, label: "Last day",
    });
    expect(returnWindow("2026-10-20", new Date("2026-11-03T12:00:00Z"))?.daysRemaining).toBe(0);
    expect(returnWindow("2026-12-25", new Date("2027-01-08T12:00:00Z"))?.deadline).toBe("2027-01-08");
    expect(formatDeliveryDate("2026-10-06")).toBe("6 Oct 2026");
  });
  it("schedules midnight correctly on normal, 23-hour, and 25-hour days", () => {
    expect(msUntilNextAmsterdamDay(new Date("2026-10-06T21:59:59Z"))).toBe(1000);
    expect(msUntilNextAmsterdamDay(new Date("2026-03-28T23:00:00Z"))).toBe(23 * 60 * 60 * 1000);
    expect(msUntilNextAmsterdamDay(new Date("2026-10-24T22:00:00Z"))).toBe(25 * 60 * 60 * 1000);
  });
  it("enforces dates at the API and preserves omitted fields on unrelated updates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T12:00:00Z"));
    expect(api.inventory.update.input.parse({ deliveredDate: "2026-10-06" })).toEqual({ deliveredDate: "2026-10-06" });
    expect(api.inventory.update.input.parse({ deliveredDate: null })).toEqual({ deliveredDate: null });
    expect(api.inventory.update.input.parse({ notes: "Updated" })).toEqual({ notes: "Updated" });
    expect(api.inventory.update.input.safeParse({ deliveredDate: "2026-10-07" }).success).toBe(false);
    expect(api.inventory.update.input.safeParse({ deliveredDate: "2026-02-30" }).success).toBe(false);
    expect(api.inventory.update.input.safeParse({ deliveredDate: "" }).success).toBe(false);
  });
});
