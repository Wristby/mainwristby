import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";

// Exercise this component's state and event handlers without bypassing app auth.
const harness = vi.hoisted(() => ({
  states: [] as unknown[], index: 0,
  mutateAsync: vi.fn(), toast: vi.fn(), isPending: false,
}));
vi.mock("react", async importOriginal => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const index = harness.index++;
      if (!(index in harness.states)) harness.states[index] = initial;
      return [harness.states[index], (value: unknown) => { harness.states[index] = value; }];
    },
  };
});
vi.mock("@/hooks/use-inventory", () => ({
  useUpdateInventory: () => ({ mutateAsync: harness.mutateAsync, isPending: harness.isPending }),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: harness.toast }) }));
vi.mock("@/hooks/use-amsterdam-clock", () => ({ useAmsterdamClock: () => new Date("2026-10-06T12:00:00Z") }));
import { DeliveryStatus } from "./delivery-status";

function render(deliveredDate: string | null = null) {
  harness.index = 0;
  return DeliveryStatus({ id: 42, deliveredDate });
}
function nodes(node: ReactNode): ReactElement<any>[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<any>;
  return [element, ...nodes(element.props.children)];
}
function control(tree: ReactNode, testId: string) {
  return nodes(tree).find(node => node.props["data-testid"] === testId)!;
}
function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join(" ");
  if (node && typeof node === "object" && "props" in node) return text((node as ReactElement<any>).props.children);
  return "";
}
describe("delivery confirmation controls", () => {
  beforeEach(() => {
    harness.states = [];
    harness.index = 0;
    harness.isPending = false;
    harness.mutateAsync.mockReset().mockResolvedValue({ id: 42 });
    harness.toast.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());
  it("starts unconfirmed and opens with today's date without saving until confirmation", async () => {
    let tree = render();
    expect(text(tree)).toContain("Delivery not confirmed");
    control(tree, "button-mark-delivered").props.onClick();
    tree = render();
    expect(control(tree, "input-delivery-date").props.value).toBe("2026-10-06");
    expect(harness.mutateAsync).not.toHaveBeenCalled();
    await control(tree, "button-confirm-delivery").props.onClick();
    expect(harness.mutateAsync).toHaveBeenCalledWith({ id: 42, deliveredDate: "2026-10-06" });
    tree = render("2026-10-06");
    expect(text(tree)).toContain("Delivered");
    expect(text(tree)).toContain("14 days remaining");
    expect(text(tree)).toContain("20 Oct 2026");
  });
  it("allows correcting a saved date and recalculates from the new date", async () => {
    control(render("2026-10-01"), "button-mark-delivered").props.onClick();
    let tree = render("2026-10-01");
    control(tree, "input-delivery-date").props.onChange({ target: { value: "2026-10-03" } });
    tree = render("2026-10-01");
    await control(tree, "button-confirm-delivery").props.onClick();
    expect(harness.mutateAsync).toHaveBeenCalledWith({ id: 42, deliveredDate: "2026-10-03" });
    expect(text(render("2026-10-03"))).toContain("11 days remaining");
  });
  it("requires explicit confirmation before clearing a saved delivery date", async () => {
    control(render("2026-10-01"), "button-mark-delivered").props.onClick();
    let tree = render("2026-10-01");
    control(tree, "button-clear-delivery").props.onClick();
    expect(harness.mutateAsync).not.toHaveBeenCalled();
    tree = render("2026-10-01");
    expect(text(tree)).toContain("Clear delivery confirmation?");
    await control(tree, "button-confirm-delivery").props.onClick();
    expect(harness.mutateAsync).toHaveBeenCalledWith({ id: 42, deliveredDate: null });
    expect(text(render(null))).toContain("Delivery not confirmed");
  });
  it("rejects empty or future dates before making a request", async () => {
    control(render(), "button-mark-delivered").props.onClick();
    for (const value of ["", "2026-10-07"]) {
      control(render(), "input-delivery-date").props.onChange({ target: { value } });
      await control(render(), "button-confirm-delivery").props.onClick();
      expect(nodes(render()).some(node => node.props.role === "alert")).toBe(true);
    }
    expect(harness.mutateAsync).not.toHaveBeenCalled();
  });
  it("keeps the dialog open and delivery unconfirmed on a failed save", async () => {
    harness.mutateAsync.mockRejectedValue(new Error("Could not save delivery"));
    control(render(), "button-mark-delivered").props.onClick();
    await control(render(), "button-confirm-delivery").props.onClick();
    expect(text(render())).toContain("Could not save delivery");
    expect(text(render())).toContain("Delivery not confirmed");
    expect(harness.states[0]).toBe(true);
    expect(harness.toast).not.toHaveBeenCalled();
  });
  it("disables confirmation and clear controls while saving", () => {
    control(render("2026-10-01"), "button-mark-delivered").props.onClick();
    harness.isPending = true;
    const tree = render("2026-10-01");
    expect(control(tree, "button-confirm-delivery").props.disabled).toBe(true);
    expect(control(tree, "button-clear-delivery").props.disabled).toBe(true);
  });
});
