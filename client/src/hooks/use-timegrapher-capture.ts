import { useCallback, useEffect, useRef, useState } from "react";
import type { TimingEngineSnapshot } from "@/lib/timegrapher/types";

type AudioInput = { deviceId: string; label: string };
type CaptureStatus = "idle" | "starting" | "recording" | "stopping";
type WorkerResponse =
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "snapshot"; requestId: number; snapshot: TimingEngineSnapshot };
type CaptureSession = {
  stream: MediaStream;
  context: AudioContext;
  source: MediaStreamAudioSourceNode;
  processor: AudioWorkletNode;
  worker: Worker;
  timer: number;
};

const READING_WINDOW_SECONDS = 20;

function microphoneErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Microphone access was blocked. Allow it in your browser’s site permissions, then try again.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No microphone input was found. Connect a microphone and try again.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "The microphone is unavailable or already in use by another app.";
  }
  if (name === "OverconstrainedError") {
    return "That microphone is no longer available. Choose another input.";
  }
  return error instanceof Error ? error.message : "Could not start microphone capture.";
}

function audioConstraints(deviceId: string): MediaStreamConstraints {
  const audio: MediaTrackConstraints = {
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 48_000 },
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  };
  if (deviceId && deviceId !== "default") audio.deviceId = { exact: deviceId };
  return { audio };
}

