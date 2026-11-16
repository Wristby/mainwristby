import type { PersonalCollectionWatch } from "@shared/schema";

export type PersonalInsuranceReportSource = Pick<
  PersonalCollectionWatch,
  | "id"
  | "manufacturer"
  | "model"
  | "referenceNumber"
  | "serialNumber"
  | "condition"
  | "conditionGrade"
  | "dateBought"
  | "purchasePrice"
  | "estimatedValue"
  | "warrantyCardDate"
  | "warrantyExpiration"
>;

export type PersonalInsuranceReportRow = {
  id: number;
  identity: string;
  referenceNumber: string;
  serialNumber: string;
  condition: string;
  acquisitionDate: string;
  purchaseAmount: string;
  estimatedValue: string;
  warrantyCardDate: string;
  warrantyExpiration: string;
};

const notRecorded = "Not recorded";
const money = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const date = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function reportDate(value: string | null): string {
  if (!value) return notRecorded;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? notRecorded : date.format(parsed);
}

function reportMoney(value: number | null): string {
  return value == null ? notRecorded : money.format(value / 100);
}

export function buildPersonalInsuranceReportRows(
  watches: readonly PersonalInsuranceReportSource[],
): PersonalInsuranceReportRow[] {
  return watches.map((watch) => ({
    id: watch.id,
    identity: [watch.manufacturer, watch.model].filter(Boolean).join(" ") || notRecorded,
    referenceNumber: watch.referenceNumber || notRecorded,
    serialNumber: watch.serialNumber || notRecorded,
    condition: watch.condition
      ? watch.conditionGrade && watch.conditionGrade !== "Not graded"
        ? `${watch.condition} · ${watch.conditionGrade}`
        : watch.condition
      : notRecorded,
    acquisitionDate: reportDate(watch.dateBought),
    purchaseAmount: reportMoney(watch.purchasePrice),
    estimatedValue: reportMoney(watch.estimatedValue),
    warrantyCardDate: reportDate(watch.warrantyCardDate),
    warrantyExpiration: reportDate(watch.warrantyExpiration),
  }));
}
