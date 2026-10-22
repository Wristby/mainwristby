import { describe, expect, it } from "vitest";
import { buildSaleBuyerInput, emptySaleBuyer, matchingBuyerContact, saleBuyerSchema, sameBuyerContact, searchBuyerClients } from "@shared/sale-buyer";
import { api } from "@shared/routes";
import { buildWatchIntakePayload, watchIntakeDefaults } from "../components/watch-intake/model";

describe("watch sale buyers", () => {
  const intake = { ...watchIntakeDefaults, brand: "Rolex", model: "Fixture", referenceNumber: "TEST",
    purchasedFrom: "Dealer", paidWith: "Wire", purchasePrice: 1234.56, clientId: 9, dateSold: "2026-10-01" };
  it("builds sold intake with buyer instructions, separate seller, and cents", () => {
    const payload = buildWatchIntakePayload(intake, { ...emptySaleBuyer(), name: "Buyer" });
    expect(payload).toMatchObject({ status: "sold", purchasePrice: 123456, clientId: 9, saleBuyer: { mode: "new", name: "Buyer" } });
    expect(api.inventory.create.input.parse(payload)).toMatchObject({ clientId: 9, saleBuyer: { mode: "new", name: "Buyer" } });
  });
  it("rejects incomplete or invalid intake buyers on client and server", () => {
    for (const buyer of [{ ...emptySaleBuyer(), email: "a@example.invalid" }, { ...emptySaleBuyer(), name: "Buyer", email: "wrong" },
      { ...emptySaleBuyer(), mode: "existing" as const }]) {
      expect(() => buildWatchIntakePayload(intake, buyer)).toThrow();
    }
    const payload = buildWatchIntakePayload(intake);
    for (const saleBuyer of [{ mode: "new", email: "a@example.invalid" }, { mode: "new", name: "Buyer", email: "wrong" },
      { mode: "existing", clientId: -1 }]) {
      expect(api.inventory.create.input.safeParse({ ...payload, saleBuyer }).success).toBe(false);
    }
  });
  it("creates a valid buyer from a name alone", () => {
    expect(buildSaleBuyerInput({ ...emptySaleBuyer(), name: "  Example Buyer  " }))
      .toEqual({ mode: "new", name: "Example Buyer", email: "", phone: "", country: "" });
  });
  it("accepts name and email with no phone or country", () => {
    expect(buildSaleBuyerInput({ ...emptySaleBuyer(), name: "Buyer", email: "buyer@example.invalid" }))
      .toMatchObject({ mode: "new", name: "Buyer", email: "buyer@example.invalid", phone: "", country: "" });
  });
  it("preserves each optional contact field", () => {
    expect(buildSaleBuyerInput({ ...emptySaleBuyer(), name: "Buyer", email: "buyer@example.invalid", phone: "+31 6 1234", country: "Netherlands" }))
      .toMatchObject({ phone: "+31 6 1234", country: "Netherlands" });
  });
  it("does not create a client for completely empty buyer details", () => {
    expect(buildSaleBuyerInput(emptySaleBuyer())).toEqual({ mode: "none" });
  });
  it.each(["email", "phone", "country"] as const)("requires a name when %s is provided", field => {
    expect(() => buildSaleBuyerInput({ ...emptySaleBuyer(), [field]: field === "email" ? "a@example.invalid" : "some value" })).toThrow("Buyer name is required");
  });
  it("rejects invalid email but accepts optional whitespace", () => {
    expect(saleBuyerSchema.safeParse({ mode: "new", name: "Buyer", email: "wrong" }).success).toBe(false);
    expect(saleBuyerSchema.parse({ mode: "new", name: "Buyer", email: "   " }).email).toBe("");
  });
  it("requires an explicit existing client selection", () => {
    expect(() => buildSaleBuyerInput({ ...emptySaleBuyer(), mode: "existing" })).toThrow("Choose an existing client");
    expect(buildSaleBuyerInput({ ...emptySaleBuyer(), mode: "existing", clientId: 12 })).toEqual({ mode: "existing", clientId: 12 });
  });
  it("leaves buyer instructions absent from legacy watch updates", () => {
    expect(api.inventory.update.input.parse({ soldTo: "Historical buyer", notes: "Edited note" })).not.toHaveProperty("saleBuyer");
  });
  it("keeps seller and buyer association separate in the API", () => {
    expect(api.inventory.update.input.parse({ clientId: 9, saleBuyer: { mode: "existing", clientId: 12 } }))
      .toEqual({ clientId: 9, saleBuyer: { mode: "existing", clientId: 12 } });
  });
  it("rejects malformed buyer instructions server-side", () => {
    expect(api.inventory.update.input.safeParse({ saleBuyer: { mode: "new", email: "x@example.invalid" } }).success).toBe(false);
    expect(api.inventory.update.input.safeParse({ saleBuyer: { mode: "existing", clientId: -1 } }).success).toBe(false);
  });
  const contact = { name: "Same Name", email: "buyer@example.invalid", phone: "+31 (6) 1234", country: "Netherlands" };
  it("detects exact normalized email/phone matches, never name-only matches", () => {
    expect(matchingBuyerContact(contact, { name: "Other name", email: " BUYER@example.invalid " })).toBe(true);
    expect(matchingBuyerContact(contact, { name: "Other name", phone: "+31-6-1234" })).toBe(true);
    expect(matchingBuyerContact(contact, { name: "Same Name" })).toBe(false);
    expect(matchingBuyerContact({ name: "A" }, { name: "A" })).toBe(false);
  });
  it("recognizes a retry of the same saved buyer without discarding edited fields", () => {
    expect(sameBuyerContact(contact, { ...contact, email: "BUYER@example.invalid" })).toBe(true);
    expect(sameBuyerContact(contact, { ...contact, country: "Belgium" })).toBe(false);
  });
  it.each(["same", "BUYER@", "3161234"])("searches existing clients by %s", query => {
    expect(searchBuyerClients([contact, { name: "Different buyer" }], query)).toEqual([contact]);
  });
});
