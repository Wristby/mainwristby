import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronsUpDown,
  Clock3,
  History,
  Loader2,
  Mic,
  Printer,
  Save,
  Timer,
} from "lucide-react";
import { format } from "date-fns";
import type { InventoryItem, InventoryTimingReading } from "@shared/schema";
import type { CreateInventoryTimingReading } from "@shared/timing";
import wristbyLogo from "@assets/WRISTBY-login-logo_1770424094780.png";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateInventoryTimingReading,
  useInventoryTimingReadings,
  useInventoryTimingSettings,
  useUpdateInventoryTimingSettings,
} from "@/hooks/use-inventory";
import { useTimegrapherCapture } from "@/hooks/use-timegrapher-capture";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TimingEngineSnapshot } from "@/lib/timegrapher/types";
import { applyOmegaTimingPreset, OMEGA_TIMING_PRESETS } from "@/lib/timegrapher/omega-timing-presets";

type Props = { item: InventoryItem };
type PrintableReading = {
  measuredAt: Date | string;
  durationSeconds: number;
  sampleRateHz: number;
  liftAngleDegrees: number;
  beatRateVph: number | null;
  rateSecondsPerDay: number | null;
  amplitudeDegrees: number | null;
  beatErrorMs: number | null;
  jitterMicroseconds: number | null;
  watchHeard: boolean;
};

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function snapshotToReading(snapshot: TimingEngineSnapshot): CreateInventoryTimingReading {
  const reading = snapshot.reading;
  const snr = finiteOrNull(reading.snr);
  const clippedFraction = finiteOrNull(reading.clipped_fraction);
  return {
    captureDurationSeconds: snapshot.capture_duration_s,
    sampleRateHz: snapshot.sample_rate_hz,
    readingWindowSeconds: snapshot.reading_window_seconds,
    requestedBeatRateVph: snapshot.requested_beat_rate_vph,
    beatRateVph: reading.bph ?? reading.bph_set,
    liftAngleDegrees: snapshot.lift_angle_deg,
    rateSecondsPerDay: finiteOrNull(reading.rate_s_per_day),
    amplitudeDegrees: finiteOrNull(reading.amplitude_deg),
    beatErrorMs: finiteOrNull(reading.beat_error_unlock_ms ?? reading.beat_error_ms),
    beatErrorSource: typeof reading.beat_error_source === "string" ? reading.beat_error_source : null,
    jitterMicroseconds: finiteOrNull(reading.jitter_us),
    beatsUsed: reading.beats_used,
    spanSeconds: reading.span_s,
    watchHeard: reading.watch_heard,
    findingBeat: reading.finding_beat,
    snr: snr !== null && snr >= 0 ? snr : null,
    clippedFraction: clippedFraction !== null && clippedFraction >= 0 && clippedFraction <= 1
      ? clippedFraction
      : null,
  };
}

