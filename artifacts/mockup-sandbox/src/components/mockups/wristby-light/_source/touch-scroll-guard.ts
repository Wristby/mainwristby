/**
 * Ignore compatibility clicks after a touch gesture scrolls or moves.
 * Capture at the document so this also protects links inside scrollable tables
 * and dialogs. Passive touch listeners leave native scrolling untouched.
 */
export function installTouchScrollGuard(target: EventTarget) {
  let gesture: { x: number; y: number; moved: boolean; endedAt: number | null } | null = null;
  const markMoved = () => {
    if (gesture && gesture.endedAt === null) gesture.moved = true;
  };
  const onStart = (event: Event) => {
    const touches = (event as TouchEvent).touches;
    const touch = touches[0];
    if (!touch) return;
    gesture = { x: touch.clientX, y: touch.clientY, moved: touches.length > 1, endedAt: null };
  };
  const onMove = (event: Event) => {
    const touches = (event as TouchEvent).touches;
    const touch = touches[0];
    if (!gesture || !touch) return;
    if (touches.length > 1 || Math.hypot(touch.clientX - gesture.x, touch.clientY - gesture.y) > 10) {
      gesture.moved = true;
    }
  };
  const onEnd = (event: Event) => {
    if (!gesture) return;
    // Some browsers coalesce movement events; inspect the final position too.
    const touch = (event as TouchEvent).changedTouches[0];
    if (touch && Math.hypot(touch.clientX - gesture.x, touch.clientY - gesture.y) > 10) {
      gesture.moved = true;
    }
    gesture.endedAt = Date.now();
  };
  const onCancel = (event: Event) => {
    markMoved();
    onEnd(event);
  };
  const onPointerDown = (event: Event) => {
    if ((event as PointerEvent).pointerType === "mouse") gesture = null;
  };
  const onClick = (event: Event) => {
    // Keyboard and assistive-technology activation have detail=0.
    if ((event as MouseEvent).detail === 0 || !gesture?.moved) return;
    if (gesture.endedAt !== null && Date.now() - gesture.endedAt > 800) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const options = { capture: true, passive: true };
  const listeners: [string, EventListener][] = [
    ["touchstart", onStart], ["touchmove", onMove], ["touchend", onEnd],
    ["touchcancel", onCancel], ["scroll", markMoved], ["pointerdown", onPointerDown],
  ];
  listeners.forEach(([type, listener]) => target.addEventListener(type, listener, options));
  target.addEventListener("click", onClick, { capture: true });
  return () => {
    listeners.forEach(([type, listener]) => target.removeEventListener(type, listener, { capture: true }));
    target.removeEventListener("click", onClick, { capture: true });
  };
}
