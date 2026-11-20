import { z } from "zod";
import { storeWarrantyMonthsSchema } from "@shared/warranty";
import { WATCH_DETAIL_CONDITIONS, serializeWatchCondition } from "./watch-condition";
import { serviceVisitSchema } from "@shared/service-history";

const optionalString = z.string().optional().nullable();
const optionalInteger = z.preprocess(
  value => value === "" || value === null ? null : value,
  z.coerce.number().int().nullable().optional(),
);
const optionalClientId = z.preprocess(
  value => value === "" || value == null ? null : value,
  z.coerce.number().nullable().optional(),
);
const warrantyMonthsInput = z.preprocess(
  value => value === "" || value == null ? null : Number(value),
  storeWarrantyMonthsSchema,
);

export const WATCH_FORM_STATUSES = ["in_stock", "sold", "incoming", "servicing", "received"] as const;

/** Field rules shared by intake and Watch Details editing. */
export const commonWatchFormSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  serialNumber: optionalString,
  internalSerial: optionalString,
  year: optionalInteger,
  linkCount: optionalInteger,
  condition: z.enum(WATCH_DETAIL_CONDITIONS),
  box: z.boolean().default(false),
  papers: z.boolean().default(false),
  gdriveLink: optionalString,

  purchasedFrom: optionalString,
  paidWith: optionalString,
  clientId: optionalClientId,
  purchasePrice: z.coerce.number().min(1, "COGS is required"),
  importFee: z.coerce.number().optional().default(0),
  watchRegister: z.boolean().default(false),
  purchaseDate: optionalString,

  status: z.enum(WATCH_FORM_STATUSES),
  dateReceived: optionalString,
  dateListed: optionalString,
  salePrice: z.coerce.number().optional().default(0),
  platformFees: z.coerce.number().optional().default(0),
  soldPlatform: optionalString,
  shippingFee: z.coerce.number().optional().default(0),
  insuranceFee: z.coerce.number().optional().default(0),
  soldTo: optionalString,
  dateSold: optionalString,

  dateSentToService: optionalString,
  dateReturnedFromService: optionalString,
  serviceFee: z.coerce.number().optional().default(0),
  polishFee: z.coerce.number().optional().default(0),
  serviceNotes: optionalString,

  shippingPartner: optionalString,
  trackingNumber: optionalString,
  storeWarrantyMonths: warrantyMonthsInput,
  manufacturerPurchaseDate: optionalString,
  manufacturerWarrantyExpires: optionalString,
  manufacturerWarrantyCardPresent: z.boolean().default(false),
  manufacturerWarrantyDetails: z.string().max(2000).optional().nullable(),
  targetSellPrice: z.coerce.number().optional().default(0),
  notes: optionalString,
});

export type CommonWatchFormValues = z.infer<typeof commonWatchFormSchema>;

export const commonWatchFormDefaults: CommonWatchFormValues = {
  brand: "",
  model: "",
  referenceNumber: "",
  serialNumber: "",
  internalSerial: "",
  year: null,
  linkCount: null,
  condition: "Good",
  box: false,
  papers: false,
  gdriveLink: "",
  purchasedFrom: "",
  paidWith: "",
  clientId: null,
  purchasePrice: 0,
  importFee: 0,
  watchRegister: false,
  purchaseDate: "",
  status: "in_stock",
  dateReceived: "",
  dateListed: "",
  salePrice: 0,
  platformFees: 0,
  soldPlatform: "",
  shippingFee: 0,
  insuranceFee: 0,
  soldTo: "",
  dateSold: "",
  dateSentToService: "",
  dateReturnedFromService: "",
  serviceFee: 0,
  polishFee: 0,
  serviceNotes: "",
  shippingPartner: "",
  trackingNumber: "",
  storeWarrantyMonths: null,
  manufacturerPurchaseDate: "",
  manufacturerWarrantyExpires: "",
  manufacturerWarrantyCardPresent: false,
  manufacturerWarrantyDetails: "",
  targetSellPrice: 0,
  notes: "",
};

export const watchEditFormSchema = commonWatchFormSchema.extend({
  chrono24FeeRate: z.coerce.number()
    .min(0, "Chrono24 fee rate cannot be negative")
    .max(100, "Chrono24 fee rate cannot exceed 100%")
    .optional()
    .nullable(),
  serviceStartDate: optionalString,
  serviceVisits: z.array(z.object({
    startDate: z.string(),
    completedDate: z.string(),
    cost: z.coerce.number().min(0),
    notes: z.string(),
  })).default([]),
  chrono24CertificationSent: z.boolean().default(false),
  listPrice: z.coerce.number().optional().nullable(),
}).superRefine(validateManufacturerWarrantyDates);

export type WatchEditFormValues = z.infer<typeof watchEditFormSchema>;

export const watchEditFormDefaults: WatchEditFormValues = {
  ...commonWatchFormDefaults,
  chrono24FeeRate: undefined,
  serviceStartDate: "",
  serviceVisits: [],
  chrono24CertificationSent: false,
  listPrice: null,
};

