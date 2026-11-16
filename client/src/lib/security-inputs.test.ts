import { describe, expect, it } from "vitest";
import { zodResolver } from "@hookform/resolvers/zod";
import { csvCell } from "./csv";
import { safeExternalUrl } from "./safe-external-url";
import { watchIntakeSchema, watchIntakeDefaults, type WatchIntakeValues } from "@/components/watch-intake/model";
import { api } from "@shared/routes";
import { watchEditFormDefaults, watchEditFormSchema, type WatchEditFormValues } from "./watch-form-contract";

describe("safe saved links", () => {
  it.each([
    "javascript:alert(1)", "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)", "file:///etc/passwd", "java\nscript:alert(1)",
    "https://user:password@example.test/", "https://",
  ])("does not open unsafe or invalid URL %s", value => {
    expect(safeExternalUrl(value)).toBeUndefined();
    expect(safeExternalUrl(value, true)).toBeUndefined();
  });

  it("preserves valid web links and supports bare client domains only when requested", () => {
    const drive = "https://drive.google.com/drive/folders/example?usp=sharing";
    expect(safeExternalUrl(drive)).toBe(drive);
    expect(safeExternalUrl("example.test/path")).toBeUndefined();
    expect(safeExternalUrl("example.test/path", true)).toBe("https://example.test/path");
  });
});

describe("spreadsheet export security", () => {
  it.each(["=HYPERLINK(\"https://example.test\")", "+1+1", "-1+1", "@SUM(1)", "  =1+1", "\tvalue", "\rvalue", "\nvalue"])(
    "neutralizes executable or control-prefixed text %s",
    text => expect(csvCell(text).startsWith("\"'")).toBe(true),
  );

  it("escapes separators and quotes, preserving numeric amounts", () => {
    expect(csvCell('Ref, "quoted"')).toBe('"Ref, ""quoted"""');
    expect(csvCell(-45.5)).toBe('"-45.5"');
    expect(csvCell(0)).toBe('"0"');
    expect(csvCell(null)).toBe('""');
  });
});

describe("Zod 4 validation compatibility", () => {
  it("returns field errors instead of throwing when intake validation fails", async () => {
    const result = await zodResolver(watchIntakeSchema)(
      watchIntakeDefaults, undefined,
      { fields: {}, shouldUseNativeValidation: false },
    );
    expect(result.errors.brand?.message).toBe("Brand is required");
    expect(result.errors.purchasePrice?.message).toBe("COGS is required");
  });

  it("transforms raw intake and watch-edit inputs into normalized submission values", async () => {
    const context = { fields: {}, shouldUseNativeValidation: false };
    const intake = await zodResolver(watchIntakeSchema)(
      {
        ...watchIntakeDefaults,
        brand: "Rolex",
        model: "Submariner",
        referenceNumber: "126610LN",
        purchasedFrom: "Private Purchase",
        paidWith: "Bank transfer",
        purchasePrice: "5000.50",
        importFee: "24.95",
        year: "2024",
        linkCount: "11",
      } as unknown as WatchIntakeValues,
      undefined,
      context,
    );
    expect(intake.errors).toEqual({});
    expect(intake.values).toMatchObject({
      purchasePrice: 5000.5,
      importFee: 24.95,
      year: 2024,
      linkCount: 11,
      box: false,
      papers: false,
    });

    const edit = await zodResolver(watchEditFormSchema)(
      {
        ...watchEditFormDefaults,
        brand: "Rolex",
        model: "Submariner",
        referenceNumber: "126610LN",
        purchasePrice: "5100.25",
        importFee: "10.75",
        listPrice: "7400",
      } as unknown as WatchEditFormValues,
      undefined,
      context,
    );
    expect(edit.errors).toEqual({});
    expect(edit.values).toMatchObject({ purchasePrice: 5100.25, importFee: 10.75, listPrice: 7400 });
  });

  it("does not apply create defaults to a personal collection partial update", () => {
    expect(api.personalCollection.update.input.parse({ notes: "Updated note" }))
      .toEqual({ notes: "Updated note" });
    expect(api.personalCollection.update.input.parse({ condition: "Vintage" }))
      .toEqual({ condition: "Vintage" });
  });

  it("strips internal and unknown fields from client, watch, and collection updates", () => {
    expect(api.clients.update.input.parse({ name: "Client", profileClearedAt: "2026-01-01" }))
      .toEqual({ name: "Client" });
    expect(api.inventory.update.input.parse({ notes: "Note", id: 25, archivedAt: "2026-01-01" }))
      .toEqual({ notes: "Note" });
    expect(api.personalCollection.update.input.parse({ notes: "Note", userId: "someone-else", id: 25 }))
      .toEqual({ notes: "Note" });
  });
});
