import initialize, { TimingEngine } from "./generated/timegrapher_browser";
import type { TimingEngineSnapshot } from "./types";

type WorkerRequest =
  | {
      type: "initialize";
      sampleRateHz: number;
      liftAngleDegrees: number;
      beatRateVph: number | null;
    }
  | { type: "samples"; buffer: ArrayBuffer }
  | { type: "snapshot"; requestId: number; averageSeconds: number }
  | { type: "dispose" };

type WorkerResponse =
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "snapshot"; requestId: number; snapshot: TimingEngineSnapshot };

type WorkerScope = {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
  close(): void;
};

const workerScope = self as unknown as WorkerScope;
let engine: TimingEngine | null = null;

workerScope.onmessage = async ({ data }) => {
  try {
    if (data.type === "initialize") {
      await initialize();
      engine = new TimingEngine(data.sampleRateHz, data.beatRateVph, data.liftAngleDegrees);
      workerScope.postMessage({ type: "ready" });
      return;
    }

    if (data.type === "samples") {
      if (!engine) throw new Error("The timing analyzer is not ready.");
      engine.push(new Float32Array(data.buffer));
      return;
    }

    if (data.type === "snapshot") {
      if (!engine) throw new Error("The timing analyzer is not ready.");
      const snapshot = JSON.parse(engine.snapshot(data.averageSeconds)) as TimingEngineSnapshot;
      workerScope.postMessage({ type: "snapshot", requestId: data.requestId, snapshot });
      return;
    }

    engine?.free();
    engine = null;
    workerScope.close();
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "The timing analyzer failed.",
    });
  }
};