export function useTimegrapherCapture(
  liftAngleDegrees: number,
  beatRateVph: number | null,
) {
  const [devices, setDevices] = useState<AudioInput[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("default");
  const [microphoneReady, setMicrophoneReady] = useState(false);
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [snapshot, setSnapshot] = useState<TimingEngineSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<CaptureSession | null>(null);
  const requestIdRef = useRef(0);
  const latestSnapshotRef = useRef<TimingEngineSnapshot | null>(null);
  const resolversRef = useRef(new Map<number, (value: TimingEngineSnapshot | null) => void>());
  const startedAtRef = useRef<number | null>(null);

  const acceptSnapshot = useCallback((next: TimingEngineSnapshot) => {
    latestSnapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const requestSnapshot = useCallback((worker: Worker): Promise<TimingEngineSnapshot | null> => {
    const requestId = ++requestIdRef.current;
    return new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        resolversRef.current.delete(requestId);
        resolve(latestSnapshotRef.current);
      }, 2500);
      resolversRef.current.set(requestId, (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      });
      worker.postMessage({
        type: "snapshot",
        requestId,
        averageSeconds: READING_WINDOW_SECONDS,
      });
    });
  }, []);

  const enumerateInputs = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const inputs = (await navigator.mediaDevices.enumerateDevices())
      .filter((device) => device.kind === "audioinput")
      .map((device, index) => ({
        deviceId: device.deviceId || `input-${index}`,
        label: device.label || `Microphone ${index + 1}`,
      }));
    setDevices(inputs);
    return inputs;
  }, []);

  const connectMicrophone = useCallback(async () => {
    setError(null);
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access needs a secure HTTPS page in a browser that supports audio capture.");
      return false;
    }
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(audioConstraints(selectedDeviceId));
      const activeDeviceId = stream.getAudioTracks()[0]?.getSettings().deviceId;
      const inputs = await enumerateInputs();
      if (activeDeviceId && inputs.some((device) => device.deviceId === activeDeviceId)) {
        setSelectedDeviceId(activeDeviceId);
      }
      setMicrophoneReady(true);
      return true;
    } catch (captureError) {
      setError(microphoneErrorMessage(captureError));
      return false;
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
    }
  }, [enumerateInputs, selectedDeviceId]);

  const stopSession = useCallback(async (): Promise<TimingEngineSnapshot | null> => {
    const session = sessionRef.current;
    if (!session) return latestSnapshotRef.current;
    setStatus("stopping");
    window.clearInterval(session.timer);

    await new Promise<void>((resolve) => {
      let completed = false;
      const finish = () => {
        if (completed) return;
        completed = true;
        session.processor.port.removeEventListener("message", onFlush);
        resolve();
      };
      const onFlush = (event: MessageEvent) => {
        if (event.data?.type === "flushed") finish();
      };
      session.processor.port.addEventListener("message", onFlush);
      session.processor.port.postMessage({ type: "flush" });
      window.setTimeout(finish, 1200);
    });

    let finalSnapshot = latestSnapshotRef.current;
    try {
      finalSnapshot = await requestSnapshot(session.worker);
      if (finalSnapshot) acceptSnapshot(finalSnapshot);
    } catch {
      // Keep the last valid live snapshot if the final worker message is unavailable.
    }

    session.source.disconnect();
    session.processor.disconnect();
    session.stream.getTracks().forEach((track) => track.stop());
    session.worker.terminate();
    void session.context.close();
    sessionRef.current = null;
    startedAtRef.current = null;
    setStatus("idle");
    return finalSnapshot;
  }, [acceptSnapshot, requestSnapshot]);

  const start = useCallback(async () => {
    if (status !== "idle") return false;
    setError(null);
    setSnapshot(null);
    latestSnapshotRef.current = null;
    setElapsedSeconds(0);

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access needs a secure HTTPS page in a browser that supports audio capture.");
      return false;
    }

    setStatus("starting");
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let processor: AudioWorkletNode | null = null;
    let worker: Worker | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia(audioConstraints(selectedDeviceId));
      const activeDeviceId = stream.getAudioTracks()[0]?.getSettings().deviceId;
      if (activeDeviceId) setSelectedDeviceId(activeDeviceId);
      setMicrophoneReady(true);
      void enumerateInputs();

      context = new AudioContext({ latencyHint: "interactive" });
      await context.resume();
      if (!context.audioWorklet) throw new Error("This browser does not support microphone worklets. Try a current version of Chrome, Edge, or Firefox.");
      await context.audioWorklet.addModule(
        new URL("../lib/timegrapher/capture-processor.js", import.meta.url),
      );
      processor = new AudioWorkletNode(context, "wristby-timing-capture", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        channelCount: 1,
        channelCountMode: "explicit",
      });
      worker = new Worker(
        new URL("../lib/timegrapher/timegrapher.worker.ts", import.meta.url),
        { type: "module" },
      );
      const currentWorker = worker;
      const readyPromise = new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("The timing analyzer took too long to start.")), 20_000);
        currentWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const message = event.data;
          if (message.type === "ready") {
            window.clearTimeout(timeout);
            resolve();
          } else if (message.type === "error") {
            setError(message.message);
            resolversRef.current.forEach((resolve) => resolve(null));
            resolversRef.current.clear();
            reject(new Error(message.message));
          } else {
            acceptSnapshot(message.snapshot);
            resolversRef.current.get(message.requestId)?.(message.snapshot);
            resolversRef.current.delete(message.requestId);
          }
        };
        currentWorker.onerror = () => {
          window.clearTimeout(timeout);
          setError("The browser timing analyzer could not load.");
          reject(new Error("The browser timing analyzer could not load."));
        };
      });
      currentWorker.postMessage({
        type: "initialize",
        sampleRateHz: context.sampleRate,
        liftAngleDegrees,
        beatRateVph,
      });
      await readyPromise;

      source = context.createMediaStreamSource(stream);
      const currentProcessor = processor;
      const currentSource = source;
      const currentStream = stream;
      const currentContext = context;
      currentProcessor.port.onmessage = (event: MessageEvent) => {
        if (event.data?.type === "samples" && currentWorker) {
          currentWorker.postMessage({ type: "samples", buffer: event.data.buffer }, [event.data.buffer]);
        }
      };
      currentSource.connect(currentProcessor);
      currentProcessor.connect(currentContext.destination);
      const timer = window.setInterval(() => {
        const startedAt = startedAtRef.current;
        if (startedAt !== null) setElapsedSeconds(Math.floor((performance.now() - startedAt) / 1000));
        void requestSnapshot(currentWorker);
      }, 1000);
      sessionRef.current = {
        stream: currentStream,
        context: currentContext,
        source: currentSource,
        processor: currentProcessor,
        worker: currentWorker,
        timer,
      };
      startedAtRef.current = performance.now();
      setStatus("recording");
      return true;
    } catch (startError) {
      processor?.disconnect();
      source?.disconnect();
      stream?.getTracks().forEach((track) => track.stop());
      worker?.terminate();
      if (context) void context.close();
      setStatus("idle");
      setError(microphoneErrorMessage(startError));
      return false;
    }
  }, [acceptSnapshot, beatRateVph, enumerateInputs, liftAngleDegrees, requestSnapshot, selectedDeviceId, status]);

  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (!session) return;
      window.clearInterval(session.timer);
      session.source.disconnect();
      session.processor.disconnect();
      session.stream.getTracks().forEach((track) => track.stop());
      session.worker.terminate();
      void session.context.close();
      sessionRef.current = null;
    };
  }, []);

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    microphoneReady,
    status,
    isRecording: status === "recording" || status === "starting",
    elapsedSeconds,
    snapshot,
    error,
    connectMicrophone,
    start,
    stop: stopSession,
  };
}
