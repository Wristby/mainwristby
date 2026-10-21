import { format } from "date-fns";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link, type InventoryItem } from "./_source/runtime";
import { SoldReturnSummary } from "./_source/sold-return-summary";

type RecentlySoldProps = {
  watches: InventoryItem[];
  now: Date;
  calcProfit: (item: InventoryItem) => number;
  formatCurrency: (value: number) => string;
};

function saleTimestamp(item: InventoryItem) {
  const timestamp = new Date(item.soldDate || item.dateSold || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function WorkspaceRecentlySold({ watches, now, calcProfit, formatCurrency }: RecentlySoldProps) {
  const sold = watches.filter((item) => item.status === "sold");
  const recent = [...sold].sort((a, b) => saleTimestamp(b) - saleTimestamp(a)).slice(0, 6);

  return (
    <section className="ww-sales-ledger" aria-label="Recently sold watches">
      <header className="ww-ledger-heading">
        <div><ShoppingBag size={17}/><div><span>SALES REGISTER</span><h2>Recently sold</h2></div></div>
        <span className="ww-ledger-count">{sold.length} records</span>
      </header>
      {recent.length === 0 ? <div className="ww-sales-empty">No watches sold yet.</div> : <>
        <div className="ww-ledger-columns" aria-hidden="true"><span>Watch / sold</span><span>Sale</span><span>Profit</span><span>Return window</span></div>
        <div className="ww-ledger-rows">{recent.map((item) => {
          const profit = calcProfit(item);
          const soldDate = item.soldDate || item.dateSold;
          return <Link key={item.id} href={`/inventory/${item.id}`} className="ww-ledger-row">
            <span className="ww-ledger-watch"><strong>{item.brand} {item.model}</strong><small>{soldDate && !isNaN(new Date(soldDate).getTime()) ? format(new Date(soldDate), "d MMM yyyy") : "—"}</small><ArrowUpRight className="ww-ledger-open" size={13}/></span>
            <span className="ww-ledger-sale" data-label="Sale">{formatCurrency(item.salePrice || 0)}</span>
            <span className={`ww-ledger-profit ${profit >= 0 ? "positive" : "negative"}`} data-label="Profit">{profit >= 0 ? "+" : ""}{formatCurrency(profit)}</span>
            <span className="ww-ledger-return" data-label="Return"><SoldReturnSummary deliveredDate={item.deliveredDate} now={now} showDeliveredDate={false}/></span>
          </Link>;
        })}</div>
      </>}
    </section>
  );
}
