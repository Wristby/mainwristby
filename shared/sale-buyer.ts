import { z } from "zod";

export const saleBuyerSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("existing"), clientId: z.number().int().positive() }),
  z.object({
    mode: z.literal("new"),
    name: z.string().trim().min(1, "Buyer name is required to add a Client.").max(200),
    email: z.string().trim().max(320).refine(value => !value || z.string().email().safeParse(value).success, "Enter a valid buyer email.").optional(),
    phone: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
  }),
  z.object({ mode: z.literal("none") }),
]);

export type SaleBuyerInput = z.infer<typeof saleBuyerSchema>;
export type SaleBuyerDraft = {
  mode: "new" | "existing";
  clientId: number | null;
  name: string;
  email: string;
  phone: string;
  country: string;
};

export function emptySaleBuyer(): SaleBuyerDraft {
  return { mode: "new", clientId: null, name: "", email: "", phone: "", country: "" };
}

export function buildSaleBuyerInput(draft: SaleBuyerDraft): SaleBuyerInput {
  if (draft.mode === "existing") {
    if (!draft.clientId) throw new Error("Choose an existing client before saving.");
    return saleBuyerSchema.parse({ mode: "existing", clientId: draft.clientId });
  }
  if (![draft.name, draft.email, draft.phone, draft.country].some(value => value.trim())) {
    return { mode: "none" };
  }
  return saleBuyerSchema.parse({ ...draft, name: draft.name.trim(), email: draft.email.trim() });
}

export const normalizeBuyerEmail = (value?: string | null) => (value || "").trim().toLowerCase();
export const normalizeBuyerPhone = (value?: string | null) => (value || "").replace(/\D/g, "");

type BuyerContact = { name: string; email?: string | null; phone?: string | null; country?: string | null };

export function matchingBuyerContact(client: BuyerContact, buyer: BuyerContact) {
  const email = normalizeBuyerEmail(buyer.email);
  const phone = normalizeBuyerPhone(buyer.phone);
  return Boolean((email && normalizeBuyerEmail(client.email) === email)
    || (phone && normalizeBuyerPhone(client.phone) === phone));
}

export function sameBuyerContact(client: BuyerContact, buyer: BuyerContact) {
  return client.name.trim().toLowerCase() === buyer.name.trim().toLowerCase()
    && normalizeBuyerEmail(client.email) === normalizeBuyerEmail(buyer.email)
    && normalizeBuyerPhone(client.phone) === normalizeBuyerPhone(buyer.phone)
    && (client.country || "").trim().toLowerCase() === (buyer.country || "").trim().toLowerCase();
}

export function searchBuyerClients<T extends BuyerContact>(clients: T[], query: string): T[] {
  const term = query.trim().toLowerCase();
  const digits = normalizeBuyerPhone(query);
  return clients.filter(client => !term || client.name.toLowerCase().includes(term)
    || normalizeBuyerEmail(client.email).includes(term)
    || Boolean(digits && normalizeBuyerPhone(client.phone).includes(digits)));
}
