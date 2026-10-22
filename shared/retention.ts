import { z } from "zod";

export const retentionKey = "client_retention_schedule";
export const categories = ["optional_profile", "financial", "warranty"] as const;
export const triggers = {
  optional_profile: "last_activity",
  financial: "financial_year_end",
  warranty: "delivery",
} as const;

export const ruleSchema = z.object({
  purpose: z.string().trim().min(1).max(1000),
  trigger: z.enum(["last_activity", "financial_year_end", "delivery"]),
  days: z.number().int().min(0).max(36500),
}).strict();

export const scheduleInputSchema = z.object({
  rules: z.object({
    optional_profile: ruleSchema,
    financial: ruleSchema,
    warranty: ruleSchema,
  }).strict(),
  backup: z.object({
    expiryDays: z.number().int().min(1).max(3650),
    procedure: z.string().trim().min(20).max(4000),
    verified: z.boolean(),
  }).strict(),
  ownerApproval: z.string().trim().min(1).max(500),
  adviserApproval: z.string().trim().min(1).max(500),
  confirmApproval: z.boolean(),
}).strict().superRefine((value, ctx) => {
  for (const category of categories) {
    if (value.rules[category].trigger !== triggers[category]) {
      ctx.addIssue({ code: "custom", path: ["rules", category, "trigger"], message: `Use ${triggers[category]} for ${category}.` });
    }
  }
  if (value.confirmApproval && !value.backup.verified) {
    ctx.addIssue({ code: "custom", path: ["backup", "verified"], message: "Verify backup expiry and restoration controls before approving." });
  }
});

export type RetentionScheduleInput = z.infer<typeof scheduleInputSchema>;
export type RetentionSchedule = RetentionScheduleInput & {
  revision: string;
  approvedAt: string | null;
  automaticDeletionEnabled: false;
};

export const profileFields = ["name", "email", "phone", "socialHandle", "website", "country", "notes", "isVip"] as const;

export type RetentionPreview = {
  clientId: number;
  eligible: boolean;
  blockers: string[];
  clear: readonly string[];
  retain: string[];
  holds: { id: number; scope: string; recordId: number; reason: string }[];
  categories: { category: string; trigger: string; eligibleAfter: string | null; action: string }[];
  linkedWatchIds: number[];
  expenseCount: number;
  fingerprint: string;
};

export function expiry(trigger: Date | string | null | undefined, days: number, yearEnd = false): string | null {
  if (!trigger) return null;
  const start = new Date(trigger);
  if (!Number.isFinite(start.getTime())) return null;
  if (yearEnd) {
    start.setUTCFullYear(start.getUTCFullYear() + 1, 0, 1);
    start.setUTCHours(0, 0, 0, 0);
  }
  start.setUTCDate(start.getUTCDate() + days);
  return start.toISOString();
}
