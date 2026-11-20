import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useForm } from "react-hook-form";
import type { InventoryItem } from "@shared/schema";
import { watchEditFormDefaults, type WatchEditFormValues } from "@/lib/watch-form-contract";
import { DealOverviewCard } from "./deal-overview-card";
import { PurchaseInformationCard } from "./purchase-information-card";
import { WatchIdentityCard } from "./identity-card";
import { WarrantyFields, WatchIdentityFields } from "./watch-edit-fields";
import { ServiceHistoryCard } from "./service-history-card";

const item = {
  id: 31,
  brand: "Rolex",
  model: "Submariner",
  referenceNumber: "126610LN",
  serialNumber: "ABC123",
  internalSerial: "MOV456",
  year: 2022,
  condition: "Excellent",
  box: true,
  papers: true,
  gdriveLink: "https://drive.google.com/folder",
  purchasePrice: 1_000_000,
  listPrice: 1_500_000,
  purchasedFrom: "Dealer",
  paidWith: "Wire",
  importFee: 10_000,
  watchRegister: true,
  serviceFee: 5_000,
  polishFee: 2_500,
  salePrice: 1_500_000,
  platformFees: 97_500,
  shippingFee: 5_000,
  insuranceFee: 2_000,
  status: "sold",
} as unknown as InventoryItem;

const formatCurrency = (cents: number) => `€${(cents / 100).toFixed(2)}`;

describe("Watch Details sections", () => {
  it("renders watch identity, condition, and elapsed-time summaries independently", () => {
    const html = renderToStaticMarkup(
      <WatchIdentityCard item={item} holdTime={12} daysInService={3} daysListed={8} />,
    );
    expect(html).toContain("126610LN");
    expect(html).toContain("Excellent");
    expect(html).toContain("12 days");
    expect(html).toContain("8 days");
    expect(html).toContain("View Photos");
  });

  it("keeps purchase information separate and formats stored currency values", () => {
    const html = renderToStaticMarkup(<PurchaseInformationCard item={item} formatCurrency={formatCurrency} />);
    expect(html).toContain("Purchase Channel");
    expect(html).toContain("Dealer");
    expect(html).toContain("€10000.00");
    expect(html).toContain("Watch Register Check");
  });

  it("renders deal calculations, margin targets, and optional delivery content", () => {
    const html = renderToStaticMarkup(
      <DealOverviewCard
        item={item}
        salePrice={1_500_000}
        profit={395_000}
        margin={26.3}
        totalFees={104_500}
        netAfterVat={312_050}
        vatAmount={82_950}
        effectiveRegisterFee={600}
        chrono24Commission={6.5}
        formatCurrency={formatCurrency}
        buyerDelivery={<div data-testid="buyer-delivery-slot">Buyer and delivery section</div>}
      />,
    );
    expect(html).toContain("data-testid=\"cogs-margin-presets\"");
    expect(html).toContain("data-testid=\"cogs-margin-target-15\"");
    expect(html).toContain("6.5% Chrono24 fee");
    expect(html).toContain("Buyer and delivery section");
    expect(html).toContain("Total Value-Add");
  });

  it("keeps the edit identity fields and original Drive-folder shortcut together", () => {
    function IdentityFieldsHarness() {
      const form = useForm<WatchEditFormValues>({ defaultValues: watchEditFormDefaults });
      return <WatchIdentityFields form={form} watchBrands={["Rolex"]} serialLookupIsCurrent={false} />;
    }

    const html = renderToStaticMarkup(<IdentityFieldsHarness />);
    expect(html).toContain("Watch Details");
    expect(html).toContain("Condition");
    expect(html).toContain("Open Folder");
    expect(html).toContain("19gIwCa7aNqQk1s00gmkCWWzFC_dfL4sG");
  });

  it("lets warranty fields be hidden while retaining the section toggle", () => {
    function WarrantyFieldsHarness({ visible }: { visible: boolean }) {
      const form = useForm<WatchEditFormValues>({ defaultValues: watchEditFormDefaults });
      return (
        <WarrantyFields
          form={form}
          showWarrantyDetails={visible}
          setShowWarrantyDetails={() => {}}
        />
      );
    }

    const hiddenHtml = renderToStaticMarkup(<WarrantyFieldsHarness visible={false} />);
    expect(hiddenHtml).toContain("Warranty Coverage");
    expect(hiddenHtml).toContain("Show Warranty Fields");
    expect(hiddenHtml).not.toContain("Store Warranty Term");

    const visibleHtml = renderToStaticMarkup(<WarrantyFieldsHarness visible />);
    expect(visibleHtml).toContain("Store Warranty Term");
    expect(visibleHtml).toContain("Manufacturer Warranty Ends");
  });

  it("shows each saved service visit and their separate total", () => {
    const html = renderToStaticMarkup(
      <ServiceHistoryCard
        item={{
          ...item,
          serviceHistory: [
            { startDate: "2025-02-03", completedDate: "2025-02-06", costCents: 12_550, notes: "Movement cleaned" },
            { startDate: "2026-06-10", completedDate: null, costCents: 8_000, notes: "Regulated timing" },
          ],
        }}
        formatCurrency={formatCurrency}
      />,
    );

    expect(html).toContain("Service History");
    expect(html).toContain("Movement cleaned");
    expect(html).toContain("Regulated timing");
    expect(html).toContain("Total recorded visit costs");
    expect(html).toContain("€205.50");
  });
});
