import { describe, expect, it } from "vitest";
import { getMatchingSerialFields, normalizeWatchSerial } from "@shared/serial-match";

describe("watch serial matching", () => {
  it("ignores letter case, spaces, and harmless punctuation", () => {
    expect(normalizeWatchSerial(" ab-12 3 / xy ")).toBe("ab123xy");
  });

  it("matches either saved serial field against either intake serial", () => {
    expect(getMatchingSerialFields(
      { serialNumber: "AB-123", internalSerial: "movement 77" },
      ["ab 123", "MOVEMENT-77"],
    )).toEqual(["serialNumber", "internalSerial"]);
  });

  it("does not treat blank or punctuation-only values as matches", () => {
    expect(getMatchingSerialFields(
      { serialNumber: null, internalSerial: "---" },
      ["", "   ", "---"],
    )).toEqual([]);
  });

  it("does not partially match different serials", () => {
    expect(getMatchingSerialFields(
      { serialNumber: "AB-1234", internalSerial: null },
      ["AB-123"],
    )).toEqual([]);
  });
});
