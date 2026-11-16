import { describe, expect, it } from "vitest";
import { resolvePlanAccess, TRIAL_DURATION_DAYS, TRIAL_DURATION_MS } from "@shared/plan-access";

const verifiedAt = new Date("2026-11-16T12:00:00.000Z");

describe("seven-day trial access", () => {
  it("grants full access for seven days after email verification", () => {
    const access = resolvePlanAccess({
      accountRole: "customer",
      subscriptionStatus: "trial",
      emailVerifiedAt: verifiedAt,
    }, verifiedAt);

    expect(TRIAL_DURATION_DAYS).toBe(7);
    expect(access.plan).toBe("trial");
    expect(access.isPro).toBe(true);
    expect(access.aiEnabled).toBe(true);
    expect(access.canAccessWorkspace).toBe(true);
    expect(access.limits).toBeNull();
    expect(access.trialEndsAt?.getTime()).toBe(verifiedAt.getTime() + TRIAL_DURATION_MS);
    expect(access.trialDaysRemaining).toBe(7);
  });

  it("keeps the trial active until the exact end instant", () => {
    const access = resolvePlanAccess({
      accountRole: "customer",
      subscriptionStatus: "trial",
      emailVerifiedAt: verifiedAt,
    }, new Date(verifiedAt.getTime() + TRIAL_DURATION_MS - 1));

    expect(access.isTrialActive).toBe(true);
    expect(access.canAccessWorkspace).toBe(true);
    expect(access.trialDaysRemaining).toBe(1);
  });

  it("pauses workspace access after expiry without deleting trial data", () => {
    const access = resolvePlanAccess({
      accountRole: "customer",
      subscriptionStatus: "trial",
      emailVerifiedAt: verifiedAt,
    }, new Date(verifiedAt.getTime() + TRIAL_DURATION_MS));

    expect(access.plan).toBe("expired");
    expect(access.isTrialExpired).toBe(true);
    expect(access.canAccessWorkspace).toBe(false);
    expect(access.trialEndsAt?.getTime()).toBe(verifiedAt.getTime() + TRIAL_DURATION_MS);
  });

  it("preserves owner access and existing legacy accounts", () => {
    const owner = resolvePlanAccess({
      accountRole: "owner",
      subscriptionStatus: "trial",
      emailVerifiedAt: verifiedAt,
    }, new Date(verifiedAt.getTime() + TRIAL_DURATION_MS));
    const legacy = resolvePlanAccess({
      accountRole: "customer",
      subscriptionStatus: "free",
    });

    expect(owner.plan).toBe("pro");
    expect(owner.canAccessWorkspace).toBe(true);
    expect(legacy.plan).toBe("legacy");
    expect(legacy.canAccessWorkspace).toBe(true);
    expect(legacy.isPro).toBe(false);
    expect(legacy.limits).toEqual({ activeWatches: 10, clients: 25 });
  });

  it("treats an active or trialing subscription as Pro", () => {
    for (const subscriptionStatus of ["active", "trialing"]) {
      const access = resolvePlanAccess({ subscriptionStatus }, new Date());
      expect(access.plan).toBe("pro");
      expect(access.canAccessWorkspace).toBe(true);
      expect(access.aiEnabled).toBe(true);
    }
  });
});
