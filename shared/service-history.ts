import { z } from "zod";

export const serviceVisitSchema = z.object({
  startDate: z.string().nullable(),
  completedDate: z.string().nullable(),
  costCents: z.number().int().nonnegative(),
  notes: z.string(),
});

export type ServiceVisit = z.infer<typeof serviceVisitSchema>;
