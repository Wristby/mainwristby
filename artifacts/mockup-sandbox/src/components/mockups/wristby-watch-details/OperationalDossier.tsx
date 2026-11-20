import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  FileText,
  MoreHorizontal,
  PackageCheck,
  Plus,
  ShieldCheck,
  Sparkles,
  Watch,
} from "lucide-react";

type EventKind = "sale" | "care" | "inventory";

const events: { date: string; title: string; detail: string; kind: EventKind; amount?: string }[] = [
  { date: "18 NOV 2026", title: "Delivered to Alexandra de Vries", detail: "Courier confirmed handover at 14:32. Buyer accepted the complete set in excellent condition.", kind: "sale", amount: "€13.600" },
  { date: "17 NOV 2026", title: "Final payment received", detail: "€13.600 settled by bank transfer. Payment reconciled against sale record #35.", kind: "sale" },
  { date: "15 NOV 2026", title: "Warranty registered", detail: "Wristby in-house coverage activated through 18 November 2027.", kind: "care" },
  { date: "24 JUN 2026", title: "Listed for sale", detail: "Published as a full set on the Wristby marketplace. Asking price €13.950.", kind: "inventory", amount: "€13.950" },
  { date: "12 JUN 2026", title: "Added to inventory", detail: "Purchased from a private collector. Box, papers, and original bracelet included.", kind: "inventory", amount: "€11.773" },
];

const kindLabel: Record<EventKind, string> = { sale: "Transaction", care: "Coverage", inventory: "Inventory" };

