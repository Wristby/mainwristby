import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SaleBuyerFields } from "./sale-buyer-fields";
import { emptySaleBuyer } from "@shared/sale-buyer";
import type { Client } from "@shared/schema";

vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }));
const client = { id: 12, name: "Saved buyer", email: "saved@example.invalid", phone: null, country: "Netherlands" } as Client;

describe("sale buyer form", () => {
  it("labels each field and explains optional contact details", () => {
    const html = renderToStaticMarkup(<SaleBuyerFields value={emptySaleBuyer()} onChange={() => {}} clients={[]} dirty={false}/>);
    for (const field of ["name", "email", "phone", "country"]) expect(html).toContain(`id="sale-buyer-${field}"`);
    expect(html).toContain("Email, phone, and country are optional");
    expect(html).not.toContain("required=");
  });
  it("shows existing contact details and a profile link without editable contact fields", () => {
    const html = renderToStaticMarkup(<SaleBuyerFields value={{ ...emptySaleBuyer(), mode: "existing", clientId: 12 }} onChange={() => {}} clients={[client]} dirty/>);
    expect(html).toContain("Existing client: Saved buyer");
    expect(html).toContain("saved@example.invalid");
    expect(html).toContain("href=\"/clients/12\"");
    expect(html).toContain("role=\"combobox\"");
    expect(html).not.toContain('id="sale-buyer-email"');
  });
  it("keeps a legacy named buyer unlinked until explicitly requested", () => {
    const html = renderToStaticMarkup(<SaleBuyerFields value={{ ...emptySaleBuyer(), name: "Old buyer" }} onChange={() => {}} clients={[]} dirty={false}/>);
    expect(html).toContain("Create Client from this buyer when saving");
    expect(html).not.toContain("A new Client will be created when you save");
  });
  it("announces validation/save errors", () => {
    const html = renderToStaticMarkup(<SaleBuyerFields value={emptySaleBuyer()} onChange={() => {}} clients={[]} dirty error="Buyer name is required"/>);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Buyer name is required");
  });
});
