import "./_group.css";
import "../wristby-light/_modern.css";
import { Shell } from "./Shell";
import { WatchIdentityCard } from "./_source/identity-card";
import { PurchaseInformationCard } from "./_source/purchase-information-card";
import { DealOverviewCard } from "./_source/deal-overview-card";
import {
  BuyerContactCard,
  BuyerDeliveryCard,
  HistoricalSalesCard,
  PageHeading,
  PriceHistoryCard,
  QuickEstimateCard,
  SalesHistoryCard,
  ServiceWarrantyCard,
  StatusCard,
  TechnicalCard,
  formatCurrency,
  margin,
  profit,
  salePrice,
  watch,
} from "./WatchDetailsContent";

/** Faithful content/layout reference assembled from the live page's extracted cards. */
export function Current() {
  return (
    <Shell>
      <div className="text-slate-900">
        <PageHeading />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <WatchIdentityCard item={watch} holdTime={151} daysInService={6} daysListed={145} />
            <PurchaseInformationCard item={watch} formatCurrency={formatCurrency} />
            <DealOverviewCard
              item={watch}
              salePrice={salePrice}
              profit={profit}
              margin={margin}
              totalFees={94_700}
              netAfterVat={138_634}
              vatAmount={34_666}
              effectiveRegisterFee={600}
              chrono24Commission={6.5}
              formatCurrency={formatCurrency}
              buyerDelivery={<BuyerDeliveryCard />}
            >
              <div className="rounded-lg border border-slate-100 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Additional Expenses</h3>
                  <span className="text-xs text-emerald-800">+ Add</span>
                </div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Service & polish</span><strong>€420,00</strong></div>
              </div>
            </DealOverviewCard>
            <ServiceWarrantyCard />
            <HistoricalSalesCard />
          </div>
          <aside className="space-y-6">
            <StatusCard />
            <PriceHistoryCard />
            <BuyerContactCard />
            <SalesHistoryCard />
            <QuickEstimateCard />
            <TechnicalCard />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-slate-900">Listing Description</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">A well-kept modern Submariner Date in excellent condition, supplied as a complete set. Recently inspected and ready to enjoy.</p>
                <div className="mt-4 flex gap-2"><span className="text-xs text-emerald-800">Generate</span><span className="text-xs text-slate-500">Save</span></div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-slate-900">Notes</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">Full set. Light desk wear on the clasp, polished in-house before listing.</p>
                <span className="mt-3 inline-block text-xs text-slate-400">Edit notes</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
