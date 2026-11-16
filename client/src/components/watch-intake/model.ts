import { z } from "zod";
import { buildSaleBuyerInput, type SaleBuyerDraft } from "@shared/sale-buyer";
import { WATCH_DETAIL_CONDITIONS } from "@/lib/watch-condition";
import {
  buildCommonWatchApiFields,
  commonWatchFormDefaults,
  commonWatchFormSchema,
  validateManufacturerWarrantyDates,
  WATCH_FORM_EURO_FIELDS,
} from "@/lib/watch-form-contract";

export const watchIntakeConditions = WATCH_DETAIL_CONDITIONS;

export const watchIntakeSchema = commonWatchFormSchema.extend({
  purchasedFrom: z.string().min(1, "Purchase channel is required"),
  paidWith: z.string().min(1, "Paid with is required"),
  dateShipped: z.string().optional().nullable(),
}).superRefine((data, context) => {
  validateManufacturerWarrantyDates(data, context);
  if (data.purchasedFrom === "Dealer" && !data.clientId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["clientId"], message: "Select a dealer seller" });
  }
});

export type WatchIntakeValues = z.infer<typeof watchIntakeSchema>;
export type WatchIntakeInput = z.input<typeof watchIntakeSchema>;
export const watchIntakeDefaults: WatchIntakeValues = {
  ...commonWatchFormDefaults,
  purchasedFrom: "",
  paidWith: "",
  status: "incoming",
  storeWarrantyMonths: 12,
  dateShipped: "",
};
export const watchIntakeFieldTab: Record<keyof WatchIntakeValues, number> = {
  brand: 0, model: 0, referenceNumber: 0, serialNumber: 0, internalSerial: 0, year: 0, linkCount: 0, condition: 0,
  box: 0, papers: 0, gdriveLink: 0, purchasedFrom: 1, paidWith: 1, clientId: 1, purchasePrice: 1,
  importFee: 1, watchRegister: 1, purchaseDate: 1, serviceFee: 2, polishFee: 2, dateSentToService: 2,
  dateReturnedFromService: 2, serviceNotes: 2, status: 3, dateReceived: 3, dateListed: 3, dateSold: 3,
  soldTo: 3, salePrice: 3, soldPlatform: 3, platformFees: 3, shippingFee: 3, insuranceFee: 3, storeWarrantyMonths: 3,
  manufacturerPurchaseDate: 1, manufacturerWarrantyExpires: 1, manufacturerWarrantyCardPresent: 1, manufacturerWarrantyDetails: 1,
  shippingPartner: 3, trackingNumber: 3, dateShipped: 3, targetSellPrice: 3, notes: 3,
};
export const watchIntakeMoneyFields = WATCH_FORM_EURO_FIELDS;

/** Converts euro form values to API cents while preserving the existing date/status rules. */
export function buildWatchIntakePayload(data: WatchIntakeValues, buyer?: SaleBuyerDraft) {
  return {
    ...data,
    ...buildCommonWatchApiFields(data),
    ...(buyer ? { saleBuyer: buildSaleBuyerInput(buyer) } : {}),
    dateShipped: data.dateShipped || null,
  };
}
