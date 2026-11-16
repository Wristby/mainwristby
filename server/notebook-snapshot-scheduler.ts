import { notebookMonthEndCaptureAt, notebookMonthKey } from "@shared/dealers-notebook";

type SnapshotCapture = (monthKey: string) => Promise<unknown>;

/** Runs independently of AI reports. Missed months must stay unavailable. */
export function startNotebookSnapshotScheduler(capture: SnapshotCapture): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let attemptedMonth: string | undefined;

  const schedule = () => {
    if (stopped) return;
    const now = new Date();
    const monthKey = notebookMonthKey(now)!;
    const target = notebookMonthEndCaptureAt(monthKey);
    // Re-evaluate hourly: avoids Node's 32-bit timeout cap and handles sleep/resume.
    const delay = target.getTime() + (attemptedMonth === monthKey ? 1000 : 0) - now.getTime();
    timer = setTimeout(async () => {
      const current = new Date();
      if (attemptedMonth !== monthKey && notebookMonthKey(current) === monthKey && current >= target) {
        attemptedMonth = monthKey;
        try {
          await capture(monthKey);
        } catch {
          console.error("Month-end inventory capture failed. Check database availability; no watch records were changed.");
        }
      }
      schedule();
    }, Math.max(0, Math.min(delay, 3_600_000)));
    timer.unref();
  };
  schedule();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
