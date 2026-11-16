export const TRIAL_DURATION_DAYS = 7;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

export type WorkspacePlan = "trial" | "pro" | "legacy" | "expired";

export interface PlanAccessInput {
  accountRole?: string | null;
  subscriptionStatus?: string | null;
  emailVerifiedAt?: Date | string | null;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function resolvePlanAccess(input: PlanAccessInput, now = new Date()) {
  const verifiedAt = toDate(input.emailVerifiedAt);
  const trialEndsAt = input.subscriptionStatus === "trial" && verifiedAt
    ? new Date(verifiedAt.getTime() + TRIAL_DURATION_MS)
    : null;
  const isOwner = input.accountRole === "owner";
  const hasPaidSubscription = ["active", "trialing"].includes(input.subscriptionStatus ?? "");
  const trialActive = input.subscriptionStatus === "trial" &&
    Boolean(trialEndsAt && trialEndsAt.getTime() > now.getTime());
  const isLegacyAccess = input.subscriptionStatus === "free";
  const isTrialExpired = input.subscriptionStatus === "trial" &&
    (!trialEndsAt || trialEndsAt.getTime() <= now.getTime());
  const isPro = isOwner || hasPaidSubscription || trialActive;
  const canAccessWorkspace = isPro || isLegacyAccess;
  const plan: WorkspacePlan = isOwner || hasPaidSubscription
    ? "pro"
    : trialActive
      ? "trial"
      : isLegacyAccess
        ? "legacy"
        : "expired";
  const trialDaysRemaining = trialActive && trialEndsAt
    ? Math.max(1, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
    : 0;

  return {
    plan,
    isOwner,
    isPro,
    hasPaidSubscription,
    canAccessWorkspace,
    aiEnabled: isPro,
    isTrialActive: trialActive,
    isTrialExpired,
    trialStartedAt: input.subscriptionStatus === "trial" ? verifiedAt : null,
    trialEndsAt,
    trialDaysRemaining,
    limits: isLegacyAccess && !isOwner ? { activeWatches: 10, clients: 25 } : null,
  };
}
