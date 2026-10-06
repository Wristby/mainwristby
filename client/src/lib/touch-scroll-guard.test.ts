import { afterEach, describe, expect, it, vi } from "vitest";
import { installTouchScrollGuard } from "./touch-scroll-guard";

function touch(target: EventTarget, type: string, x = 10, y = 10, count = 1) {
  const event = new Event(type);
  const points = Array.from({ length: count }, () => ({ clientX: x, clientY: y }));
  Object.defineProperties(event, {
    touches: { value: points }, changedTouches: { value: points },
  });
  target.dispatchEvent(event);
}
function click(target: EventTarget, detail = 1) {
  const event = new Event("click", { cancelable: true });
  Object.defineProperty(event, "detail", { value: detail });
  target.dispatchEvent(event);
  return event.defaultPrevented;
}
describe("touch scroll guard", () => {
  afterEach(() => vi.useRealTimers());
  it("allows deliberate taps and minor finger jitter", () => {
    const target = new EventTarget();
    installTouchScrollGuard(target);
    touch(target, "touchstart");
    touch(target, "touchmove", 12, 13);
    touch(target, "touchend", 12, 13);
    expect(click(target)).toBe(false);
  });
  it.each([[10, 50], [50, 10]])("blocks vertical and horizontal swipes (%s, %s)", (x, y) => {
    const target = new EventTarget();
    installTouchScrollGuard(target);
    touch(target, "touchstart");
    touch(target, "touchmove", x, y);
    touch(target, "touchend", x, y);
    expect(click(target)).toBe(true);
    // A fresh intentional tap must work immediately after scrolling.
    touch(target, "touchstart");
    touch(target, "touchend");
    expect(click(target)).toBe(false);
  });
  it("blocks scroll and cancelled gestures but preserves keyboard activation", () => {
    const target = new EventTarget();
    installTouchScrollGuard(target);
    touch(target, "touchstart");
    target.dispatchEvent(new Event("scroll"));
    touch(target, "touchend");
    expect(click(target)).toBe(true);
    expect(click(target, 0)).toBe(false);
    touch(target, "touchstart");
    touch(target, "touchcancel");
    expect(click(target)).toBe(true);
  });
  it("detects movement at touchend even without touchmove events", () => {
    const target = new EventTarget();
    installTouchScrollGuard(target);
    touch(target, "touchstart");
    touch(target, "touchend", 10, 100);
    expect(click(target)).toBe(true);
  });
  it("expires suppression and removes listeners on cleanup", () => {
    vi.useFakeTimers();
    const target = new EventTarget();
    const cleanup = installTouchScrollGuard(target);
    touch(target, "touchstart");
    touch(target, "touchend", 50, 50);
    vi.advanceTimersByTime(801);
    expect(click(target)).toBe(false);
    touch(target, "touchstart");
    touch(target, "touchend", 50, 50);
    cleanup();
    expect(click(target)).toBe(false);
  });
  it("does not suppress desktop mouse clicks", () => {
    const target = new EventTarget();
    installTouchScrollGuard(target);
    touch(target, "touchstart");
    touch(target, "touchend", 50, 50);
    const pointer = new Event("pointerdown");
    Object.defineProperty(pointer, "pointerType", { value: "mouse" });
    target.dispatchEvent(pointer);
    expect(click(target)).toBe(false);
  });
});
