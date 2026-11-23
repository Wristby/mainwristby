export type TimingEngineReading = {
  time_s: number;
  bph: number | null;
  bph_set: number | null;
  rate_s_per_day: number | null;
  rate_error_s_per_day: number | null;
  beat_error_ms: number | null;
  beat_error_unlock_ms: number | null;
  beat_error_source: string | null;
  amplitude_deg: number | null;
  amplitude_error_deg: number | null;
  jitter_us: number | null;
  beats_used: number;
  span_s: number;
  watch_heard: boolean;
  finding_beat: boolean;
  snr: number | null;
  clipped_fraction: number | null;
  caveats: unknown[];
};

export type TimingEngineSnapshot = {
  capture_duration_s: number;
  sample_rate_hz: number;
  reading_window_seconds: number;
  lift_angle_deg: number;
  requested_beat_rate_vph: number | null;
  reading: TimingEngineReading;
};
