import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SerialMatchNotice, type InventorySerialMatch } from "./serial-match-notice";

const match: InventorySerialMatch = {
  id: 42,
  brand: "Rolex",
  model: "Explorer",
  referenceNumber: "124270",
  serialNumber: "AB-123",
  internalSerial: null,
  status: "sold",
  dateSold: new Date("2025-06-10T12:00:00Z"),
  soldDate: null,
  archivedAt: null,
  matchedFields: ["serialNumber"],
};

describe("serial match notice", () => {
  it("shows the matching watch identity, status, sale date, and detail link", () => {
    const html = renderToStaticMarkup(<SerialMatchNotice matches={[match]}/>);
    expect(html).toContain("Possible repeat watch");
    expect(html).toContain("Rolex Explorer");
    expect(html).toContain("Ref. 124270");
    expect(html).toContain("Record #42");
    expect(html).toContain("Sold");
    expect(html).toContain("AB-123");
    expect(html).toContain('href="/inventory/42"');
    expect(html).toContain("Open matching watch");
  });

  it("identifies archived watches and supports multiple matches", () => {
    const archivedMatch = { ...match, id: 43, archivedAt: new Date("2026-01-01T00:00:00Z") };
    const html = renderToStaticMarkup(<SerialMatchNotice matches={[match, archivedMatch]}/>);
    expect(html).toContain("These serials match 2 watches");
    expect(html).toContain("Archived");
    expect(html).toContain('href="/inventory/43"');
  });

  it("does not render a warning when there are no matches", () => {
    expect(renderToStaticMarkup(<SerialMatchNotice matches={[]}/>)).toBe("");
  });

  it("keeps lookup failures non-blocking", () => {
    const html = renderToStaticMarkup(<SerialMatchNotice matches={[]} error/>);
    expect(html).toContain("You can still add this watch.");
  });
});
