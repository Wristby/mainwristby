import { beforeEach, describe, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({
  profile: undefined as Record<string, unknown> | undefined,
  set: vi.fn(),
}));
vi.mock("../../../server/db", () => ({
  db: {
    update: () => ({
      set: (updates: Record<string, unknown>) => {
        fixture.set(updates);
        return { where: () => ({ returning: async () => fixture.profile ? [{ ...fixture.profile, ...updates }] : [] }) };
      },
    }),
  },
}));
import { authStorage } from "../../../server/replit_integrations/auth/storage";

describe("legacy auth profile compatibility", () => {
  beforeEach(() => {
    fixture.set.mockClear();
    fixture.profile = { id: "example-id", username: "example", password: "example-hash" };
  });
  it("updates existing profile data without overwriting local login credentials", async () => {
    const updated = await authStorage.upsertUser({
      id: "example-id", email: "example@example.invalid", firstName: "Example",
    });
    expect(updated.username).toBe("example");
    expect(updated.password).toBe("example-hash");
    expect(fixture.set.mock.calls[0][0]).not.toHaveProperty("username");
    expect(fixture.set.mock.calls[0][0]).not.toHaveProperty("password");
    expect(fixture.set.mock.calls[0][0]).not.toHaveProperty("id");
  });
  it("fails explicitly rather than creating a passwordless account", async () => {
    fixture.profile = undefined;
    await expect(authStorage.upsertUser({ id: "unknown" })).rejects.toThrow("Register a username/password account");
  });
  it("does not accept extra credential fields even when called by untyped code", async () => {
    await authStorage.upsertUser({ id: "example-id", password: "unwanted", username: "unwanted" } as any);
    expect(fixture.set.mock.calls[0][0]).not.toHaveProperty("password");
    expect(fixture.set.mock.calls[0][0]).not.toHaveProperty("username");
  });
});
