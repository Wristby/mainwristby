import { z } from "zod";
import type { Client, InventoryItem } from "./schema";

export const buyerSyncPath = "/api/clients/watch-buyers/sync";
export const buyerReviewPath = "/api/clients/watch-buyers/resolve";

export const buyerReviewSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("link"),
    watchId: z.number().int().positive(),
    expectedName: z.string().min(1),
    clientId: z.number().int().positive(),
  }),
  z.object({
    action: z.literal("create"),
    watchId: z.number().int().positive(),
    expectedName: z.string().min(1),
  }),
]);
export type BuyerReviewInput = z.infer<typeof buyerReviewSchema>;
export type LegacyBuyerWatch = Pick<InventoryItem, "id" | "brand" | "model" | "referenceNumber" | "soldTo" | "buyerId">;
export type BuyerCandidate = Pick<Client, "id" | "name" | "email" | "phone" | "country">;
export type BuyerReview = {
  watch: LegacyBuyerWatch;
  name: string;
  matches: BuyerCandidate[];
  repeatedName: boolean;
};
export type BuyerSyncReport = { created: number; pending: BuyerReview[] };

const combiningMarks = new RegExp("\\p{M}", "gu");
const nonNameCharacters = new RegExp("[^\\p{L}\\p{N}]+", "gu");
const nameWords = (name: string) => name.normalize("NFKD").replace(combiningMarks, "")
  .toLowerCase().replace(nonNameCharacters, " ").trim().split(/\s+/).filter(Boolean);

/** Names are only review hints, never proof that two records identify one person. */
export function possibleBuyerNameMatch(a: string, b: string): boolean {
  const left = nameWords(a), right = nameWords(b);
  return left.length > 0 && right.length > 0
    && (left.every(word => right.includes(word)) || right.every(word => left.includes(word)));
}

export function planLegacyBuyers(watches: readonly LegacyBuyerWatch[], contacts: readonly BuyerCandidate[]) {
  const candidates = watches.filter(watch => watch.buyerId == null && watch.soldTo?.trim()
    && !["n/a", "na", "-", "unknown", "not specified"].includes(watch.soldTo.trim().toLowerCase()));
  const ready: BuyerReview[] = [], pending: BuyerReview[] = [];
  for (const watch of candidates) {
    const name = watch.soldTo!.trim();
    const matches = contacts.filter(client => possibleBuyerNameMatch(client.name, name))
      .map(({ id, name, email, phone, country }) => ({ id, name, email, phone, country }));
    const repeatedName = candidates.some(other => other.id !== watch.id
      && possibleBuyerNameMatch(other.soldTo!, name));
    const review = { watch, name, matches, repeatedName };
    (matches.length || repeatedName ? pending : ready).push(review);
  }
  return { ready, pending };
}
