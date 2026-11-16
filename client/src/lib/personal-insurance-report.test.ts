import { describe, expect, it } from "vitest";
import { buildPersonalInsuranceReportRows } from "./personal-insurance-report";

describe("personal insurance report", () => {
  it("includes the requested personal watch details and makes missing data explicit", () => {
    const [row] = buildPersonalInsuranceReportRows([{
      id: 17,
      manufacturer: "Rolex",
      model: "Submariner",
      referenceNumber: "126610LN",
      serialNumber: null,
      condition: "Pre-owned",
      conditionGrade: "Excellent",
      dateBought: "2024-02-05",
      purchasePrice: 850000,
      estimatedValue: null,
      warrantyCardDate: null,
      warrantyExpiration: "2027-02-05",
    }]);

    expect(row).toEqual({
      id: 17,
      identity: "Rolex Submariner",
      referenceNumber: "126610LN",
      serialNumber: "Not recorded",
      condition: "Pre-owned · Excellent",
      acquisitionDate: "5 Feb 2024",
      purchaseAmount: "8.500,00 €",
      estimatedValue: "Not recorded",
      warrantyCardDate: "Not recorded",
      warrantyExpiration: "5 Feb 2027",
    });
    expect(Object.keys(row)).not.toContain("notes");
  });

  it("does not invent or include unrelated business record fields", () => {
    const watch = {
      id: 1,
      manufacturer: "Omega",
      model: null,
      referenceNumber: "210.30",
      serialNumber: "ABC123",
      condition: "New",
      conditionGrade: "Not graded",
      dateBought: null,
      purchasePrice: null,
      estimatedValue: null,
      warrantyCardDate: null,
      warrantyExpiration: null,
      soldTo: "Business buyer",
      expenses: [{ amount: 1000 }],
    };
    const [row] = buildPersonalInsuranceReportRows([watch]);

    expect(row).toMatchObject({
      identity: "Omega",
      acquisitionDate: "Not recorded",
      purchaseAmount: "Not recorded",
      estimatedValue: "Not recorded",
      warrantyCardDate: "Not recorded",
      warrantyExpiration: "Not recorded",
    });
    expect(row).not.toHaveProperty("soldTo");
    expect(row).not.toHaveProperty("expenses");
  });
});