export function OperationalDossier() {
  const [filter, setFilter] = useState<"all" | EventKind>("all");
  const [expanded, setExpanded] = useState<number | null>(0);
  const [showActions, setShowActions] = useState(false);
  const [message, setMessage] = useState("");
  const [checklist, setChecklist] = useState([true, false, false]);
  const visibleEvents = useMemo(() => filter === "all" ? events : events.filter((event) => event.kind === filter), [filter]);
  const completedCount = checklist.filter(Boolean).length;

  const announce = (text: string) => {
    setMessage(text);
    setShowActions(false);
  };

  return (
    <main className="min-h-[100dvh] bg-[#f3f2ec] px-4 py-5 text-[#1d3029] sm:px-7 sm:py-8" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <div className="mx-auto max-w-[1220px]">
        <div className="mb-5 flex items-center justify-between border-b border-[#d8ddd5] pb-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.17em] text-[#64756a]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1d4537] text-[#f2ead5]"><Watch size={14} /></span>
            Wristby <span className="text-[#aab3a8]">/</span> Inventory <span className="text-[#aab3a8]">/</span> Record 035
          </div>
          <div className="hidden items-center gap-2 text-xs text-[#728075] sm:flex"><CircleDot size={12} className="text-[#d17a4e]" /> Saved record · 18 Nov 2026</div>
        </div>

        <header className="relative grid gap-7 border-b border-[#cfd7ce] pb-7 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#1f4d3d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#f4f0e5]">Sold</span>
              <span className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#718076]">Rolex · Reference 126610LN</span>
            </div>
            <h1 className="font-serif text-[clamp(2.2rem,5vw,4.25rem)] leading-[.96] tracking-[-.045em] text-[#1c342a]">Submariner <span className="italic text-[#718474]">Date</span></h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#65766b]">
              <span>Serial 7K42•••</span><span>2022</span><span>Excellent condition</span><span>Complete set</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => announce("Edit record opened in preview mode.")} className="rounded-full border border-[#bfcac0] px-4 py-2.5 text-xs font-semibold text-[#294637] transition hover:bg-[#e6e9e0]">Edit record</button>
            <div className="relative">
              <button aria-label="More record actions" onClick={() => setShowActions(!showActions)} className="grid h-10 w-10 place-items-center rounded-full border border-[#bfcac0] transition hover:bg-[#e6e9e0]"><MoreHorizontal size={18} /></button>
              {showActions && <div className="absolute right-0 top-12 z-10 w-48 overflow-hidden rounded-xl border border-[#d4dbd2] bg-[#fbfaf5] p-1 shadow-lg">
                <button onClick={() => announce("Insurance report prepared for this preview.")} className="block w-full rounded-lg px-3 py-2.5 text-left text-xs hover:bg-[#edf0e9]">Prepare insurance report</button>
                <button onClick={() => announce("Record archived in this preview.")} className="block w-full rounded-lg px-3 py-2.5 text-left text-xs hover:bg-[#edf0e9]">Archive record</button>
              </div>}
            </div>
          </div>
          {message && <p role="status" className="absolute bottom-0 right-0 translate-y-full pt-2 text-xs text-[#416a51]">{message}</p>}
        </header>

        <section className="my-6 grid overflow-hidden rounded-2xl bg-[#204637] text-[#f4f1e8] md:grid-cols-[1.5fr_.8fr_.8fr_.9fr]">
          <div className="p-5 md:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#b7c9b6]">Net result</p>
            <div className="mt-2 flex items-baseline gap-2"><span className="font-serif text-4xl tracking-[-.04em]">€1.733</span><span className="text-xs text-[#b7c9b6]">+{(14.7).toFixed(1)}% margin</span></div>
          </div>
          <Metric label="Sale price" value="€13.600" />
          <Metric label="Acquisition" value="€11.773" />
          <button onClick={() => announce("Financial statement opened in preview mode.")} className="flex items-center justify-between border-t border-white/15 px-5 py-4 text-left text-xs font-semibold text-[#e3eadc] hover:bg-white/5 md:border-l md:border-t-0 md:px-6">View breakdown <ArrowUpRight size={15} /></button>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(290px,.75fr)]">
          <section aria-label="Watch history">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#8a968b]">The record</p><h2 className="mt-1 font-serif text-2xl tracking-[-.025em]">A life in five moments</h2></div>
              <div className="flex rounded-full border border-[#d5dcd3] bg-[#ebece5] p-1">
                {(["all", "sale", "care", "inventory"] as const).map((item) => <button key={item} onClick={() => { setFilter(item); setExpanded(null); }} className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${filter === item ? "bg-[#294c3d] text-white" : "text-[#67776b] hover:text-[#1e392d]"}`}>{item === "all" ? "All" : kindLabel[item]}</button>)}
              </div>
            </div>
            <div className="relative ml-2 border-l border-[#cbd5ca] pl-6">
              {visibleEvents.map((event, index) => {
                const open = expanded === index;
                return <article key={`${event.title}-${event.date}`} className="relative pb-3">
                  <span className={`absolute -left-[31px] top-5 h-2.5 w-2.5 rounded-full border-2 ${index === 0 ? "border-[#d17a4e] bg-[#f3f2ec]" : "border-[#839783] bg-[#f3f2ec]"}`} />
                  <button onClick={() => setExpanded(open ? null : index)} aria-expanded={open} className="flex w-full items-start justify-between gap-4 rounded-xl px-3 py-3 text-left transition hover:bg-[#e9ebe4]">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="text-[10px] font-bold tracking-[.11em] text-[#8b978c]">{event.date}</span><span className="rounded-full bg-[#e2e8df] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-[#5d715f]">{kindLabel[event.kind]}</span></span>
                      <span className="mt-1.5 block font-medium text-[15px] tracking-[-.01em]">{event.title}</span>
                      {open && <span className="mt-2 block max-w-xl text-xs leading-5 text-[#6d7c70]">{event.detail}</span>}
                    </span>
                    <span className="flex shrink-0 items-center gap-3 pt-1">{event.amount && <span className="hidden text-xs font-semibold tabular-nums text-[#53695a] sm:block">{event.amount}</span>}{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>
                  </button>
                </article>;
              })}
              {visibleEvents.length === 0 && <p className="py-8 text-sm text-[#718076]">No moments in this chapter yet.</p>}
            </div>
            <button onClick={() => announce("A new event is ready to add in this preview.")} className="ml-8 mt-2 inline-flex items-center gap-2 rounded-full border border-dashed border-[#b9c6ba] px-4 py-2.5 text-xs font-semibold text-[#58705d] hover:bg-[#e7ebe3]"><Plus size={14} /> Add a moment</button>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#d7ddd3] bg-[#faf9f4] p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#859187]">Next up</p><h2 className="mt-1 font-serif text-xl">Close the loop</h2></div>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e7ede5] text-[#385c45]"><Clock3 size={17} /></span>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#718075]">Three small checks keep this sale complete and protected.</p>
              <div className="mt-4 space-y-1">
                {["Delivery confirmed", "Return period closed", "File insurance copy"].map((item, index) => <button key={item} onClick={() => setChecklist(checklist.map((value, i) => i === index ? !value : value))} className="flex w-full items-center gap-3 rounded-lg py-2 text-left text-xs hover:bg-[#f0f1eb]">
                  <span className={`grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full border ${checklist[index] ? "border-[#376348] bg-[#376348] text-white" : "border-[#c2cdc1]"}`}>{checklist[index] && <Check size={11} />}</span>
                  <span className={checklist[index] ? "text-[#89958a] line-through" : "text-[#344b3c]"}>{item}</span>
                </button>)}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#e3e6de] pt-3 text-[10px] font-semibold uppercase tracking-[.1em] text-[#829084]"><span>{completedCount} of 3 complete</span><span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#e3e8df]"><span className="block h-full rounded-full bg-[#4a7658]" style={{ width: `${(completedCount / 3) * 100}%` }} /></span></div>
            </section>

            <section className="relative overflow-hidden rounded-2xl bg-[#e6e9df] p-5">
              <div className="absolute -right-6 -top-7 text-[#d6ddd2]"><ShieldCheck size={110} strokeWidth={0.7} /></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-[#58745f]"><PackageCheck size={16} /><span className="text-[10px] font-bold uppercase tracking-[.14em]">Protection</span></div>
                <h3 className="mt-3 font-serif text-xl">Covered through<br />18 Nov 2027</h3>
                <p className="mt-2 max-w-[230px] text-xs leading-5 text-[#748176]">Wristby buyer warranty is active. Return window closes in 12 days.</p>
                <button onClick={() => announce("Coverage details opened in this preview.")} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#365b44] hover:text-[#1d3f2d]">Coverage details <ArrowDownRight size={14} /></button>
              </div>
            </section>

            <button onClick={() => announce("Sale documents opened in this preview.")} className="flex w-full items-center gap-3 rounded-xl border border-[#d5ddd3] bg-[#faf9f4] p-4 text-left transition hover:bg-[#e9ece5]">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e8ece4] text-[#52705a]"><FileText size={16} /></span>
              <span className="flex-1"><span className="block text-xs font-semibold">Sale documents</span><span className="mt-1 block text-[10px] text-[#819084]">Invoice · delivery note · warranty</span></span>
              <Sparkles size={14} className="text-[#bd815d]" />
            </button>
          </aside>
        </div>

        <footer className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-[#d5dcd3] pt-4 text-[10px] uppercase tracking-[.13em] text-[#879389]">
          <span>Private inventory record · SKU 035</span><span>Purchased 12 Jun <span className="mx-2 text-[#bac3b9]">/</span> Held 151 days <span className="mx-2 text-[#bac3b9]">/</span> Sold 18 Nov</span>
        </footer>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="border-t border-white/15 px-5 py-4 md:border-l md:border-t-0 md:px-6 md:py-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#b7c9b6]">{label}</p><p className="mt-2 text-lg font-semibold tabular-nums">{value}</p></div>;
}

export default OperationalDossier;
