use serde::Serialize;
use timegrapher_core::live::{LiveAnalyzer, LiveConfig, LiveReading};
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
struct TimingSnapshot {
    capture_duration_s: f64,
    sample_rate_hz: u32,
    reading_window_seconds: f64,
    lift_angle_deg: f64,
    requested_beat_rate_vph: Option<u32>,
    reading: LiveReading,
}

#[wasm_bindgen]
pub struct TimingEngine {
    analyzer: LiveAnalyzer,
    sample_rate_hz: u32,
    lift_angle_deg: f64,
    requested_beat_rate_vph: Option<u32>,
}

#[wasm_bindgen]
impl TimingEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(
        sample_rate_hz: u32,
        requested_beat_rate_vph: Option<u32>,
        lift_angle_deg: f64,
    ) -> Result<TimingEngine, JsValue> {
        if !(8_000..=192_000).contains(&sample_rate_hz) {
            return Err(JsValue::from_str(
                "The microphone sample rate must be between 8 kHz and 192 kHz.",
            ));
        }
        if !lift_angle_deg.is_finite() || !(20.0..=70.0).contains(&lift_angle_deg) {
            return Err(JsValue::from_str(
                "Lift angle must be a number between 20° and 70°.",
            ));
        }
        if requested_beat_rate_vph
            .is_some_and(|vph| !(12_000..=50_000).contains(&vph))
        {
            return Err(JsValue::from_str(
                "Beat rate must be between 12,000 and 50,000 vph.",
            ));
        }

        let mut config = LiveConfig::default();
        config.analysis.bph = requested_beat_rate_vph;
        config.analysis.amplitude.lift_deg = lift_angle_deg;
        config.analysis.lift_known = true;

        Ok(TimingEngine {
            analyzer: LiveAnalyzer::new(sample_rate_hz, config),
            sample_rate_hz,
            lift_angle_deg,
            requested_beat_rate_vph,
        })
    }

    /// Feed a block of mono microphone samples. Audio stays in this browser
    /// worker and is not serialized or sent to WRISTBY's server.
    pub fn push(&mut self, samples: &[f32]) {
        self.analyzer.push_browser(samples);
    }

    /// Return the current live reading and the settings used to produce it.
    pub fn snapshot(&self, average_seconds: f64) -> Result<String, JsValue> {
        if !average_seconds.is_finite() || !(1.0..=60.0).contains(&average_seconds) {
            return Err(JsValue::from_str(
                "Average time must be between 1 and 60 seconds.",
            ));
        }
        let snapshot = TimingSnapshot {
            capture_duration_s: self.analyzer.duration_s(),
            sample_rate_hz: self.sample_rate_hz,
            reading_window_seconds: average_seconds,
            lift_angle_deg: self.lift_angle_deg,
            requested_beat_rate_vph: self.requested_beat_rate_vph,
            reading: self.analyzer.reading(average_seconds),
        };
        serde_json::to_string(&snapshot)
            .map_err(|error| JsValue::from_str(&format!("Could not format timing result: {error}")))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use timegrapher_core::synth::{generate, SynthConfig};

    #[test]
    fn browser_live_path_reads_a_synthetic_watch_without_a_desktop_worker() {
        let mut synth = SynthConfig::default();
        synth.duration_s = 50.0;
        synth.bph = 28_800;
        synth.lift_deg = 52.0;
        synth.rate_s_per_day = 6.0;
        synth.beat_error_ms = 0.4;
        synth.snr_db = 30.0;
        synth.seed = 1;
        let audio = generate(&synth, |_| 280.0, |_| 0.0);

        let mut engine = TimingEngine::new(48_000, Some(28_800), 52.0).unwrap();
        for block in audio.samples.chunks(4_800) {
            engine.push(block);
        }

        let snapshot: serde_json::Value =
            serde_json::from_str(&engine.snapshot(20.0).unwrap()).unwrap();
        let reading = &snapshot["reading"];
        assert_eq!(reading["bph"].as_u64(), Some(28_800));
        let rate = reading["rate_s_per_day"].as_f64();
        assert!(
            rate.is_some_and(|rate| (rate - 6.0).abs() < 1.0),
            "expected a rate near +6 s/day, got {:?}",
            rate
        );
        let amplitude = reading["amplitude_deg"].as_f64();
        assert!(
            amplitude.is_some_and(|amplitude| (amplitude - 280.0).abs() < 12.0),
            "expected amplitude near 280°, got {:?}",
            amplitude
        );
        let beat_error = reading["beat_error_ms"].as_f64();
        assert!(
            beat_error.is_some_and(|error| (error - 0.4).abs() < 0.3),
            "expected beat error near +0.40 ms, got {:?}",
            beat_error
        );
    }
}
