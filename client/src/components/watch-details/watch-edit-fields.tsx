import type { ReactNode, Ref } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { Client } from "@shared/schema";
import type { SaleBuyerDraft } from "@shared/sale-buyer";
import type { WatchEditFormInput, WatchEditFormValues } from "@/lib/watch-form-contract";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SaleBuyerFields } from "@/components/sale-buyer-fields";
import { cn, parsePriceInput } from "@/lib/utils";
import { WATCH_DETAIL_CONDITIONS } from "@/lib/watch-condition";
import { Calendar as CalendarIcon, ExternalLink, Plus } from "lucide-react";
import { Controller } from "react-hook-form";
import { format } from "date-fns";

type WatchEditForm = UseFormReturn<WatchEditFormInput, unknown, WatchEditFormValues>;
type DatePopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WatchIdentityFields({
  form,
  watchBrands,
  serialLookupIsCurrent,
  serialMatchNotice,
}: {
  form: WatchEditForm;
  watchBrands: string[];
  serialLookupIsCurrent: boolean;
  serialMatchNotice?: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Watch Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Brand *</Label>
          <Select value={form.watch("brand")} onValueChange={(value) => form.setValue("brand", value)}>
            <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Brand" /></SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              {watchBrands.map(brand => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Model *</Label>
          <Input {...form.register("model")} className="bg-white border-slate-200" data-testid="edit-input-model" />
        </div>
        <div className="space-y-2">
          <Label>Reference Number *</Label>
          <Input {...form.register("referenceNumber")} className="bg-white border-slate-200" data-testid="edit-input-reference" />
        </div>
        <div className="space-y-2">
          <Label>Serial #</Label>
          <Input {...form.register("serialNumber")} className="bg-white border-slate-200" data-testid="edit-input-serial" />
        </div>
        <div className="space-y-2">
          <Label>Movement Serial Number</Label>
          <Input {...form.register("internalSerial")} className="bg-white border-slate-200" />
        </div>
        {serialLookupIsCurrent && serialMatchNotice}
        <div className="space-y-2">
          <Label>Year</Label>
          <Input type="text" inputMode="numeric" pattern="[0-9]*" {...form.register("year")} className="bg-white border-slate-200" />
        </div>
        <div className="space-y-2">
          <Label>Link Count</Label>
          <Input type="text" inputMode="numeric" pattern="[0-9]*" {...form.register("linkCount")} placeholder="e.g. 18" className="bg-white border-slate-200" data-testid="edit-input-link-count" />
        </div>
        <div className="space-y-2">
          <Label>Condition</Label>
          <Select value={form.watch("condition")} onValueChange={(value) => form.setValue("condition", value as any)}>
            <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Condition" /></SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              {WATCH_DETAIL_CONDITIONS.map(condition => <SelectItem key={condition} value={condition}>{condition}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-4 pt-6">
          <div className="flex items-center space-x-2">
            <Checkbox id="edit-box" checked={form.watch("box")} onCheckedChange={checked => form.setValue("box", !!checked)} />
            <Label htmlFor="edit-box" className="cursor-pointer">Box</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="edit-papers" checked={form.watch("papers")} onCheckedChange={checked => form.setValue("papers", !!checked)} />
            <Label htmlFor="edit-papers" className="cursor-pointer">Papers</Label>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Google Drive Link</Label>
            <a
              href="https://drive.google.com/drive/u/1/folders/19gIwCa7aNqQk1s00gmkCWWzFC_dfL4sG"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
            >
              Open Folder <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <Input {...form.register("gdriveLink")} className="bg-white border-slate-200" placeholder="https://drive.google.com/..." />
        </div>
      </div>
    </section>
  );
}

