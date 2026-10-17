import type { WatchIntakeValues } from "./model";
import { buildWatchIntakePayload, watchIntakeFieldTab, watchIntakeMoneyFields } from "./model";

const labels: Record<keyof WatchIntakeValues, string> = {
  brand: "Brand", model: "Model", referenceNumber: "Reference", serialNumber: "Serial number", internalSerial: "Movement serial",
  year: "Year", linkCount: "Link count", condition: "Condition", box: "Box", papers: "Papers", gdriveLink: "Drive link",
  purchasedFrom: "Purchase channel", paidWith: "Paid with", clientId: "Seller", purchasePrice: "Purchase cost", importFee: "Import fee",
  watchRegister: "Watch Register", purchaseDate: "Purchase date", serviceFee: "Service cost", polishFee: "Polishing cost",
  dateSentToService: "Sent to service", dateReturnedFromService: "Returned from service", serviceNotes: "Service notes",
  status: "Resulting status", dateReceived: "Date received", dateListed: "Date listed", dateSold: "Date sold", soldTo: "Buyer",
  salePrice: "Sale price", soldPlatform: "Sales platform", platformFees: "Platform fees", shippingFee: "Shipping cost",
  insuranceFee: "Insurance", shippingPartner: "Shipping partner", trackingNumber: "Tracking number", dateShipped: "Date shipped",
  targetSellPrice: "Target sell price", notes: "Notes",
};
const sectionTitles = ["Watch", "Purchase", "Preparation", "Listing & Sale"];
export function IntakeReview({ values, clients, edit }: {
  values: WatchIntakeValues; clients: Array<{ id: number; name: string }>; edit: (tab: number) => void;
}) {
  const status = buildWatchIntakePayload(values).status;
  return <div className="mx-auto max-w-3xl space-y-4">
    <div className="rounded-xl bg-emerald-900 p-5 text-white">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-emerald-200">Review before saving</p>
      <h3 className="mt-2 break-words text-2xl font-semibold">{values.brand || "New watch"} {values.model}</h3>
      <p className="mt-1 text-sm text-emerald-100">{values.referenceNumber || "Reference number not entered"}</p>
    </div>
    {sectionTitles.map((title, tab) => <section key={title} className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{title}</h3>
        <button type="button" onClick={() => edit(tab)} className="px-2 py-1 text-sm font-semibold text-emerald-800" aria-label={`Edit ${title}`}>Edit</button>
      </div>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {(Object.keys(labels) as Array<keyof WatchIntakeValues>).filter(key => watchIntakeFieldTab[key] === tab).map(key => {
          const value = key === "status" ? status : values[key];
          if (value === "" || value === null || value === undefined) return null;
          let text = String(value);
          if (typeof value === "boolean") text = value ? "Yes" : "No";
          if ((watchIntakeMoneyFields as readonly string[]).includes(key)) text = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(value));
          if (key === "clientId") text = clients.find(client => client.id === Number(value))?.name || "No seller selected";
          if (key === "status") text = value === "in_stock" ? "Listed" : text.charAt(0).toUpperCase() + text.slice(1);
          return <div key={key} className="min-w-0 border-b border-slate-100 pb-2">
            <dt className="text-xs text-slate-500">{labels[key]}</dt><dd className="mt-0.5 break-words whitespace-pre-wrap text-sm">{text}</dd>
          </div>;
        })}
      </dl>
    </section>)}
    <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">Required: watch identity, purchase channel, payment method, and purchase cost. Dealer purchases also require a seller.</p>
  </div>;
}
