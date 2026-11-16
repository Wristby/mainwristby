import { describe, expect, it } from "vitest";
import { requireOwnerId, runWithOwner } from "../../../server/tenant";

describe("workspace request context", () => {
  it("fails closed when no authenticated owner is present", () => {
    expect(() => requireOwnerId()).toThrow("authenticated owner context");
  });

  it("keeps concurrent workspace requests isolated across async work", async () => {
    const [first, second] = await Promise.all([
      runWithOwner("account-a", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return requireOwnerId();
      }),
      runWithOwner("account-b", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return requireOwnerId();
      }),
    ]);

    expect(first).toBe("account-a");
    expect(second).toBe("account-b");
    expect(() => requireOwnerId()).toThrow("authenticated owner context");
  });
});