export function PurchaseAndPreparationFields({
  form,
  purchaseChannels,
  clients,
  showSellerField,
  isSellerRequired,
  filterDealersOnly,
  paidWithMethods,
  onQuickAddSeller,
  purchaseDatePopover,
}: {
  form: WatchEditForm;
  purchaseChannels: string[];
  clients?: Client[];
  showSellerField: boolean;
  isSellerRequired: boolean;
  filterDealersOnly: boolean;
  paidWithMethods: { name: string }[];
  onQuickAddSeller: () => void;
  purchaseDatePopover: DatePopoverProps;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Purchase Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Purchase Channel *</Label>
          <Select value={form.watch("purchasedFrom") || ""} onValueChange={value => form.setValue("purchasedFrom", value)}>
            <SelectTrigger className="bg-white border-slate-200" data-testid="select-purchase-channel"><SelectValue placeholder="Select Channel" /></SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              {purchaseChannels.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {showSellerField && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 min-h-[1.5rem]">
              <Label>Seller / Dealer{isSellerRequired ? " *" : ""}</Label>
              <Button size="icon" variant="ghost" onClick={onQuickAddSeller} data-testid="button-quick-add-client" className="h-6 w-6">
                <span className="sr-only">Add seller</span>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Select value={form.watch("clientId")?.toString() || "none"} onValueChange={value => form.setValue("clientId", value === "none" ? null : parseInt(value))}>
              <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Dealer" /></SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="none">None</SelectItem>
                {clients?.filter(client => filterDealersOnly ? client.type === "dealer" : true).map(client => (
                  <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>Paid With *</Label>
          <Select value={form.watch("paidWith") || ""} onValueChange={value => form.setValue("paidWith", value)}>
            <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Payment" /></SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              {paidWithMethods.map(option => <SelectItem key={option.name} value={option.name}>{option.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Purchase Price (COGS) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
            <Input
              type="text"
              {...form.register("purchasePrice", { setValueAs: parsePriceInput })}
              onBlur={event => {
                const value = parsePriceInput(event.target.value);
                form.setValue("purchasePrice", parseFloat(value.toFixed(2)));
              }}
              className="pl-7 bg-white border-slate-200"
              data-testid="edit-input-price"
              placeholder="0,00"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Import Fee</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400">€</span>
            <Input
              type="text"
              {...form.register("importFee", { setValueAs: parsePriceInput })}
              onBlur={event => {
                const value = parsePriceInput(event.target.value);
                form.setValue("importFee", parseFloat(value.toFixed(2)));
              }}
              className="pl-7 bg-white border-slate-200"
              placeholder="0,00"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-8">
          <Checkbox id="edit-watchRegister" checked={form.watch("watchRegister")} onCheckedChange={checked => form.setValue("watchRegister", !!checked)} />
          <Label htmlFor="edit-watchRegister" className="cursor-pointer">Watch Register</Label>
        </div>
        <div className="space-y-2">
          <Label>Purchase Date</Label>
          <Popover open={purchaseDatePopover.open} onOpenChange={purchaseDatePopover.onOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !form.watch("purchaseDate") && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("purchaseDate") ? format(new Date(form.watch("purchaseDate")!), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-slate-200">
              <Calendar mode="single" selected={form.watch("purchaseDate") ? new Date(form.watch("purchaseDate")!) : undefined} onSelect={date => {
                form.setValue("purchaseDate", date ? date.toISOString() : null);
                if (date) form.setValue("status", "incoming");
                purchaseDatePopover.onOpenChange(false);
              }} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </section>
  );
}

export function StatusAndListingFields({
  form,
  receivedDatePopover,
  listedDatePopover,
}: {
  form: WatchEditForm;
  receivedDatePopover: DatePopoverProps;
  listedDatePopover: DatePopoverProps;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Status &amp; Listing</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Current Status *</Label>
          <Select value={form.watch("status")} onValueChange={value => form.setValue("status", value as any)}>
            <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Status" /></SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              <SelectItem value="incoming">Incoming</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="servicing">In Service</SelectItem>
              <SelectItem value="in_stock">Listed</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date Received</Label>
          <Popover open={receivedDatePopover.open} onOpenChange={receivedDatePopover.onOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white border-slate-200 text-slate-900", !form.watch("dateReceived") && "text-slate-500")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("dateReceived") ? format(new Date(form.watch("dateReceived")!), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-slate-200">
              <Calendar mode="single" selected={form.watch("dateReceived") ? new Date(form.watch("dateReceived")!) : undefined} onSelect={date => {
                form.setValue("dateReceived", date ? date.toISOString() : null);
                if (date) form.setValue("status", "received");
                receivedDatePopover.onOpenChange(false);
              }} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Date Listed</Label>
          <Popover open={listedDatePopover.open} onOpenChange={listedDatePopover.onOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !form.watch("dateListed") && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("dateListed") ? format(new Date(form.watch("dateListed")!), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-slate-200">
              <Calendar mode="single" selected={form.watch("dateListed") ? new Date(form.watch("dateListed")!) : undefined} onSelect={date => {
                const value = date ? date.toISOString() : null;
                form.setValue("dateListed", value);
                if (date) {
                  form.setValue("status", "in_stock");
                  if (form.getValues("serviceStartDate")) form.setValue("dateReturnedFromService", value);
                }
                listedDatePopover.onOpenChange(false);
              }} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Price Listed At</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">€</span>
            <Input
              type="text"
              {...form.register("listPrice", { setValueAs: value => value === "" || value === null ? null : parsePriceInput(value) })}
              onBlur={event => {
                const value = event.target.value;
                if (value === "" || value === null) {
                  form.setValue("listPrice", null);
                  return;
                }
                const parsed = parsePriceInput(value);
                form.setValue("listPrice", parsed > 0 ? parseFloat(parsed.toFixed(2)) : null);
              }}
              className="pl-7 bg-white border-slate-200"
              data-testid="edit-input-list-price"
              placeholder="0,00"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function SaleDetailsFields({
  form,
  platforms,
  showSaleDetails,
  setShowSaleDetails,
  salesSectionRef,
  buyerDraft,
  clients,
  clientsLoading,
  clientsUnavailable,
  buyerDirty,
  buyerError,
  onBuyerChange,
  soldDatePopover,
}: {
  form: WatchEditForm;
  platforms: string[];
  showSaleDetails: boolean;
  setShowSaleDetails: (show: boolean) => void;
  salesSectionRef: Ref<HTMLDivElement>;
  buyerDraft: SaleBuyerDraft;
  clients?: Client[];
  clientsLoading: boolean;
  clientsUnavailable: boolean;
  buyerDirty: boolean;
  buyerError: string;
  onBuyerChange: (draft: SaleBuyerDraft) => void;
  soldDatePopover: DatePopoverProps;
}) {
  const soldPlatform = form.watch("soldPlatform");
  return (
    <div className="space-y-4" ref={salesSectionRef}>
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sale Details</h3>
        <div className="flex items-center space-x-2">
          <Label htmlFor="edit-showSale" className="text-sm font-medium text-slate-500">Show Sale Fields</Label>
          <Switch id="edit-showSale" checked={showSaleDetails} onCheckedChange={setShowSaleDetails} />
        </div>
      </div>
      {showSaleDetails && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <Label>Sold Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">€</span>
              <Input type="text" {...form.register("salePrice", { setValueAs: parsePriceInput })} onBlur={event => {
                const value = parsePriceInput(event.target.value);
                form.setValue("salePrice", parseFloat(value.toFixed(2)));
              }} className="pl-7 bg-white border-slate-200" placeholder="0,00" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sold On</Label>
            <Select value={soldPlatform || ""} onValueChange={value => form.setValue("soldPlatform", value)}>
              <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Platform" /></SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                {platforms.map(platform => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {soldPlatform === "Chrono24" && (
            <div className="space-y-2">
              <Label>Chrono24 Fee (%)</Label>
              <div className="relative">
                <Input type="number" min="0" max="100" step="0.01" {...form.register("chrono24FeeRate", {
                  setValueAs: value => value === "" ? undefined : Number(value),
                })} className="pr-8 bg-white border-slate-200" data-testid="edit-input-chrono24-fee-rate" />
                <span className="absolute right-3 top-2.5 text-slate-400">%</span>
              </div>
            </div>
          )}
          <MoneyField form={form} name="platformFees" label="Platform Fees" />
          <MoneyField form={form} name="shippingFee" label="Shipping Fee" placeholder="0,00" />
          <MoneyField form={form} name="insuranceFee" label="Insurance Fee" placeholder="0,00" />
          <SaleBuyerFields
            value={buyerDraft}
            clients={clients || []}
            loading={clientsLoading}
            unavailable={clientsUnavailable}
            dirty={buyerDirty}
            error={buyerError}
            onChange={onBuyerChange}
          />
          <div className="space-y-2">
            <Label>Date Sold</Label>
            <Popover open={soldDatePopover.open} onOpenChange={soldDatePopover.onOpenChange}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !form.watch("dateSold") && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("dateSold") ? format(new Date(form.watch("dateSold")!), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                <Calendar mode="single" selected={form.watch("dateSold") ? new Date(form.watch("dateSold")!) : undefined} onSelect={date => {
                  form.setValue("dateSold", date ? date.toISOString() : null, { shouldDirty: true });
                  if (date) form.setValue("status", "sold", { shouldDirty: true });
                  soldDatePopover.onOpenChange(false);
                }} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
}

function MoneyField({
  form,
  name,
  label,
  placeholder,
}: {
  form: WatchEditForm;
  name: "platformFees" | "shippingFee" | "insuranceFee" | "serviceFee" | "polishFee";
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-slate-400">€</span>
        <Input type="text" {...form.register(name, { setValueAs: parsePriceInput })} onBlur={event => {
          const value = parsePriceInput(event.target.value);
          form.setValue(name, parseFloat(value.toFixed(2)));
        }} className="pl-7 bg-white border-slate-200" placeholder={placeholder} />
      </div>
    </div>
  );
}

export function WarrantyFields({ form }: { form: WatchEditForm }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Warranty Coverage</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Store Warranty Term</Label>
          <Select value={form.watch("storeWarrantyMonths") == null ? "not-recorded" : String(form.watch("storeWarrantyMonths"))}
            onValueChange={value => form.setValue("storeWarrantyMonths", value === "not-recorded" ? null : Number(value) as WatchEditFormValues["storeWarrantyMonths"], { shouldDirty: true })}>
            <SelectTrigger className="bg-white border-slate-200"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              <SelectItem value="not-recorded">Not recorded</SelectItem>
              <SelectItem value="0">No warranty</SelectItem>
              <SelectItem value="6">6 months</SelectItem>
              <SelectItem value="12">1 year</SelectItem>
              <SelectItem value="24">2 years</SelectItem>
              <SelectItem value="36">3 years</SelectItem>
              <SelectItem value="60">5 years</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">For sold watches, the term starts on the recorded delivery date.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-manufacturer-purchase-date">Manufacturer Purchase Date</Label>
          <Input id="edit-manufacturer-purchase-date" type="date" {...form.register("manufacturerPurchaseDate")} className="bg-white border-slate-200" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-manufacturer-warranty-expires">Manufacturer Warranty Ends</Label>
          <Input id="edit-manufacturer-warranty-expires" type="date" {...form.register("manufacturerWarrantyExpires")} className="bg-white border-slate-200" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Checkbox id="edit-manufacturer-card" checked={form.watch("manufacturerWarrantyCardPresent")} onCheckedChange={checked => form.setValue("manufacturerWarrantyCardPresent", !!checked, { shouldDirty: true })} />
          <Label htmlFor="edit-manufacturer-card" className="cursor-pointer">Manufacturer warranty card is present</Label>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="edit-manufacturer-warranty-details">Warranty card / coverage details</Label>
          <Textarea id="edit-manufacturer-warranty-details" {...form.register("manufacturerWarrantyDetails")} maxLength={2000} className="min-h-20 bg-white border-slate-200" placeholder="Optional warranty-card or coverage notes" />
        </div>
      </div>
    </section>
  );
}

export function ServiceMaintenanceFields({
  form,
  showServiceDetails,
  setShowServiceDetails,
  serviceStartDatePopover,
  serviceCompletedDatePopover,
}: {
  form: WatchEditForm;
  showServiceDetails: boolean;
  setShowServiceDetails: (show: boolean) => void;
  serviceStartDatePopover: DatePopoverProps;
  serviceCompletedDatePopover: DatePopoverProps;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Service &amp; Maintenance</h3>
        <div className="flex items-center space-x-2">
          <Label htmlFor="edit-showService" className="text-sm font-medium text-slate-500">Show Service Fields</Label>
          <Switch id="edit-showService" checked={showServiceDetails} onCheckedChange={setShowServiceDetails} />
        </div>
      </div>
      {showServiceDetails && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service Start Date</Label>
              <Popover open={serviceStartDatePopover.open} onOpenChange={serviceStartDatePopover.onOpenChange}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !form.watch("serviceStartDate") && "text-muted-foreground")} data-testid="button-service-start-date">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("serviceStartDate") ? format(new Date(form.watch("serviceStartDate")!), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                  <Calendar mode="single" selected={form.watch("serviceStartDate") ? new Date(form.watch("serviceStartDate")!) : undefined} onSelect={date => {
                    form.setValue("serviceStartDate", date ? date.toISOString() : null);
                    if (date) form.setValue("status", "servicing");
                    serviceStartDatePopover.onOpenChange(false);
                  }} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Date Service Completed</Label>
              <Popover open={serviceCompletedDatePopover.open} onOpenChange={serviceCompletedDatePopover.onOpenChange}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !form.watch("dateReturnedFromService") && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("dateReturnedFromService") ? format(new Date(form.watch("dateReturnedFromService")!), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                  <Calendar mode="single" selected={form.watch("dateReturnedFromService") ? new Date(form.watch("dateReturnedFromService")!) : undefined} onSelect={date => {
                    form.setValue("dateReturnedFromService", date ? date.toISOString() : null);
                    serviceCompletedDatePopover.onOpenChange(false);
                  }} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <MoneyField form={form} name="serviceFee" label="Service Fee" placeholder="0,00" />
            <MoneyField form={form} name="polishFee" label="Polish Fee" placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label>Service Notes</Label>
            <Textarea {...form.register("serviceNotes")} className="bg-white border-slate-200 min-h-[80px]" placeholder="Notes about service work performed..." />
          </div>
        </div>
      )}
    </section>
  );
}

export function ShippingFields({
  form,
  showShippingDetails,
  setShowShippingDetails,
}: {
  form: WatchEditForm;
  showShippingDetails: boolean;
  setShowShippingDetails: (show: boolean) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Shipping &amp; Tracking</h3>
        <div className="flex items-center space-x-2">
          <Label htmlFor="edit-showShipping" className="text-sm font-medium text-slate-500">Show Shipping Fields</Label>
          <Switch id="edit-showShipping" checked={showShippingDetails} onCheckedChange={setShowShippingDetails} />
        </div>
      </div>
      {showShippingDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <Label>Shipping Partner</Label>
            <Select value={form.watch("shippingPartner") || ""} onValueChange={value => form.setValue("shippingPartner", value)}>
              <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select Partner" /></SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="UPS">UPS</SelectItem>
                <SelectItem value="FedEx">FedEx</SelectItem>
                <SelectItem value="DHL">DHL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tracking Number</Label>
            <Input {...form.register("trackingNumber")} className="bg-white border-slate-200" placeholder="Enter tracking number" />
          </div>
          <div className="md:col-span-2 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <Controller control={form.control} name="chrono24CertificationSent" render={({ field }) => (
              <Checkbox
                id="edit-chrono24-certification-sent"
                checked={field.value}
                onCheckedChange={checked => field.onChange(checked === true)}
                className="mt-0.5"
              />
            )} />
            <div className="space-y-1">
              <Label htmlFor="edit-chrono24-certification-sent" className="cursor-pointer">Sent for Chrono24 Certification</Label>
              <p className="text-xs text-slate-500">The sent date is recorded automatically when checked. Older checked watches without a date remain undated.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function WatchNotesFields({ form }: { form: WatchEditForm }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Notes</h3>
      <Textarea {...form.register("notes")} className="bg-white border-slate-200 min-h-[100px]" placeholder="Add any additional notes about the watch, movement condition, etc." />
    </section>
  );
}
