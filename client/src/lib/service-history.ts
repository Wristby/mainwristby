import type { InventoryItem } from "@shared/schema";
import { format, parseISO } from "date-fns";

export type ServiceVisitFormValue = {
  startDate: string;
  completedDate: string;
  cost: number;
  notes: string;
};

function dateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return format(typeof value === "string" ? parseISO(value) : value, "yyyy-MM-dd");
}

export function serviceHistoryToFormValues(item: InventoryItem): ServiceVisitFormValue[] {
  const history = item.serviceHistory ?? [];
  if (history.length > 0) {
    return history.map(visit => ({
      startDate: dateInputValue(visit.startDate),
      completedDate: dateInputValue(visit.completedDate),
      cost: visit.costCents / 100,
      notes: visit.notes,
    }));
  }

  const legacyVisitExists = item.serviceStartDate || item.dateSentToService
    || item.dateReturnedFromService || item.serviceFee || item.serviceNotes;
  if (!legacyVisitExists) return [];

  return [{
    startDate: dateInputValue(item.serviceStartDate ?? item.dateSentToService),
    completedDate: dateInputValue(item.dateReturnedFromService),
    cost: (item.serviceFee ?? 0) / 100,
    notes: item.serviceNotes ?? "",
  }];
}

