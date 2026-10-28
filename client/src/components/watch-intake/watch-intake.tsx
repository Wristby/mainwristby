import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ArrowLeft, ArrowRight, Check, X, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useCreateInventory, useInventorySerialMatches } from "@/hooks/use-inventory";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { useSettings } from "@/hooks/use-settings";
import { insertClientSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { buildWatchIntakePayload, watchIntakeConditions, watchIntakeDefaults, watchIntakeFieldTab, watchIntakeSchema, type WatchIntakeValues } from "./model";
import { Card, CheckRow, DateField, Field, Money } from "./fields";
import { IntakeReview } from "./review";
import { SaleBuyerFields } from "@/components/sale-buyer-fields";
import { emptySaleBuyer, type SaleBuyerDraft } from "@shared/sale-buyer";
import { normalizeWatchSerial } from "@shared/serial-match";
import { SerialMatchNotice } from "./serial-match-notice";
const tabs = [
  { name: "Watch", hint: "Identity & condition" },
  { name: "Purchase", hint: "Acquisition & costs" },
  { name: "Preparation", hint: "Service & finish" },
  { name: "Listing & Sale", hint: "Status & fulfillment" },
  { name: "Review", hint: "Confirm details" },
] as const;
const euro = (value: unknown) => `€${(Number(value || 0)).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface WatchIntakeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WatchIntake({ open, onOpenChange }: WatchIntakeProps) {
  const { settings } = useSettings();
  const { data: clients = [], isLoading: clientsLoading, isError: clientsUnavailable } = useClients();
  const [buyer, setBuyer] = useState<SaleBuyerDraft>(emptySaleBuyer);
  const [buyerDirty, setBuyerDirty] = useState(false);
  const [buyerError, setBuyerError] = useState("");
  const [saveError, setSaveError] = useState("");
  const createWatch = useCreateInventory();
  const createClient = useCreateClient();
  const { toast } = useToast();
  const [tab, setTab] = useState(0);
  const [quickAdd, setQuickAdd] = useState(false);
  const [seller, setSeller] = useState({ name: "", type: "dealer", email: "", phone: "", socialHandle: "", website: "", country: "", notes: "", isVip: false });
  const [showSale, setShowSale] = useState(false);
  const [showService, setShowService] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [mobileViewport, setMobileViewport] = useState<{height: number; top: number} | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const activeStep = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const form = useForm<WatchIntakeValues>({ resolver: zodResolver(watchIntakeSchema), defaultValues: watchIntakeDefaults, mode: "onSubmit" });
  const { isDirty } = form.formState;
  const values = form.watch();
  const serialNumber = values.serialNumber ?? "";
  const internalSerial = values.internalSerial ?? "";
  const [serialLookup, setSerialLookup] = useState({ serialNumber: "", internalSerial: "" });
  const serialMatches = useInventorySerialMatches(serialLookup.serialNumber, serialLookup.internalSerial, open);
  const serialLookupIsCurrent =
    normalizeWatchSerial(serialNumber) === normalizeWatchSerial(serialLookup.serialNumber) &&
    normalizeWatchSerial(internalSerial) === normalizeWatchSerial(serialLookup.internalSerial);
  const purchaseChannel = form.watch("purchasedFrom");
  const sellerOptions = useMemo(() => (clients as Array<{id:number;name:string;type:string}>).filter(c => purchaseChannel !== "Dealer" || c.type === "dealer"), [clients, purchaseChannel]);

  useEffect(() => {
    if (!open) {
      setSerialLookup({ serialNumber: "", internalSerial: "" });
      return;
    }
    const timeout = window.setTimeout(() => setSerialLookup({ serialNumber, internalSerial }), 250);
    return () => window.clearTimeout(timeout);
  }, [open, serialNumber, internalSerial]);

  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    const resize = () => setMobileViewport(window.innerWidth < 640 && viewport
      ? { height: viewport.height, top: viewport.offsetTop } : null);
    resize();
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize);
    window.addEventListener("resize", resize);
    return () => {
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", resize);
      window.removeEventListener("resize", resize);
    };
  }, [open]);
  useEffect(() => {
    content.current?.scrollTo({ top: 0 });
    activeStep.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [tab]);
  useEffect(() => {
    if (purchaseChannel && !["Dealer", "Private Purchase", "Other"].includes(purchaseChannel)) form.setValue("clientId", null);
  }, [purchaseChannel, form]);
  useEffect(() => {
    if (values.status === "sold") setShowSale(true);
    if (values.status === "servicing") setShowService(true);
  }, [values.status]);
  useEffect(() => {
    if (values.soldPlatform === "Chrono24" && Number(values.salePrice) > 0) {
      form.setValue("platformFees", Math.round(Number(values.salePrice) * settings.chrono24_commission) / 100);
    }
  }, [values.soldPlatform, values.salePrice, settings.chrono24_commission, form]);

  const close = (next: boolean) => {
    if (submitting.current || createClient.isPending) return;
    if (!next && (isDirty || buyerDirty) && !window.confirm("Discard this unsaved watch intake?")) return;
    if (!next) {
      form.reset(watchIntakeDefaults);
      setTab(0); setShowSale(false); setShowService(false); setShowShipping(false); setQuickAdd(false);
      setBuyer(emptySaleBuyer()); setBuyerDirty(false); setBuyerError(""); setSaveError("");
    }
    onOpenChange(next);
  };
  const submit = form.handleSubmit((data) => {
    if (submitting.current) return;
    let submission;
    try {
      submission = buildWatchIntakePayload(data, buyer);
      setBuyerError(""); setSaveError("");
    } catch (error) {
      setBuyerError(error instanceof z.ZodError ? error.errors[0].message : (error as Error).message);
      setTab(3); setShowSale(true);
      return;
    }
    submitting.current = true;
    createWatch.mutate(submission, {
      onSuccess: () => {
        submitting.current = false;
        form.reset(watchIntakeDefaults); setTab(0); setShowSale(false); setShowService(false); setShowShipping(false);
        setBuyer(emptySaleBuyer()); setBuyerDirty(false); setBuyerError(""); setSaveError(""); setQuickAdd(false);
        onOpenChange(false);
        toast({ title: "Success", description: "Watch added" });
      },
      onError: (error) => {
        submitting.current = false;
        setSaveError(error.message);
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  }, errors => {
    const first = Object.keys(errors)[0];
    const target = first ? watchIntakeFieldTab[first as keyof WatchIntakeValues] : 0;
    setTab(target);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
  });


  return <Dialog open={open} onOpenChange={close}>
    <DialogContent aria-describedby="intake-description" style={mobileViewport ? { height: mobileViewport.height, maxHeight: mobileViewport.height, top: mobileViewport.top + mobileViewport.height / 2 } : undefined} className="flex h-[100dvh] max-h-[100dvh] w-full max-w-5xl flex-col gap-0 overflow-hidden rounded-none border-0 bg-[#f7f8f5] p-0 text-slate-900 sm:h-[min(800px,92dvh)] sm:max-h-[92dvh] sm:rounded-xl sm:border sm:border-slate-200 [&>button:last-child]:hidden">
      <DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-7">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-emerald-800">WRISTBY / INVENTORY</p><DialogTitle className="mt-1 text-xl font-semibold tracking-tight">Add a watch</DialogTitle><p id="intake-description" className="mt-1 text-sm text-slate-500">A clear record, from acquisition through sale.</p></div>
          <button type="button" aria-label="Close intake" onClick={() => close(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4"/></button>
        </div>
      </DialogHeader>
      <nav aria-label="Watch intake sections" className="shrink-0 overflow-x-auto border-b border-slate-200 bg-white px-3 py-3 sm:px-7">
        <ol className="flex min-w-[570px] gap-2">
          {tabs.map((item,index) => <li key={item.name} className="flex-1">
            <button ref={tab===index?activeStep:undefined} type="button" onClick={() => setTab(index)} aria-current={tab === index ? "step" : undefined} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left ${tab===index?"bg-emerald-50 text-emerald-900":"text-slate-500 hover:bg-slate-50"}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${tab===index?"bg-emerald-800 text-white":"bg-slate-100 text-slate-600"}`}>{index+1}</span>
              <span className="min-w-0"><span className="block whitespace-nowrap text-xs font-semibold sm:text-sm">{item.name}</span><span className="hidden text-[11px] text-slate-500 md:block">{item.hint}</span></span>
            </button>
          </li>)}
        </ol>
      </nav>
      <FormProvider {...form}>
      <form noValidate onSubmit={event => { if (tab !== 4) { event.preventDefault(); setTab(tab + 1); } else void submit(event); }} className="flex min-h-0 flex-1 flex-col">
        <div ref={content} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-8 sm:px-7">
          {tab===0 && <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
            <Card title="Identity & reference"><div className="grid gap-4 sm:grid-cols-2">
              <Field name="brand" label="Brand" required options={settings.watch_brands}/><Field name="model" label="Model" required/>
              <Field name="referenceNumber" label="Reference number" required/><Field name="year" label="Production year" type="number"/>
              <Field name="serialNumber" label="Serial number"/><Field name="internalSerial" label="Movement / internal serial"/>
              {serialLookupIsCurrent && <SerialMatchNotice
                matches={serialMatches.data ?? []}
                loading={serialMatches.isFetching}
                error={serialMatches.isError}
              />}
              <Field name="linkCount" label="Bracelet link count" type="number"/><Field name="condition" label="Condition" options={[...watchIntakeConditions]}/>
            </div><div className="mt-4 grid gap-3 sm:grid-cols-2"><CheckRow name="box" label="Box included"/><CheckRow name="papers" label="Papers included"/></div></Card>
            <Card title="Reference materials"><Field name="gdriveLink" label="Google Drive link" placeholder="https://drive.google.com/…" labelAction={
              <a href="https://drive.google.com/drive/u/1/folders/19gIwCa7aNqQk1s00gmkCWWzFC_dfL4sG" target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs text-emerald-600 hover:underline">
                Open Folder <ExternalLink className="h-3 w-3" />
              </a>
            }/><p className="mt-2 text-xs leading-5 text-slate-500">Use your existing shared folder for photographs and documents.</p></Card>
          </div>}
          {tab===1 && <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Purchase details"><div className="grid gap-4 sm:grid-cols-2">
              <Field name="purchasedFrom" label="Purchase channel" required options={settings.purchase_channels}/>
              <Field name="paidWith" label="Paid with" required options={settings.paid_with_methods.length ? settings.paid_with_methods.map(option=>option.name) : ["Credit", "Debit", "Wire"]}/>
              {["Dealer","Private Purchase","Other"].includes(purchaseChannel) && <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="intake-clientId">Seller{purchaseChannel==="Dealer"?" *":""}</Label>
                <div className="flex gap-2"><select id="intake-clientId" {...form.register("clientId")} value={values.clientId ?? ""} className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">Choose seller…</option>{sellerOptions.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                  <Button type="button" variant="outline" className="shrink-0" onClick={()=>{ setSeller({...seller,type:purchaseChannel==="Dealer"?"dealer":"client"}); setQuickAdd(true); }}><Plus className="mr-1 h-4 w-4"/>New seller</Button></div>
                {purchaseChannel==="Dealer" && !values.clientId && form.formState.submitCount>0 && <p role="alert" className="text-xs text-rose-700">Select a dealer.</p>}</div>}
              <DateField name="purchaseDate" label="Purchase date"/>
            </div></Card>
            <Card title="Acquisition cost"><div className="grid gap-4 sm:grid-cols-2">
              <Money name="purchasePrice" label="Purchase cost (€)" /><Money name="importFee" label="Import / duty (€)"/>
              <div className="sm:col-span-2"><CheckRow name="watchRegister" label={`Watch Register (${euro(settings.watch_register_fee / 100)})`}/></div>
            </div><p className="mt-4 text-xs text-slate-500">Costs are entered in euros and stored accurately in cents.</p></Card>
          </div>}
          {tab===2 && <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Service & polishing"><div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm text-slate-600">Add service work only when relevant.</p><button type="button" onClick={()=>setShowService(!showService)} className="text-sm font-semibold text-emerald-800">{showService?"Hide details":"Add details"}</button></div>
              {showService && <><div className="grid gap-4 sm:grid-cols-2">
                <DateField name="dateSentToService" label="Sent to service"/><DateField name="dateReturnedFromService" label="Returned from service"/>
                <Money name="serviceFee" label="Service cost (€)"/><Money name="polishFee" label="Polishing cost (€)"/>
              </div><div className="mt-4"><Label htmlFor="intake-serviceNotes">Service notes</Label><Textarea id="intake-serviceNotes" {...form.register("serviceNotes")} className="mt-1.5 min-h-24 border-slate-300 bg-white" placeholder="Work requested, parts, or findings"/></div></>}</Card>
            <Card title="Preparation status"><p className="text-sm leading-6 text-slate-600">Service dates and preparation costs stay attached to the watch record. Set the current status in Listing & Sale.</p><p className="mt-3 text-xs font-medium text-slate-500">{showService?"Service information is included.":"No service work recorded."}</p></Card>
          </div>}
          {tab===3 && <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2"><Card title="Inventory status"><div className="grid gap-4 sm:grid-cols-2">
              <Field name="status" label="Status" options={["incoming","received","servicing","in_stock","sold"]}/>
              <DateField name="dateReceived" label="Date received"/><DateField name="dateListed" label="Date listed"/><Money name="targetSellPrice" label="Target sell price (€)"/>
            </div></Card>
            <Card title="Optional sale details"><div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm text-slate-600">Add sale information if already sold.</p><button type="button" onClick={()=>setShowSale(!showSale)} className="text-sm font-semibold text-emerald-800">{showSale?"Hide details":"Add details"}</button></div>
              {showSale && <div className="grid gap-4 sm:grid-cols-2"><Money name="salePrice" label="Sale price (€)"/><Field name="soldPlatform" label="Sales platform" options={settings.sales_platforms}/><DateField name="dateSold" label="Date sold"/><Money name="platformFees" label="Platform fees (€)"/><Money name="shippingFee" label="Shipping cost (€)"/><Money name="insuranceFee" label="Insurance (€)"/></div>}
            </Card></div>
            {showSale && <SaleBuyerFields value={buyer} onChange={draft => {
              setBuyer(draft); setBuyerDirty(true); setBuyerError(""); setSaveError("");
              form.setValue("soldTo", draft.name, { shouldDirty: true });
            }} clients={clients} loading={clientsLoading} unavailable={clientsUnavailable} dirty={buyerDirty} error={buyerError}/>}
            <div className="grid gap-4 lg:grid-cols-2"><Card title="Optional shipping & tracking"><div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm text-slate-600">Record dispatch information when available.</p><button type="button" onClick={()=>setShowShipping(!showShipping)} className="text-sm font-semibold text-emerald-800">{showShipping?"Hide details":"Add details"}</button></div>
              {showShipping && <div className="grid gap-4 sm:grid-cols-2"><Field name="shippingPartner" label="Shipping partner" options={settings.shipping_partners}/><Field name="trackingNumber" label="Tracking number"/><DateField name="dateShipped" label="Date shipped"/></div>}
            </Card><Card title="General notes"><Label htmlFor="intake-notes">Notes</Label><Textarea id="intake-notes" {...form.register("notes")} className="mt-1.5 min-h-24 border-slate-300 bg-white" placeholder="Private working notes"/></Card></div>
          </div>}
          {tab===4 && <IntakeReview values={values} clients={clients} edit={setTab} buyer={buyer}/>}
          {saveError && <p role="alert" className="mt-4 text-sm text-red-600">{saveError}</p>}
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-7">
          <Button type="button" variant="outline" onClick={()=>tab===0?close(false):setTab(tab-1)} disabled={createWatch.isPending}><ArrowLeft className="mr-2 h-4 w-4"/>{tab===0?"Cancel":"Back"}</Button>
          <p className="hidden text-xs text-slate-500 sm:block">Step {tab+1} of {tabs.length}</p>
          {tab<4 ? <Button type="button" onClick={()=>setTab(tab+1)} className="bg-emerald-800 text-white hover:bg-emerald-900">Next<ArrowRight className="ml-2 h-4 w-4"/></Button> :
            <Button type="submit" disabled={createWatch.isPending} className="min-w-36 bg-emerald-800 text-white hover:bg-emerald-900">{createWatch.isPending?<span>Adding…</span>:<><Check className="mr-2 h-4 w-4"/>Add watch</>}</Button>}
        </footer>
      </form>
      </FormProvider>
    </DialogContent>
    <Dialog open={quickAdd} onOpenChange={setQuickAdd}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto bg-white text-slate-900">
        <DialogHeader><DialogTitle>Add seller</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={async event=>{
          event.preventDefault();
          const payload = {...seller, type: seller.type as "client"|"dealer"};
          const parsed = insertClientSchema.safeParse(payload);
          if (!parsed.success) { toast({title:"Check seller details", description: parsed.error.issues[0]?.message, variant:"destructive"}); return; }
          try { const created = await createClient.mutateAsync(parsed.data); form.setValue("clientId", created.id, {shouldDirty:true}); setQuickAdd(false); setSeller({name:"",type:"dealer",email:"",phone:"",socialHandle:"",website:"",country:"",notes:"",isVip:false}); }
          catch(error) { toast({title:"Could not add seller",description:error instanceof Error?error.message:"Please try again.",variant:"destructive"}); }
        }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="seller-name">Name *</Label><Input id="seller-name" required value={seller.name} onChange={e=>setSeller({...seller,name:e.target.value})} autoFocus/></div>
            <div><Label htmlFor="seller-type">Type</Label><select id="seller-type" value={seller.type} onChange={e=>setSeller({...seller,type:e.target.value})} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="dealer">Dealer</option><option value="client" disabled={purchaseChannel==="Dealer"}>Client</option></select></div>
            <div><Label htmlFor="seller-email">Email</Label><Input id="seller-email" type="email" value={seller.email} onChange={e=>setSeller({...seller,email:e.target.value})}/></div>
            <div><Label htmlFor="seller-phone">Phone</Label><Input id="seller-phone" value={seller.phone} onChange={e=>setSeller({...seller,phone:e.target.value})}/></div>
            <div><Label htmlFor="seller-social">Social handle</Label><Input id="seller-social" value={seller.socialHandle} onChange={e=>setSeller({...seller,socialHandle:e.target.value})}/></div>
            <div><Label htmlFor="seller-website">Website</Label><Input id="seller-website" value={seller.website} onChange={e=>setSeller({...seller,website:e.target.value})}/></div>
            <div className="sm:col-span-2"><Label htmlFor="seller-country">Country</Label><Input id="seller-country" value={seller.country} onChange={e=>setSeller({...seller,country:e.target.value})}/></div>
            <div className="sm:col-span-2"><Label htmlFor="seller-notes">Notes</Label><Textarea id="seller-notes" value={seller.notes} onChange={e=>setSeller({...seller,notes:e.target.value})}/></div>
            <label className="flex items-center gap-2"><Checkbox checked={seller.isVip} onCheckedChange={checked=>setSeller({...seller,isVip:!!checked})}/>VIP client</label>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setQuickAdd(false)}>Cancel</Button><Button type="submit" disabled={createClient.isPending} className="bg-emerald-800 text-white">{createClient.isPending?"Adding…":"Add seller"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </Dialog>;
}
