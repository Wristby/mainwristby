import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { api } from "@shared/routes";
import { buildWatchIntakePayload, watchIntakeDefaults, watchIntakeFieldTab, watchIntakeMoneyFields, watchIntakeSchema } from "./model";
import { IntakeReview } from "./review";

const valid = { ...watchIntakeDefaults, brand: "Rolex", model: "Explorer", referenceNumber: "124270", purchasedFrom: "Private Purchase", paidWith: "Wire", purchasePrice: 5123.45 };

describe("shared watch intake", () => {
  it("validates required fields and routes every field to a section", () => {
    const result = watchIntakeSchema.safeParse(watchIntakeDefaults);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map(issue => issue.path[0])).toEqual(
      expect.arrayContaining(["brand", "model", "referenceNumber", "purchasedFrom", "paidWith", "purchasePrice"]),
    );
    expect(watchIntakeSchema.safeParse(valid).success).toBe(true);
    for (const field of Object.keys(watchIntakeDefaults)) expect(watchIntakeFieldTab[field as keyof typeof watchIntakeDefaults]).toBeGreaterThanOrEqual(0);
    expect(watchIntakeFieldTab.purchasePrice).toBe(1);
    expect(watchIntakeFieldTab.serviceFee).toBe(2);
    expect(watchIntakeFieldTab.trackingNumber).toBe(3);
  });

  it("requires a seller only for dealer purchases and normalizes blank numeric fields", () => {
    const missing = watchIntakeSchema.safeParse({ ...valid, purchasedFrom: "Dealer", clientId: "" });
    expect(missing.success).toBe(false);
    if (!missing.success) expect(missing.error.issues[0].path).toEqual(["clientId"]);
    expect(watchIntakeSchema.parse({ ...valid, purchasedFrom: "Dealer", clientId: "12" }).clientId).toBe(12);
    const parsed = watchIntakeSchema.parse({ ...valid, year: "", linkCount: "", clientId: "" });
    expect(parsed.year).toBeNull();
    expect(parsed.linkCount).toBeNull();
    expect(parsed.clientId).toBeNull();
    expect(watchIntakeSchema.safeParse({ ...valid, linkCount: 2.5 }).success).toBe(false);
  });

  it("converts every money field once and sends a payload accepted by the real API schema", () => {
    const values = { ...valid, importFee: 15.29, serviceFee: 200.15, polishFee: 50.99, targetSellPrice: 7123.87, salePrice: 7000.51, platformFees: 455.03, shippingFee: 20.37, insuranceFee: 15.19, linkCount: 11, box: true, papers: true, trackingNumber: "TEST-ONLY", serviceNotes: "In-house work", notes: "Private notes" };
    const payload = buildWatchIntakePayload(watchIntakeSchema.parse(values));
    for (const field of watchIntakeMoneyFields) expect(payload[field]).toBe(Math.round(values[field] * 100));
    expect(payload).toMatchObject({ purchasePrice: 512345, targetSellPrice: 712387, linkCount: 11, box: true, papers: true, trackingNumber: "TEST-ONLY", serviceNotes: "In-house work", notes: "Private notes" });
    expect(api.inventory.create.input.safeParse(payload).success).toBe(true);
    expect(valid.purchasePrice).toBe(5123.45);
    expect(payload.dateSold).toBeNull();
    expect(payload.soldDate).toBeNull();
  });

  it("retains status/date precedence and synchronizes both sale date aliases", () => {
    const build = (extra: Partial<typeof valid>) => buildWatchIntakePayload({ ...valid, ...extra });
    expect(build({ dateReceived: "2026-10-01" }).status).toBe("received");
    expect(build({ dateReceived: "2026-10-01", dateListed: "2026-10-02" }).status).toBe("in_stock");
    expect(build({ status: "servicing", dateListed: "2026-10-02" }).status).toBe("servicing");
    expect(build({ status: "servicing", dateReturnedFromService: "2026-10-03" }).status).toBe("received");
    const sold = build({ status: "servicing", dateSold: "2026-10-04" });
    expect(sold.status).toBe("sold");
    expect(sold.dateSold).toBe(sold.soldDate);
    expect(api.inventory.create.input.safeParse(sold).success).toBe(true);
  });

  it("reviews actual costs, dates, seller, optional information, and effective status", () => {
    const html = renderToStaticMarkup(<IntakeReview values={{ ...valid, clientId: 12, dateListed: "2026-10-02", serviceNotes: "In-house adjustment", notes: "Check clasp", trackingNumber: "TRACK-TEST" }} clients={[{ id: 12, name: "Example dealer" }]} edit={() => {}}/>);
    expect(html).toContain("Example dealer");
    expect(html).toContain("5.123,45");
    expect(html).toContain("2026-10-02");
    expect(html).toContain("Listed");
    expect(html).toContain("In-house adjustment");
    expect(html).toContain("Check clasp");
    expect(html).toContain("TRACK-TEST");
    expect(html.match(/aria-label="Edit /g)).toHaveLength(4);
    expect(html).not.toContain("type=\"submit\"");
  });
});
