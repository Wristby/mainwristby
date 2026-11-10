import { describe, expect, it } from "vitest";
import { api } from "@shared/routes";
import { normalizeWatchCondition, serializeWatchCondition, WATCH_DETAIL_CONDITIONS } from "./watch-condition";

describe("watch condition labels", () => {
  it("preserves every Watch Details condition when saving", () => {
    for (const condition of WATCH_DETAIL_CONDITIONS) {
      const savedCondition = serializeWatchCondition(condition);
      expect(savedCondition).toBe(condition);
      expect(api.inventory.update.input.parse({ condition: savedCondition }).condition).toBe(condition);
    }
  });

  it("shows friendly labels for older saved condition values", () => {
    expect(normalizeWatchCondition("Used")).toBe("Good");
    expect(normalizeWatchCondition("New")).toBe("Like New");
    expect(normalizeWatchCondition("Mint")).toBe("Excellent");
    expect(normalizeWatchCondition("Very Good")).toBe("Very Good");
  });
});
