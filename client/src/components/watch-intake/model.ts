import { z } from "zod";
import { buildSaleBuyerInput, type SaleBuyerDraft } from "@shared/sale-buyer";

export const watchIntakeConditions = ["Good", "Very Good", "Excellent", "Like New"] as const;

export const watchIntakeSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  serialNumber: z.string().optional().nullable(),
  internalSerial: z.string().optional().nullable(),
  year: z.preprocess(value => value === "" ? null : value, z.coerce.number().int().optional().nullable()),
  linkCount: z.preprocess(value => value === "" ? null : value, z.coerce.number().int().optional().nullable()),
  purchasedFrom: z.string().min(1, "Purchase channel is required"),
  paidWith: z.string().min(1, "Paid with is required"),
  clientId: z.preprocess(value => value === "" || value === undefined ? null : value, z.coerce.number().optional().nullable()),
  purchasePrice: z.coerce.number().min(1, "Purchase cost is required"),
  importFee: z.coerce.number().optional().default(0),
  watchRegister: z.boolean().default(false),
  serviceFee: z.coerce.number().optional().default(0),
  polishFee: z.coerce.number().optional().default(0),
  salePrice: z.coerce.number().optional().default(0),
  soldTo: z.string().optional().nullable(),
  platformFees: z.coerce.number().optional().default(0),
  shippingFee: z.coerce.number().optional().default(0),
  insuranceFee: z.coerce.number().optional().default(0),
  dateReceived: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  dateListed: z.string().optional().nullable(),
  dateSold: z.string().optional().nullable(),
  targetSellPrice: z.coerce.number().optional().default(0),
  status: z.enum(["in_stock", "sold", "incoming", "servicing", "received"], { required_error: "Status is required" }),
  condition: z.enum(watchIntakeConditions).default("Good"),
  box: z.boolean().default(false),
  papers: z.boolean().default(false),
  gdriveLink: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  shippingPartner: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  dateShipped: z.string().optional().nullable(),
  soldPlatform: z.string().optional().nullable(),
  dateSentToService: z.string().optional().nullable(),
  dateReturnedFromService: z.string().optional().nullable(),
  serviceNotes: z.string().optional().nullable(),
}).superRefine((data, context) => {
  if (data.purchasedFrom === "Dealer" && !data.clientId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["clientId"], message: "Select a dealer seller" });
  }
});

export type WatchIntakeValues = z.infer<typeof watchIntakeSchema>;
export const watchIntakeDefaults: WatchIntakeValues = {
  brand: "", model: "", referenceNumber: "", serialNumber: "", internalSerial: "", year: null, linkCount: null,
  purchasedFrom: "", paidWith: "", clientId: undefined, purchasePrice: 0, importFee: 0, watchRegister: false,
  serviceFee: 0, polishFee: 0, salePrice: 0, soldTo: "", platformFees: 0, shippingFee: 0, insuranceFee: 0,
  dateReceived: null, purchaseDate: null, dateListed: null, dateSold: null, targetSellPrice: 0, status: "incoming",
  condition: "Good", box: false, papers: false, gdriveLink: "", notes: "", shippingPartner: "", trackingNumber: "",
  dateShipped: null, soldPlatform: "", dateSentToService: null, dateReturnedFromService: null, serviceNotes: "",
};
export const watchIntakeFieldTab: Record<keyof WatchIntakeValues, number> = {
  brand: 0, model: 0, referenceNumber: 0, serialNumber: 0, internalSerial: 0, year: 0, linkCount: 0, condition: 0,
  box: 0, papers: 0, gdriveLink: 0, purchasedFrom: 1, paidWith: 1, clientId: 1, purchasePrice: 1,
  importFee: 1, watchRegister: 1, purchaseDate: 1, serviceFee: 2, polishFee: 2, dateSentToService: 2,
  dateReturnedFromService: 2, serviceNotes: 2, status: 3, dateReceived: 3, dateListed: 3, dateSold: 3,
  soldTo: 3, salePrice: 3, soldPlatform: 3, platformFees: 3, shippingFee: 3, insuranceFee: 3,
  shippingPartner: 3, trackingNumber: 3, dateShipped: 3, targetSellPrice: 3, notes: 3,
};
export const watchIntakeMoneyFields = [
  "purchasePrice", "importFee", "serviceFee", "polishFee", "salePrice",
  "platformFees", "shippingFee", "insuranceFee", "targetSellPrice",
] as const;
const cents = (amount: unknown) => Math.round((Number(amount) || 0) * 100);

/** Converts euro form values to API cents while preserving the existing date/status rules. */
export function buildWatchIntakePayload(data: WatchIntakeValues, buyer?: SaleBuyerDraft) {
  let status = data.status;
  if (data.dateSold) status = "sold";
  else if (data.dateReturnedFromService && status === "servicing") status = "received";
  else if (data.dateListed && status !== "sold" && status !== "servicing") status = "in_stock";
  else if (data.dateReceived && status === "incoming") status = "received";
  return {
    ...data, status,
    ...(buyer ? { saleBuyer: buildSaleBuyerInput(buyer) } : {}),
    ...Object.fromEntries(watchIntakeMoneyFields.map(key => [key, cents(data[key])])),
    dateReceived: data.dateReceived || null,
    purchaseDate: data.purchaseDate || null,
    dateListed: data.dateListed || null,
    dateSold: data.dateSold || null,
    soldDate: data.dateSold || null,
    dateShipped: data.dateShipped || null,
    dateSentToService: data.dateSentToService || null,
    dateReturnedFromService: data.dateReturnedFromService || null,
    serviceNotes: data.serviceNotes || null,
  };
}
