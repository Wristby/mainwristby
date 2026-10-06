import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ setNow: vi.fn(), cleanup: undefined as undefined | (() => void) }));
vi.mock("react", () => ({
  useState: (initial: () => Date) => [initial(), state.setNow],
  useEffect: (effect: () => (() => void)) => { state.cleanup = effect(); },
}));
import { useAmsterdamClock } from "./use-amsterdam-clock";

describe("live Amsterdam countdown clock", () => {
  let windowEvents: EventTarget;
  let documentEvents: EventTarget & { visibilityState: string };
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T21:59:59Z"));
    state.setNow.mockReset();
    windowEvents = new EventTarget();
    documentEvents = Object.assign(new EventTarget(), { visibilityState: "visible" });
    vi.stubGlobal("window", windowEvents);
    vi.stubGlobal("document", documentEvents);
  });
  afterEach(() => {
    state.cleanup?.();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  it("updates just after midnight without a save or page reload", () => {
    useAmsterdamClock();
    expect(state.setNow).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1025);
    expect(state.setNow).toHaveBeenLastCalledWith(new Date("2026-10-06T22:00:00.025Z"));
    expect(vi.getTimerCount()).toBe(1);
  });
  it("refreshes after tab resume, focus, and page restoration and cleans up timers", () => {
    useAmsterdamClock();
    vi.setSystemTime(new Date("2026-10-07T12:00:00Z"));
    documentEvents.dispatchEvent(new Event("visibilitychange"));
    windowEvents.dispatchEvent(new Event("focus"));
    windowEvents.dispatchEvent(new Event("pageshow"));
    expect(state.setNow).toHaveBeenLastCalledWith(new Date("2026-10-07T12:00:00Z"));
    state.cleanup?.();
    expect(vi.getTimerCount()).toBe(0);
    state.setNow.mockClear();
    windowEvents.dispatchEvent(new Event("focus"));
    expect(state.setNow).not.toHaveBeenCalled();
  });
});
