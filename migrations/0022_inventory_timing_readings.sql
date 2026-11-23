CREATE TABLE IF NOT EXISTS inventory_timing_settings (
  inventory_id INTEGER PRIMARY KEY REFERENCES inventory(id) ON DELETE CASCADE,
  lift_angle_degrees REAL NOT NULL DEFAULT 52,
  beat_rate_vph INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_timing_readings (
  id SERIAL PRIMARY KEY,
  inventory_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  capture_duration_seconds REAL NOT NULL,
  sample_rate_hz INTEGER NOT NULL,
  reading_window_seconds REAL NOT NULL,
  requested_beat_rate_vph INTEGER,
  beat_rate_vph INTEGER,
  lift_angle_degrees REAL NOT NULL,
  rate_seconds_per_day REAL,
  amplitude_degrees REAL,
  beat_error_ms REAL,
  beat_error_source TEXT,
  jitter_microseconds REAL,
  beats_used INTEGER NOT NULL,
  span_seconds REAL NOT NULL,
  watch_heard BOOLEAN NOT NULL,
  finding_beat BOOLEAN NOT NULL,
  snr REAL,
  clipped_fraction REAL,
  engine_version TEXT NOT NULL DEFAULT '1.1.0'
);

CREATE INDEX IF NOT EXISTS inventory_timing_readings_watch_measured_idx
  ON inventory_timing_readings (inventory_id, measured_at DESC);