function formatRate(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)} s/day`;
}

function formatAngle(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "—" : `${Math.round(value)}°`;
}

function formatBeatError(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "—" : `${value.toFixed(2)} ms`;
}

function formatBeatRate(value: number | null | undefined) {
  return value == null ? "—" : `${value.toLocaleString()} vph`;
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-[#dce5df] bg-white/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

function historyPrintRecord(row: InventoryTimingReading): PrintableReading {
  return {
    measuredAt: row.measuredAt,
    durationSeconds: row.captureDurationSeconds,
    sampleRateHz: row.sampleRateHz,
    liftAngleDegrees: row.liftAngleDegrees,
    beatRateVph: row.beatRateVph,
    rateSecondsPerDay: row.rateSecondsPerDay,
    amplitudeDegrees: row.amplitudeDegrees,
    beatErrorMs: row.beatErrorMs,
    jitterMicroseconds: row.jitterMicroseconds,
    watchHeard: row.watchHeard,
  };
}

export function TimingTab({ item }: Props) {
  const { toast } = useToast();
  const history = useInventoryTimingReadings(item.id);
  const settingsQuery = useInventoryTimingSettings(item.id);
  const createReading = useCreateInventoryTimingReading(item.id);
  const updateSettings = useUpdateInventoryTimingSettings(item.id);
  const [liftAngleText, setLiftAngleText] = useState("52");
  const [beatRateText, setBeatRateText] = useState("");
  const [savedThisRun, setSavedThisRun] = useState(false);
  const [printReading, setPrintReading] = useState<PrintableReading | null>(null);
  const [presetOpen, setPresetOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState("");

  const savedSettings = settingsQuery.data ?? { liftAngleDegrees: 52, beatRateVph: null };
  const selectedPreset = OMEGA_TIMING_PRESETS.find((preset) => preset.id === selectedPresetId);
  const liftAngle = Number(liftAngleText);
  const beatRate = beatRateText.trim() ? Number(beatRateText) : null;
  const settingsValid = Number.isFinite(liftAngle)
    && liftAngle >= 20
    && liftAngle <= 70
    && (beatRate === null || (Number.isInteger(beatRate) && beatRate >= 3_600 && beatRate <= 60_000));
  const settingsDirty = settingsValid && (
    liftAngle !== savedSettings.liftAngleDegrees
    || beatRate !== savedSettings.beatRateVph
  );
  const capture = useTimegrapherCapture(
    settingsValid ? liftAngle : 52,
    settingsValid ? beatRate : null,
  );
  const snapshot = capture.snapshot;
  const reading = snapshot?.reading;
  const usableReading = Boolean(
    snapshot
      && snapshot.capture_duration_s >= 15
      && reading?.watch_heard
      && (reading.rate_s_per_day !== null || reading.amplitude_deg !== null || reading.beat_error_ms !== null),
  );
  const clipped = typeof reading?.clipped_fraction === "number" && reading.clipped_fraction > 0.03;
  const displayedStatus = useMemo(() => {
    if (capture.status === "starting") return "Starting microphone and analyzer…";
    if (capture.status === "stopping") return "Finishing the current reading…";
    if (capture.status === "recording") {
      if (reading?.finding_beat) return "Finding the watch beat. Keep the microphone steady.";
      if (!reading?.watch_heard) return "Listening for a stable watch beat…";
      return "Live timing reading";
    }
    if (!snapshot) return "No timing reading yet";
    return reading?.watch_heard ? "Reading captured" : "No stable watch reading captured";
  }, [capture.status, reading?.finding_beat, reading?.watch_heard, snapshot]);

  useEffect(() => {
    if (!settingsQuery.data) return;
    setLiftAngleText(String(settingsQuery.data.liftAngleDegrees));
    setBeatRateText(settingsQuery.data.beatRateVph?.toString() ?? "");
    setSelectedPresetId("");
  }, [item.id, settingsQuery.data?.beatRateVph, settingsQuery.data?.liftAngleDegrees]);

  const selectPreset = (presetId: string) => {
    const preset = OMEGA_TIMING_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;
    const currentLiftAngle = Number(liftAngleText);
    const values = applyOmegaTimingPreset(preset, {
      liftAngleDegrees: Number.isFinite(currentLiftAngle) ? currentLiftAngle : 52,
      beatRateVph: beatRateText.trim() ? Number(beatRateText) : null,
    });
    setLiftAngleText(String(values.liftAngleDegrees));
    setBeatRateText(values.beatRateVph?.toString() ?? "");
    setSelectedPresetId(preset.id);
    setPresetOpen(false);
  };

  useEffect(() => {
    const cleanup = () => document.body.classList.remove("timing-print-active");
    window.addEventListener("afterprint", cleanup);
    return () => {
      cleanup();
      window.removeEventListener("afterprint", cleanup);
    };
  }, []);

  const saveSettings = () => {
    if (!settingsValid) return;
    updateSettings.mutate({ liftAngleDegrees: liftAngle, beatRateVph: beatRate }, {
      onSuccess: () => toast({ title: "Timing settings saved", description: "These settings are saved for this watch." }),
      onError: () => toast({ title: "Could not save settings", description: "Confirm migration 0022 is applied, then try again.", variant: "destructive" }),
    });
  };

  const saveReading = async () => {
    if (!snapshot || !usableReading || savedThisRun) return;
    try {
      await createReading.mutateAsync(snapshotToReading(snapshot));
      setSavedThisRun(true);
      toast({ title: "Timing reading saved", description: "The derived result was added to this watch’s timing history." });
    } catch {
      toast({ title: "Could not save reading", description: "The measurement is still on this page. Try saving again.", variant: "destructive" });
    }
  };

  const print = (measurement: PrintableReading) => {
    setPrintReading(measurement);
    document.body.classList.add("timing-print-active");
    window.requestAnimationFrame(() => window.print());
  };

  const currentPrintReading = snapshot ? {
    measuredAt: new Date(),
    durationSeconds: snapshot.capture_duration_s,
    sampleRateHz: snapshot.sample_rate_hz,
    liftAngleDegrees: snapshot.lift_angle_deg,
    beatRateVph: reading?.bph ?? reading?.bph_set ?? null,
    rateSecondsPerDay: finiteOrNull(reading?.rate_s_per_day),
    amplitudeDegrees: finiteOrNull(reading?.amplitude_deg),
    beatErrorMs: finiteOrNull(reading?.beat_error_unlock_ms ?? reading?.beat_error_ms),
    jitterMicroseconds: finiteOrNull(reading?.jitter_us),
    watchHeard: reading?.watch_heard ?? false,
  } satisfies PrintableReading : null;

  return (
    <div className="space-y-6">
      <Card className="border-[#d8e2dc] bg-[#fbfcf8] shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                <Activity className="h-5 w-5 text-emerald-700" />
                Timing
              </CardTitle>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                Read the movement through a connected microphone. Audio is analyzed in your browser and is never uploaded or saved.
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
              Browser-based
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="rounded-xl border border-[#dce5df] bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Timer className="h-4 w-4 text-emerald-700" />
              <h2 className="font-semibold text-slate-900">Watch settings</h2>
            </div>
            <div className="mb-4 space-y-2">
              <Label htmlFor="omega-timing-preset">Omega movement preset (optional)</Label>
              <Popover open={presetOpen} onOpenChange={setPresetOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="omega-timing-preset"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={presetOpen}
                    disabled={capture.status !== "idle" || settingsQuery.isLoading}
                    className="w-full justify-between border-[#cbd9d0] bg-white text-left font-normal text-slate-700"
                  >
                    <span className="truncate">{selectedPreset?.label ?? "Search Omega calibres…"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search by caliber…" />
                    <CommandList>
                      <CommandEmpty>No sourced Omega preset found.</CommandEmpty>
                      <CommandGroup>
                        {OMEGA_TIMING_PRESETS.map((preset) => (
                          <CommandItem
                            key={preset.id}
                            value={preset.label}
                            onSelect={() => selectPreset(preset.id)}
                            className="items-start py-3"
                          >
                            <Check className={cn("mt-0.5 h-4 w-4", selectedPresetId === preset.id ? "opacity-100" : "opacity-0")} />
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium">{preset.label}</span>
                              <span className="mt-1 block text-xs text-slate-500">
                                {preset.beatRateVph == null ? "rate unchanged" : `${preset.beatRateVph.toLocaleString()} vph`}
                                {preset.liftAngleDegrees == null ? " · lift angle unchanged" : ` · ${preset.liftAngleDegrees}°`}
                              </span>
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-slate-500">
                These source-backed starters cover a verified subset of Omega calibres. Enter missing specs manually; saving affects this watch only, not past readings.
              </p>
              {selectedPreset && (
                <div className="rounded-lg border border-[#dce5df] bg-[#f5f8f5] px-3 py-2.5 text-xs text-slate-600">
                  <p className="font-medium text-slate-700">{selectedPreset.confidenceLabel}</p>
                  <p className="mt-1 leading-relaxed">{selectedPreset.note}</p>
                  {selectedPreset.liftAngleDegrees == null && (
                    <p className="mt-1 font-medium text-amber-800">
                      Current lift angle ({liftAngleText || "52"}°) was kept; verify it before relying on amplitude.
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {selectedPreset.sources.map((source) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-emerald-800 underline underline-offset-2"
                      >
                        {source.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timing-lift-angle">Lift angle (degrees)</Label>
                <Input
                  id="timing-lift-angle"
                  type="number"
                  min={20}
                  max={70}
                  step={1}
                  value={liftAngleText}
                  onChange={(event) => {
                    setLiftAngleText(event.target.value);
                    setSelectedPresetId("");
                  }}
                  disabled={capture.status !== "idle"}
                  aria-invalid={!settingsValid}
                />
                <p className="text-xs text-slate-500">Defaults to 52°. Check the movement specification for an accurate amplitude reading.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timing-beat-rate">Beat rate (vph), optional</Label>
                <Input
                  id="timing-beat-rate"
                  type="number"
                  min={3_600}
                  max={60_000}
                  step={1}
                  placeholder="Auto-detect"
                  value={beatRateText}
                  onChange={(event) => {
                    setBeatRateText(event.target.value);
                    setSelectedPresetId("");
                  }}
                  disabled={capture.status !== "idle"}
                  aria-invalid={!settingsValid}
                />
                <p className="text-xs text-slate-500">Leave blank to let Timegrapher determine the beat rate.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={saveSettings}
                disabled={!settingsValid || !settingsDirty || settingsQuery.isError || settingsQuery.isLoading || updateSettings.isPending || capture.status !== "idle"}
                className="border-[#cbd9d0] bg-white text-slate-700"
              >
                {updateSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save watch settings
              </Button>
              {!settingsValid && <span className="text-xs text-rose-700">Lift angle must be 20–70°. Beat rate must be 3,600–60,000 vph.</span>}
              {settingsDirty && settingsValid && <span className="text-xs text-amber-700">Save changes before starting a measurement.</span>}
              {settingsQuery.isError && <span className="text-xs text-slate-600">Timing storage is unavailable. Confirm database migration 0022 has been applied.</span>}
            </div>
          </section>

          <section className="rounded-xl border border-[#dce5df] bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Mic className="h-4 w-4 text-emerald-700" />
              <h2 className="font-semibold text-slate-900">Microphone input</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="timing-audio-input">Input device</Label>
                <Select
                  value={capture.selectedDeviceId}
                  onValueChange={capture.setSelectedDeviceId}
                  disabled={capture.status !== "idle"}
                >
                  <SelectTrigger id="timing-audio-input" className="bg-white">
                    <SelectValue placeholder="Choose microphone input" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default microphone</SelectItem>
                    {capture.devices.filter((device) => device.deviceId !== "default").map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>{device.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => void capture.connectMicrophone()}
                disabled={capture.status !== "idle"}
                className="border-[#cbd9d0] bg-white text-slate-700"
              >
                <Mic className="mr-2 h-4 w-4" />
                {capture.microphoneReady ? "Refresh microphone access" : "Enable microphone"}
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {capture.status === "idle" ? (
                <Button
                  type="button"
                  onClick={async () => {
                    setSavedThisRun(false);
                    await capture.start();
                  }}
                  disabled={!capture.microphoneReady || !settingsValid || settingsDirty || settingsQuery.isLoading || settingsQuery.isError || updateSettings.isPending}
                  className="bg-emerald-800 text-white hover:bg-emerald-700"
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Start timing test
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void capture.stop()}
                  disabled={capture.status !== "recording"}
                >
                  {capture.status === "stopping" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Timer className="mr-2 h-4 w-4" />}
                  Stop test
                </Button>
              )}
              <span className="text-sm text-slate-600" role="status">
                {capture.status === "recording" && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-600 align-middle" />}
                {displayedStatus}
                {capture.status === "recording" && <span className="ml-2 font-mono tabular-nums">{formatElapsed(capture.elapsedSeconds)}</span>}
              </span>
            </div>
            {capture.error && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600" role="alert">
                {capture.error}
              </p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Use the external contact microphone recommended by Timegrapher, place it firmly against the watch, and keep the room quiet.
              The browser disables automatic gain/noise processing where supported; your device may still apply its own audio processing.
            </p>
          </section>

          {snapshot && (
            <section className="rounded-xl border border-[#dce5df] bg-[#edf4ef] p-4 sm:p-5" aria-live="polite">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">Latest reading</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {displayedStatus} · {Math.round(snapshot.capture_duration_s)} sec captured · {Math.round(snapshot.reading_window_seconds)} sec reading window
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!capture.isRecording && usableReading && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => currentPrintReading && print(currentPrintReading)}
                        className="border-[#cbd9d0] bg-white text-slate-700"
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void saveReading()}
                        disabled={savedThisRun || createReading.isPending}
                        className="bg-emerald-800 text-white hover:bg-emerald-700"
                      >
                        {createReading.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : savedThisRun ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                        {savedThisRun ? "Saved to history" : "Save reading"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  label="Rate"
                  value={formatRate(reading?.rate_s_per_day)}
                  detail={reading?.rate_error_s_per_day != null ? `±${reading.rate_error_s_per_day.toFixed(1)} s/day` : undefined}
                />
                <Metric
                  label="Amplitude"
                  value={formatAngle(reading?.amplitude_deg)}
                  detail={reading?.amplitude_error_deg != null ? `±${reading.amplitude_error_deg.toFixed(0)}° estimate` : undefined}
                />
                <Metric
                  label="Beat error"
                  value={formatBeatError(reading?.beat_error_unlock_ms ?? reading?.beat_error_ms)}
                  detail={reading?.jitter_us != null ? `${Math.round(reading.jitter_us)} μs timing scatter` : undefined}
                />
                <Metric label="Frequency" value={formatBeatRate(reading?.bph ?? reading?.bph_set)} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span>Lift angle: {formatAngle(snapshot.lift_angle_deg)}</span>
                <span>·</span>
                <span>{snapshot.sample_rate_hz.toLocaleString()} Hz input</span>
                {reading && reading.beats_used > 0 && <><span>·</span><span>{reading.beats_used.toLocaleString()} beats analyzed</span></>}
              </div>
              {clipped && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  Audio clipping is affecting this reading. Reduce input gain or adjust the microphone position, then measure again.
                </p>
              )}
              {!reading?.watch_heard && (
                <p className="mt-3 text-sm text-slate-600">
                  {reading?.finding_beat
                    ? "The analyzer is finding a regular beat. Keep the microphone steady and allow more time."
                    : "A stable watch beat has not been recognized. Check contact mic placement and background noise."}
                </p>
              )}
              {reading?.watch_heard && (reading.rate_s_per_day == null || reading.amplitude_deg == null) && capture.status === "recording" && (
                <p className="mt-3 text-sm text-slate-600">Some values need a longer clean recording. Let the test run longer for a more complete reading.</p>
              )}
            </section>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#d8e2dc] bg-[#fbfcf8] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <History className="h-5 w-5 text-emerald-700" />
            Timing history
          </CardTitle>
          <p className="text-sm text-slate-500">Saved measurements for this watch. Only calculated readings and settings are retained.</p>
        </CardHeader>
        <CardContent>
          {history.isLoading ? (
            <div className="flex items-center gap-2 py-5 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading timing history…</div>
          ) : history.isError ? (
            <p className="py-4 text-sm text-slate-500">Timing history is unavailable. Confirm database migration 0022 has been applied, then refresh this tab.</p>
          ) : history.data?.length ? (
            <div className="space-y-3">
              {history.data.map((row) => (
                <TimingHistoryRow key={row.id} row={row} onPrint={() => print(historyPrintRecord(row))} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#d5e0d9] px-4 py-7 text-center">
              <Clock3 className="mx-auto h-6 w-6 text-slate-400" />
              <p className="mt-2 text-sm font-medium text-slate-700">No saved timing readings yet</p>
              <p className="mt-1 text-xs text-slate-500">Complete a test and save its results to start this watch’s history.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {printReading && (
        <div className="timing-printable hidden">
          <div className="timing-print-receipt font-sans text-slate-950">
            <header className="timing-print-brand">
              <img src={wristbyLogo} alt="WRISTBY" className="timing-print-logo" />
              <span>WRISTBY</span>
            </header>
            <p className="timing-print-kicker">WATCH TIMING RECORD</p>
            <section className="timing-print-watch">
              <h1>{item.brand} {item.model}</h1>
              <p>Reference {item.referenceNumber || "—"}{item.serialNumber ? ` · Serial ${item.serialNumber}` : ""}</p>
            </section>
            <dl className="timing-print-metrics">
              <PrintMetric label="Beat rate" value={formatBeatRate(printReading.beatRateVph)} />
              <PrintMetric label="Rate" value={formatRate(printReading.rateSecondsPerDay)} />
              <PrintMetric label="Amplitude" value={formatAngle(printReading.amplitudeDegrees)} />
              <PrintMetric label="Beat error" value={formatBeatError(printReading.beatErrorMs)} />
              <PrintMetric label="Lift angle" value={`${printReading.liftAngleDegrees.toFixed(1)}°`} />
              <PrintMetric label="Date" value={format(new Date(printReading.measuredAt), "dd MMM yyyy")} />
              <PrintMetric label="Time" value={format(new Date(printReading.measuredAt), "HH:mm:ss")} />
              <PrintMetric label="Capture" value={`${Math.round(printReading.durationSeconds)} sec`} />
            </dl>
            <div className="timing-print-footer">
              {printReading.sampleRateHz.toLocaleString("en-US")} Hz microphone input
              {!printReading.watchHeard && <p>Beat not confirmed in this capture</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimingHistoryRow({ row, onPrint }: { row: InventoryTimingReading; onPrint: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#dce5df] bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{format(new Date(row.measuredAt), "dd MMM yyyy, HH:mm")}</p>
          <Badge variant="outline" className={cn(
            "text-[11px]",
            row.watchHeard
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-slate-50 text-slate-600",
          )}>
            {row.watchHeard ? "Stable beat" : "Unconfirmed"}
          </Badge>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <span>Rate <strong className="font-semibold text-slate-800">{formatRate(row.rateSecondsPerDay)}</strong></span>
          <span>Amplitude <strong className="font-semibold text-slate-800">{formatAngle(row.amplitudeDegrees)}</strong></span>
          <span>Beat error <strong className="font-semibold text-slate-800">{formatBeatError(row.beatErrorMs)}</strong></span>
          <span>Frequency <strong className="font-semibold text-slate-800">{formatBeatRate(row.beatRateVph)}</strong></span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Lift angle {formatAngle(row.liftAngleDegrees)} · {Math.round(row.captureDurationSeconds)} sec capture
          {row.clippedFraction != null && row.clippedFraction > 0.03 ? " · clipping noted" : ""}
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onPrint} className="shrink-0 border-[#cbd9d0] bg-white text-slate-700">
        <Printer className="mr-2 h-4 w-4" />
        Print result
      </Button>
    </div>
  );
}

function PrintMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="timing-print-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
