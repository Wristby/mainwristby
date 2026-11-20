import { describe, expect, it } from "vitest";
import { api } from "@shared/routes";
import { buildWatchIntakePayload, watchIntakeDefaults, watchIntakeSchema } from "@/components/watch-intake/model";
import {
  buildCommonWatchApiFields,
  buildWatchEditPayload,
  commonWatchFormDefaults,
  resolveWatchFormStatus,
  watchEditFormDefaults,
  watchEditFormSchema,
} from "./watch-form-contract";
import { serviceHistoryToFormValues } from "./service-history";

describe("shared Add Watch and Edit Watch contract", () => {
  it("uses shared field defaults, condition validation, and warranty date validation", () => {
    expect(watchIntakeDefaults.condition).toBe(commonWatchFormDefaults.condition);
    expect(watchEditFormDefaults.condition).toBe(commonWatchFormDefaults.condition);
    expect(watchEditFormSchema.safeParse({
      ...watchEditFormDefaults,
      brand: "Rolex",
      model: "Explorer",
      referenceNumber: "124270",
      purchasePrice: 1000,
      condition: "Mint",
    }).success).toBe(false);

    const invalidDates = {
      ...watchEditFormDefaults,
      brand: "Rolex",
      model: "Explorer",
      referenceNumber: "124270",
      purchasePrice: 1000,
      manufacturerPurchaseDate: "2025-04-01",
      manufacturerWarrantyExpires: "2025-03-31",
    };
    expect(watchEditFormSchema.safeParse(invalidDates).success).toBe(false);
    expect(watchIntakeSchema.safeParse({ ...watchIntakeDefaults, ...invalidDates }).success).toBe(false);
  });

  it("shares euro-to-cents, condition, and nullable-date normalization for create and edit", () => {
    const commonInput = {
      ...commonWatchFormDefaults,
      brand: "Rolex",
      model: "Explorer",
      referenceNumber: "124270",
      condition: "Excellent" as const,
      purchasePrice: 5123.45,
      importFee: 15.29,
      serviceFee: 200.15,
      polishFee: 50.99,
      salePrice: 7000.51,
      platformFees: 455.03,
      shippingFee: 20.37,
      insuranceFee: 15.19,
      targetSellPrice: 7123.87,
      dateReceived: "",
      dateListed: "2026-10-10",
      dateSold: "",
      dateSentToService: "",
      dateReturnedFromService: "",
      manufacturerPurchaseDate: "",
      manufacturerWarrantyExpires: "",
      manufacturerWarrantyDetails: "  Warranty card noted  ",
      serviceNotes: "  In-house service  ",
      storeWarrantyMonths: 24,
      status: "in_stock" as const,
    };

    const intake = buildWatchIntakePayload(watchIntakeSchema.parse({
      ...watchIntakeDefaults,
      ...commonInput,
      purchasedFrom: "Private Purchase",
      paidWith: "Wire",
    }));
    const edit = buildWatchEditPayload(
      watchEditFormSchema.parse({ ...watchEditFormDefaults, ...commonInput }),
      "incoming",
      new Date("2026-11-01T12:00:00.000Z"),
    );
    const sharedFields = [
      "purchasePrice", "importFee", "serviceFee", "polishFee", "salePrice", "platformFees",
      "shippingFee", "insuranceFee", "targetSellPrice", "condition", "status", "dateReceived",
      "dateListed", "dateSold", "soldDate", "dateSentToService", "dateReturnedFromService",
      "serviceNotes", "manufacturerPurchaseDate", "manufacturerWarrantyExpires",
      "manufacturerWarrantyDetails", "storeWarrantyMonths",
    ] as const;

    for (const field of sharedFields) expect(edit[field]).toEqual(intake[field]);
    expect(edit).toMatchObject({
      purchasePrice: 512345,
      salePrice: 700051,
      targetSellPrice: 712387,
      condition: "Excellent",
      status: "in_stock",
      dateReceived: null,
      dateListed: "2026-10-10",
      soldDate: null,
      serviceNotes: "In-house service",
      manufacturerWarrantyDetails: "Warranty card noted",
    });
    expect(api.inventory.create.input.parse(intake).condition).toBe("Excellent");
    expect(api.inventory.update.input.parse(edit).condition).toBe("Excellent");
  });

  it("shares the date-driven status rules but preserves an explicit edit status change", () => {
    const dateDriven = {
      ...commonWatchFormDefaults,
      status: "incoming" as const,
      dateReceived: "2026-11-10",
    };
    expect(buildCommonWatchApiFields(dateDriven).status).toBe("received");
    expect(resolveWatchFormStatus(dateDriven, "incoming")).toBe("received");
    expect(resolveWatchFormStatus({ ...dateDriven, status: "servicing" }, "incoming")).toBe("servicing");
    expect(resolveWatchFormStatus({
      ...dateDriven,
      status: "servicing",
      dateReturnedFromService: "2026-11-11",
    }, "servicing")).toBe("received");
  });

  it("sets both date aliases when marking a watch sold, without inventing a date after it is cleared", () => {
    const values = watchEditFormSchema.parse({
      ...watchEditFormDefaults,
      brand: "Rolex",
      model: "Explorer",
      referenceNumber: "124270",
      purchasePrice: 1000,
      status: "sold",
    });
    const transitioned = buildWatchEditPayload(values, "in_stock", new Date("2026-11-16T10:00:00.000Z"));
    expect(transitioned.soldDate).toBe("2026-11-16T10:00:00.000Z");
    expect(transitioned.dateSold).toBe(transitioned.soldDate);
    expect(buildWatchEditPayload(values, "sold").soldDate).toBeNull();
    expect(buildWatchEditPayload(values, "in_stock", new Date("2026-11-16T10:00:00.000Z"), true).soldDate).toBeNull();
    expect(buildWatchEditPayload({ ...values, status: "in_stock" }, "sold").soldDate).toBeNull();
  });

  it("still permits incomplete seller information when editing older watch records", () => {
    const parsed = watchEditFormSchema.parse({
      ...watchEditFormDefaults,
      brand: "Rolex",
      model: "Explorer",
      referenceNumber: "124270",
      purchasePrice: 1000,
    });
    expect(parsed.purchasedFrom).toBe("");
    expect(parsed.paidWith).toBe("");
  });

  it("saves multiple service visits independently without changing legacy COGS fields", () => {
    const values = watchEditFormSchema.parse({
      ...watchEditFormDefaults,
      brand: "Rolex",
      model: "Explorer",
      referenceNumber: "124270",
      purchasePrice: 1000,
      serviceFee: 250,
      serviceVisits: [
        { startDate: "2025-02-03", completedDate: "2025-02-06", cost: 125.5, notes: "Movement cleaned" },
        { startDate: "2026-06-10", completedDate: "", cost: 80, notes: "Regulated timing" },
      ],
    });
    const payload = buildWatchEditPayload(values, "in_stock");

    expect(payload.serviceFee).toBe(25_000);
    expect(payload.serviceHistory).toEqual([
      {
        startDate: "2025-02-03",
        completedDate: "2025-02-06",
        costCents: 12_550,
        notes: "Movement cleaned",
      },
      {
        startDate: "2026-06-10",
        completedDate: null,
        costCents: 8_000,
        notes: "Regulated timing",
      },
    ]);
    expect(api.inventory.update.input.parse(payload).serviceHistory).toHaveLength(2);
  });

  it("shows legacy single-visit data when no migrated history is present", () => {
    const visits = serviceHistoryToFormValues({
      serviceHistory: [],
      serviceStartDate: new Date("2024-04-02T00:00:00.000Z"),
      dateSentToService: null,
      dateReturnedFromService: new Date("2024-04-07T00:00:00.000Z"),
      serviceFee: 17500,
      serviceNotes: "Full service",
    } as any);

    expect(visits).toEqual([{
      startDate: "2024-04-02",
      completedDate: "2024-04-07",
      cost: 175,
      notes: "Full service",
    }]);
  });
});
