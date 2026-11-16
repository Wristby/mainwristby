import { AsyncLocalStorage } from "node:async_hooks";

const ownerContext = new AsyncLocalStorage<string>();

export function runWithOwner<T>(ownerId: string, callback: () => T): T {
  if (!ownerId) throw new Error("A workspace owner is required.");
  return ownerContext.run(ownerId, callback);
}

export function requireOwnerId(): string {
  const ownerId = ownerContext.getStore();
  if (!ownerId) {
    throw new Error("Workspace data access requires an authenticated owner context.");
  }
  return ownerId;
}
