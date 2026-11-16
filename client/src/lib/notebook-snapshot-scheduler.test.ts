import { afterEach, describe, expect, it, vi } from "vitest";
import { startNotebookSnapshotScheduler } from "../../../server/notebook-snapshot-scheduler";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("automatic month-end inventory capture", () => {
  it("captures once at Amsterdam month-end without generating an AI review", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-31T22:59:58.500Z"));
    const capture = vi.fn().mockResolvedValue({});
    const stop = startNotebookSnapshotScheduler(capture);
    await vi.advanceTimersByTimeAsync(499);
    expect(capture).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(capture).toHaveBeenCalledExactlyOnceWith("2026-10");
    await vi.advanceTimersByTimeAsync(5000);
    expect(capture).toHaveBeenCalledTimes(1);
    stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("handles startup during the final second and stops cleanly", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-31T21:59:59.500Z"));
    const capture = vi.fn().mockResolvedValue({});
    const stop = startNotebookSnapshotScheduler(capture);
    await vi.advanceTimersByTimeAsync(1);
    expect(capture).toHaveBeenCalledExactlyOnceWith("2026-03");
    stop();
  });

  it("does not backdate captures if the server sleeps through midnight", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-31T22:59:58Z"));
    const capture = vi.fn().mockResolvedValue({});
    const stop = startNotebookSnapshotScheduler(capture);
    vi.setSystemTime(new Date("2026-11-01T01:00:00Z"));
    await vi.advanceTimersByTimeAsync(2000);
    expect(capture).not.toHaveBeenCalled();
    stop();
  });

  it("reports capture failures without leaking record or database details", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-31T22:59:58Z"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const capture = vi.fn().mockRejectedValue(new Error("Private connection detail"));
    const stop = startNotebookSnapshotScheduler(capture);
    await vi.advanceTimersByTimeAsync(2000);
    expect(error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(error.mock.calls)).not.toContain("Private connection detail");
    stop();
  });
});
