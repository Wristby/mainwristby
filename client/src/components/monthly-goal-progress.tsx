import * as ProgressPrimitive from "@radix-ui/react-progress";

/** Dashboard-only fill: keep the full gradient visible even at low progress. */
export function MonthlyGoalProgress({ value }: { value: number }) {
  const fill = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return <ProgressPrimitive.Root
    value={fill}
    aria-label="Monthly goal progress"
    className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100"
  >
    <ProgressPrimitive.Indicator
      className="h-full rounded-full transition-[width] motion-reduce:transition-none"
      style={{ width: `${fill}%`, backgroundImage: "linear-gradient(to right, #6ee7b7, #059669)" }}
    />
  </ProgressPrimitive.Root>;
}
