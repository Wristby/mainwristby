import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { WatchIntakeValues } from "./model";

export function Field({ name, label, type = "text", required = false, placeholder, options, step }: {
  name: keyof WatchIntakeValues; label: string; type?: string; required?: boolean;
  placeholder?: string; options?: string[]; step?: string;
}) {
  const form = useFormContext<WatchIntakeValues>();
  const error = form.formState.errors[name]?.message as string | undefined;
  const id = `intake-${name}`;
  const attributes = { id, "aria-invalid": !!error, "aria-required": required, "aria-describedby": error ? `${id}-error` : undefined };
  return <div className="space-y-1.5">
    <Label htmlFor={id}>{label}{required && <span className="text-rose-700"> *</span>}</Label>
    {options ? <select {...attributes} {...form.register(name)} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 sm:text-sm">
      <option value="">Choose…</option>{options.map(option => <option key={option} value={option}>{option === "in_stock" ? "Listed" : option.charAt(0).toUpperCase() + option.slice(1)}</option>)}
    </select> : <Input {...attributes} type={type} step={step} inputMode={type === "number" ? "decimal" : undefined} placeholder={placeholder} {...form.register(name)} className="border-slate-300 bg-white text-base sm:text-sm" />}
    {error && <p id={`${id}-error`} role="alert" className="text-xs text-rose-700">{error}</p>}
  </div>;
}

export const DateField = ({ name, label }: { name: keyof WatchIntakeValues; label: string }) =>
  <Field name={name} label={label} type="date" />;
export const Money = ({ name, label }: { name: keyof WatchIntakeValues; label: string }) =>
  <Field name={name} label={label} type="number" step="0.01" required={name === "purchasePrice"} />;

export function CheckRow({ name, label }: { name: "box" | "papers" | "watchRegister"; label: string }) {
  const form = useFormContext<WatchIntakeValues>();
  return <label className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm">
    <Checkbox aria-label={label} checked={!!form.watch(name)} onCheckedChange={checked => form.setValue(name, !!checked, { shouldDirty: true })} />
    {label}
  </label>;
}

export const Card = ({ title, children }: { title: string; children: ReactNode }) =>
  <section className="rounded-xl border border-slate-200 bg-[#fbfcfa] p-4 sm:p-5">
    <h3 className="mb-4 text-xs font-semibold uppercase tracking-[.13em] text-slate-500">{title}</h3>
    {children}
  </section>;
