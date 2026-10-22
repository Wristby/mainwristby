import { useId, useState } from "react";
import { Check, Search } from "lucide-react";
import { Link } from "wouter";
import type { Client } from "@shared/schema";
import { emptySaleBuyer, searchBuyerClients, type SaleBuyerDraft } from "@shared/sale-buyer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type Props = {
  value: SaleBuyerDraft;
  onChange: (draft: SaleBuyerDraft) => void;
  clients: Client[];
  loading?: boolean;
  unavailable?: boolean;
  dirty: boolean;
  error?: string;
};

export function SaleBuyerFields({ value, onChange, clients, loading, unavailable, dirty, error }: Props) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const selected = clients.find(client => client.id === value.clientId);
  const results = searchBuyerClients(clients, query).slice(0, 20);
  const choose = (client: Client) => {
    onChange({
      mode: "existing", clientId: client.id, name: client.name,
      email: client.email || "", phone: client.phone || "", country: client.country || "",
    });
    setQuery(""); setOpen(false); setActive(-1);
  };

  return <fieldset className="min-w-0 space-y-4 rounded-lg border border-slate-200 p-4 md:col-span-3">
    <legend className="px-1 text-sm font-semibold">Buyer details</legend>
    <label className="flex items-center gap-2 text-sm">
      <Checkbox id="sale-existing-client" checked={value.mode === "existing"} onCheckedChange={checked => {
        onChange({ ...emptySaleBuyer(), mode: checked ? "existing" : "new" });
        setQuery(""); setOpen(false);
      }}/>
      Use existing client
    </label>
    {value.mode === "existing" ? <div className="space-y-3">
      <div className="relative" onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}>
        <Label htmlFor="sale-buyer-search">Search clients by name, email, or phone</Label>
        <div className="relative mt-1">
          <Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-slate-400"/>
          <Input id="sale-buyer-search" className="pl-9" role="combobox" autoComplete="off"
            aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 && results[active] ? `${listId}-${results[active].id}` : undefined}
            value={query} onFocus={() => setOpen(true)} onChange={event => {
              setQuery(event.target.value); setActive(-1); setOpen(true);
            }} onKeyDown={event => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault(); setOpen(true);
                setActive(index => event.key === "ArrowDown" ? Math.min(index + 1, results.length - 1) : Math.max(index - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                if (open && results[active]) choose(results[active]);
              } else if (event.key === "Escape") {
                event.preventDefault(); event.stopPropagation(); setOpen(false);
              }
            }}/>
        </div>
        {open && <ul id={listId} role="listbox" aria-label="Matching clients" className="mt-1 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white p-1">
          {results.map((client, index) => <li key={client.id} role="presentation">
            <button id={`${listId}-${client.id}`} role="option" aria-selected={selected?.id === client.id}
              type="button" tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => choose(client)}
              className={`w-full rounded p-3 text-left text-sm hover:bg-emerald-50 ${index === active ? "bg-emerald-50" : ""}`}>
              <span className="flex items-center gap-2 font-medium">{client.name}{selected?.id === client.id && <Check aria-hidden="true" className="h-4 w-4"/>}</span>
              <span className="block break-words text-xs text-slate-500">{[client.email, client.phone, client.country].filter(Boolean).join(" · ")}</span>
            </button>
          </li>)}
          {!results.length && <li role="presentation" className="p-3 text-sm text-slate-500">
            {loading ? "Loading clients…" : unavailable ? "Clients could not be loaded. Please try again." : "No matching clients. Turn off Existing client to enter a new buyer."}
          </li>}
        </ul>}
      </div>
      {selected ? <div className="space-y-2 rounded-md bg-emerald-50 p-3 text-sm">
        <p className="flex items-center gap-2 font-medium text-emerald-800"><Check aria-hidden="true" className="h-4 w-4"/>Existing client: {selected.name}</p>
        <dl className="grid gap-2 break-words sm:grid-cols-3">
          <div><dt className="text-xs text-slate-500">Email</dt><dd>{selected.email || "Not provided"}</dd></div>
          <div><dt className="text-xs text-slate-500">Phone</dt><dd>{selected.phone || "Not provided"}</dd></div>
          <div><dt className="text-xs text-slate-500">Country</dt><dd>{selected.country || "Not provided"}</dd></div>
        </dl>
        <Link href={`/clients/${selected.id}`} className="inline-block text-xs underline">View or edit client profile</Link>
        <p className="text-xs text-slate-500">Linking this client won’t change their saved contact details.</p>
      </div> : <p className="text-xs text-slate-500">{loading ? "Loading saved client…" : unavailable ? "Could not load client details." : "Choose a client from the search results."}</p>}
    </div> : <>
      <p id="sale-buyer-help" className="text-xs text-slate-500">Name is required to create a Client. Email, phone, and country are optional. New details are saved to Clients when you save the watch.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {([
          ["name", "Buyer name", "text"], ["email", "Email", "email"],
          ["phone", "Phone", "tel"], ["country", "Country", "text"],
        ] as const).map(([field, label, type]) => <div key={field} className="space-y-1">
          <Label htmlFor={`sale-buyer-${field}`}>{label}</Label>
          <Input id={`sale-buyer-${field}`} type={type} value={value[field]} autoComplete={field === "country" ? "country-name" : field === "phone" ? "tel" : field}
            aria-describedby="sale-buyer-help" aria-invalid={Boolean(error) || undefined}
            onChange={event => onChange({ ...value, [field]: event.target.value })}/>
        </div>)}
      </div>
      {!dirty && value.name.trim() && <Button type="button" variant="outline" onClick={() => onChange({ ...value })}>Create Client from this buyer when saving</Button>}
      {dirty && value.name.trim() && <p className="text-xs text-emerald-700">A new Client will be created when you save.</p>}
    </>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </fieldset>;
}
