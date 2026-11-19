import { z } from "zod";
import { insertPersonalCollectionWatchSchema } from "./schema";

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
  }, "Enter a valid date.");

const optionalDate = calendarDate.nullable().optional();
const optionalMoney = z.number().int().min(0).max(2_000_000_000).nullable().optional();
const nullableText = (maxLength = 1000) => z.string().trim().max(maxLength).nullable().optional();
const googleDriveLink = z.string().trim().max(2048).nullable().optional().refine((value) => {
  if (value == null || value === "") return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["drive.google.com", "docs.google.com"].includes(url.hostname);
  } catch {
    return false;
  }
}, "Enter a valid Google Drive link.");

export const personalCollectionFeeSchema = z.object({
  label: z.string().trim().min(1).max(100),
  amount: z.number().int().min(0).max(2_000_000_000),
});

export const personalCollectionValuationInputSchema = z.object({
  valuationDate: calendarDate,
  estimatedValue: z.number().int().min(0).max(2_000_000_000),
});

export const personalCollectionInputSchema = insertPersonalCollectionWatchSchema.extend({
  dateBought: optionalDate,
  referenceNumber: z.string().trim().min(1, "Reference number is required.").max(100),
  manufacturer: z.string().trim().min(1, "Manufacturer is required.").max(100),
  model: nullableText(150),
  subModel: nullableText(150),
  condition: z.enum(["New", "Pre-owned", "Vintage"]).default("Pre-owned"),
  conditionGrade: z.enum(["Not graded", "Mint", "Excellent", "Very Good", "Good", "Fair", "Poor"])
    .default("Not graded"),
  year: z.number().int().min(1500).max(2200).nullable().optional(),
  serialNumber: nullableText(120),
  linkCount: nullableText(40),
  bracelet: nullableText(150),
  bezel: nullableText(150),
  dial: nullableText(150),
  warrantyCardDate: optionalDate,
  warrantyExpiration: optionalDate,
  conditionNotes: nullableText(3000),
  contentsNotes: nullableText(3000),
  acquisitionPlatform: nullableText(150),
  boughtFrom: nullableText(300),
  purchasePrice: optionalMoney,
  estimatedValue: optionalMoney,
  msrp: optionalMoney,
  intakeFees: z.array(personalCollectionFeeSchema).max(50).optional(),
  gdriveLink: googleDriveLink,
  notes: nullableText(5000),
  technicalDetails: z.record(z.string().trim().max(300)).optional(),
});

export type PersonalCollectionInput = z.input<typeof personalCollectionInputSchema>;
export type PersonalCollectionValuationInput = z.infer<typeof personalCollectionValuationInputSchema>;