export const WATCH_FORM_EURO_FIELDS = [
  "purchasePrice",
  "importFee",
  "serviceFee",
  "polishFee",
  "salePrice",
  "platformFees",
  "shippingFee",
  "insuranceFee",
  "targetSellPrice",
] as const;

export type WatchFormEuroField = typeof WATCH_FORM_EURO_FIELDS[number];

function toCents(value: unknown): number {
  return Math.round((Number(value) || 0) * 100);
}

function nullable(value: string | null | undefined): string | null {
  return value || null;
}

export function toWatchApiMoneyFields(values: Partial<Record<WatchFormEuroField, unknown>>) {
  return Object.fromEntries(
    WATCH_FORM_EURO_FIELDS.map(field => [field, toCents(values[field])]),
  ) as Record<WatchFormEuroField, number>;
}

export function validateManufacturerWarrantyDates(
  data: Pick<CommonWatchFormValues, "manufacturerPurchaseDate" | "manufacturerWarrantyExpires">,
  context: z.RefinementCtx,
) {
  if (data.manufacturerPurchaseDate && data.manufacturerWarrantyExpires
    && data.manufacturerPurchaseDate > data.manufacturerWarrantyExpires) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["manufacturerWarrantyExpires"],
      message: "The manufacturer warranty end date must be on or after the original purchase date.",
    });
  }
}

export function resolveWatchFormStatus(
  values: Pick<CommonWatchFormValues, "status" | "dateSold" | "dateReturnedFromService" | "dateListed" | "dateReceived">,
  originalStatus?: CommonWatchFormValues["status"],
): CommonWatchFormValues["status"] {
  if (originalStatus !== undefined && values.status !== originalStatus) return values.status;
  if (values.dateSold) return "sold";
  if (values.dateReturnedFromService && values.status === "servicing") return "received";
  if (values.dateListed && values.status !== "sold" && values.status !== "servicing") return "in_stock";
  if (values.dateReceived && values.status === "incoming") return "received";
  return values.status;
}

export interface CommonWatchApiOptions {
  originalStatus?: CommonWatchFormValues["status"];
  soldDateFallback?: string | null;
}

/** Shared normalization for the overlapping create/edit watch payload fields. */
export function buildCommonWatchApiFields(
  values: CommonWatchFormValues,
  options: CommonWatchApiOptions = {},
) {
  const status = resolveWatchFormStatus(values, options.originalStatus);
  const saleDate = nullable(values.dateSold) ?? nullable(options.soldDateFallback);
  return {
    ...toWatchApiMoneyFields(values),
    condition: serializeWatchCondition(values.condition),
    status,
    dateReceived: nullable(values.dateReceived),
    purchaseDate: nullable(values.purchaseDate),
    dateListed: nullable(values.dateListed),
    dateSold: saleDate,
    soldDate: saleDate,
    dateSentToService: nullable(values.dateSentToService),
    dateReturnedFromService: nullable(values.dateReturnedFromService),
    serviceNotes: values.serviceNotes?.trim() || null,
    manufacturerPurchaseDate: nullable(values.manufacturerPurchaseDate),
    manufacturerWarrantyExpires: nullable(values.manufacturerWarrantyExpires),
    manufacturerWarrantyDetails: values.manufacturerWarrantyDetails?.trim() || null,
  };
}

/** Adds edit-only fields while using the same status, currency, and date rules as intake. */
export function buildWatchEditPayload(
  values: WatchEditFormValues,
  originalStatus: CommonWatchFormValues["status"],
  now = new Date(),
  dateSoldWasEdited = false,
) {
  const status = resolveWatchFormStatus(values, originalStatus);
  return {
    ...values,
    ...buildCommonWatchApiFields(values, {
      originalStatus,
      soldDateFallback: status === "sold" && originalStatus !== "sold" && !values.dateSold && !dateSoldWasEdited
        ? now.toISOString()
        : null,
    }),
    chrono24FeeRate: values.chrono24FeeRate != null ? Math.round(values.chrono24FeeRate * 100) : null,
    serviceStartDate: nullable(values.serviceStartDate),
    serviceHistory: values.serviceVisits
      .filter(visit => visit.startDate || visit.completedDate || visit.cost > 0 || visit.notes.trim())
      .map(visit => serviceVisitSchema.parse({
        startDate: visit.startDate || null,
        completedDate: visit.completedDate || null,
        costCents: Math.round(visit.cost * 100),
        notes: visit.notes.trim(),
      })),
    chrono24CertificationSent: values.chrono24CertificationSent ?? false,
    listPrice: values.listPrice != null && Number.isFinite(values.listPrice) && values.listPrice > 0
      ? Math.round(values.listPrice * 100)
      : null,
    linkCount: values.linkCount != null && Number.isFinite(values.linkCount) && values.linkCount > 0
      ? Math.round(values.linkCount)
      : null,
  };
}
