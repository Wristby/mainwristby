//! Auto lets go of a rate the beats don't bear out (#1617).

use super::*;
use crate::synth::{generate, SynthConfig};

/// Seconds of silence, then `lure_s` of clicks at 36,000 bph (the
/// handling as a watch is put back), then an 18,000 bph watch for 40 s,
/// heard live with the rate `bph` set (`None` for Auto). Returns the
/// analyzer, every rate it was on, and its 10 s reading at the end.
fn put_back(lure_s: f64, bph: Option<u32>) -> (LiveAnalyzer, Vec<Option<u32>>, LiveReading) {
    let watch = |bph: u32, duration_s: f64, seed: u64| {
        generate(
            &SynthConfig {
                bph,
                duration_s,
                seed,
                ..Default::default()
            },
            |_| 260.0,
            |_| 0.0,
        )
    };
    let lure = watch(36_000, lure_s, 1);
    let fs = lure.sample_rate as f64;
    let mut samples = vec![0.0; (6.0 * fs) as usize];
    samples.extend_from_slice(&lure.samples);
    samples.extend_from_slice(&watch(18_000, 40.0, 2).samples);
    let cfg = LiveConfig {
        analysis: AnalysisConfig {
            bph,
            ..Default::default()
        },
        ..Default::default()
    };
    let mut live = LiveAnalyzer::new(lure.sample_rate, cfg);
    let mut rates = Vec::new();
    for chunk in samples.chunks(960) {
        live.push(chunk);
        if rates.last() != Some(&live.bph()) {
            rates.push(live.bph());
        }
    }
    let reading = live.reading(10.0);
    (live, rates, reading)
}

/// Auto, locked on to 36,000 by two seconds of clicks, reads the 18,000
/// bph watch that follows at its own rate, with readings, as Tim's
/// pocket watch put back on the stand should have been (#1617).
#[test]
fn auto_lets_go_of_twice_the_rate_after_a_put_back() {
    let (live, rates, r) = put_back(2.0, None);
    assert!(
        rates.contains(&Some(36_000)),
        "the clicks lock on first: {rates:?}"
    );
    assert_eq!(live.bph(), Some(18_000), "{rates:?}");
    assert!(r.watch_heard, "{r:?}");
    let rate = r.rate_s_per_day.expect("a rate");
    assert!((rate - 5.0).abs() < 2.0, "rate {rate} s/d");
    assert!(r.amplitude_deg.is_some(), "{r:?}");
}

/// A rate set by hand is never doubted, however the beats read.
#[test]
fn a_rate_set_by_hand_stands() {
    let (live, rates, _) = put_back(2.0, Some(36_000));
    assert_eq!(rates, vec![Some(36_000)]);
    assert_eq!(live.bph(), Some(36_000));
}

/// A watch Auto locked on to rightly keeps its rate: 30 s at standard
/// rates from 18,000 to 36,000, plain, with a 4 ms beat error, and at 20
/// and 10 dB, never lets the lock go. At 10 dB a watch may never be
/// locked on to at all; once it is, the lock stands.
#[test]
fn a_right_lock_is_never_let_go() {
    for bph in [18_000, 21_600, 28_800, 36_000] {
        for (be, snr_db) in [(0.4, 30.0), (4.0, 30.0), (0.4, 20.0), (0.4, 10.0)] {
            let audio = generate(
                &SynthConfig {
                    bph,
                    duration_s: 30.0,
                    beat_error_ms: be,
                    snr_db,
                    seed: 3,
                    ..Default::default()
                },
                |t| 280.0 - 2.0 * t,
                |_| 0.0,
            );
            let mut live = LiveAnalyzer::new(audio.sample_rate, LiveConfig::default());
            let mut rates = Vec::new();
            for chunk in audio.samples.chunks(960) {
                live.push(chunk);
                if rates.last() != Some(&live.bph()) {
                    rates.push(live.bph());
                }
            }
            let case = format!("{bph} bph, {be} ms, {snr_db} dB: {rates:?}");
            if snr_db >= 20.0 {
                assert_eq!(rates, vec![None, Some(bph)], "{case}");
            } else {
                assert!(rates.len() <= 2 && rates[0].is_none(), "{case}");
                assert!(rates.iter().flatten().all(|&r| r == bph), "{case}");
            }
        }
    }
}

/// A 28,800 bph watch heard for 40 s, then `quiet_s` of a quiet stand, then
/// `lure_s` of clicks at 72,000 bph (a stand's hum locked on to), heard
/// live with Auto and settled, as at Stop.
fn lifted(quiet_s: f64, lure_s: f64) -> (LiveAnalyzer, Vec<Option<u32>>) {
    lifted_to(40.0, quiet_s, 72_000, lure_s)
}

/// [`lifted`] with the watch heard for `watch_s`, and the clicks after
/// the quiet at `lure_bph`.
fn lifted_to(
    watch_s: f64,
    quiet_s: f64,
    lure_bph: u32,
    lure_s: f64,
) -> (LiveAnalyzer, Vec<Option<u32>>) {
    lifted_heard(watch_s, quiet_s, lure_bph, lure_s, false)
}

/// [`lifted_to`], with the figures read as a file while listening when
/// `as_file` (#1987).
fn lifted_heard(
    watch_s: f64,
    quiet_s: f64,
    lure_bph: u32,
    lure_s: f64,
    as_file: bool,
) -> (LiveAnalyzer, Vec<Option<u32>>) {
    let at = |bph: u32, duration_s: f64, seed: u64| {
        generate(
            &SynthConfig {
                bph,
                duration_s,
                seed,
                ..Default::default()
            },
            |_| 260.0,
            |_| 0.0,
        )
    };
    let watch = at(28_800, watch_s, 3);
    let fs = watch.sample_rate as f64;
    let mut samples = watch.samples.clone();
    samples.extend(vec![0.0; (quiet_s * fs) as usize]);
    if lure_s > 0.0 {
        samples.extend_from_slice(&at(lure_bph, lure_s, 4).samples);
    }
    let mut live = LiveAnalyzer::new(watch.sample_rate, LiveConfig::default());
    if as_file {
        live = live.with_figures_as_file();
    }
    let mut rates = Vec::new();
    for chunk in samples.chunks(960) {
        live.push(chunk);
        if rates.last() != Some(&live.bph()) {
            rates.push(live.bph());
        }
    }
    live.settle();
    (live, rates)
}

/// The watch lifted and the stand's noise locked on to at 72,000: at the
/// pause the rate is the watch's again, and its last reading is read at
/// it, not at the noise's (#2112: −51837.4 s/d at "Auto 72000").
#[test]
fn a_pause_puts_back_the_watchs_rate_after_a_noise_lock() {
    let (live, rates) = lifted(8.0, 5.0);
    assert!(
        rates.contains(&Some(72_000)),
        "the noise locks on: {rates:?}"
    );
    assert_eq!(live.bph(), Some(28_800), "{rates:?}");
    let t = beats::last_watch_beat_s(live.beats()).expect("the watch's run");
    assert!((39.0..=40.0).contains(&t), "{t}");
    let r = live.reading_at(t, 10.0);
    assert_eq!(r.bph, Some(28_800));
    let rate = r.rate_s_per_day.expect("a rate");
    assert!((rate - 5.0).abs() < 2.0, "rate {rate} s/d");
}

/// The watch lifted, with the figures read as a file: a noise locked on
/// to, or Auto's rate let go in the quiet, ends the read as a file (a
/// new guess is a new template). So Stop's cards, read at the watch's
/// last beat, are live's own at the rate live goes back to: never a read
/// at another rate beside it, nor Finding the Beat (Vernon and Norm on
/// #2133).
#[test]
fn a_stop_after_a_lift_reads_the_watch_at_its_rate() {
    for (quiet_s, lure_s) in [(8.0, 5.0), (12.0, 0.0)] {
        let (live, rates) = lifted_heard(40.0, quiet_s, 72_000, lure_s, true);
        let case = format!("{quiet_s} s quiet, {lure_s} s noise: {rates:?}");
        assert!(rates.len() > 2, "the lock changes: {case}");
        assert!(!live.reads_as_file(), "{case}");
        assert_eq!(live.bph(), Some(28_800), "{case}");
        let t = beats::last_watch_beat_s(live.beats()).expect("the watch's run");
        let r = live.reading_at(t, 10.0);
        assert_eq!(r.bph, Some(28_800), "{case}");
        assert!(r.rate_s_per_day.is_some(), "the cards show figures: {case}");
    }
}

/// The watch lifted and Auto's rate let go in the quiet: at the pause
/// the rate is the watch's again, so the take is read at it (#2114).
#[test]
fn a_pause_puts_back_the_watchs_rate_let_go_in_the_quiet() {
    let (live, rates) = lifted(12.0, 0.0);
    assert_eq!(rates.last(), Some(&None), "the quiet lets go: {rates:?}");
    assert_eq!(live.bph(), Some(28_800), "{rates:?}");
}

/// A watch Auto locked on to and still heard at the pause keeps its lock
/// and its template as they are.
#[test]
fn a_pause_with_the_watch_heard_changes_nothing() {
    let (mut live, _) = lifted(0.0, 0.0);
    let before = (live.bph(), live.template.clone());
    live.settle();
    assert_eq!((live.bph(), live.template.clone()), before);
}

/// A noise lock heard as a watch for longer than a piece, but not as
/// long as the watch (after a 40 s watch for 20 and 40 s, after a 90 s
/// one up to 60 s): its run is let go with it, and the cards read the
/// watch at its own rate (Norm on #2142).
#[test]
fn a_noise_lock_heard_for_a_while_never_overrules_the_watch() {
    let cases = [
        (40.0, 20.0),
        (40.0, 40.0),
        (90.0, 20.0),
        (90.0, 40.0),
        (90.0, 60.0),
    ];
    for (watch_s, lure_s) in cases {
        let what = format!("watch {watch_s} s, lure {lure_s} s");
        let (live, rates) = lifted_to(watch_s, 8.0, 72_000, lure_s);
        assert_eq!(live.bph(), Some(28_800), "{what}: {rates:?}");
        let t = beats::last_watch_beat_s(live.beats()).expect("the watch's run");
        assert!((watch_s - 1.0..=watch_s).contains(&t), "{what}: {t}");
        let rate = live.reading_at(t, 10.0).rate_s_per_day.expect("a rate");
        assert!((rate - 5.0).abs() < 2.0, "{what}: rate {rate} s/d");
    }
}

/// A second watch put on the stand and heard longer than the first keeps
/// its own rate at the pause (Norm on #2142).
#[test]
fn a_second_watch_heard_longer_keeps_its_rate() {
    let (live, rates) = lifted_to(40.0, 8.0, 21_600, 120.0);
    assert!(rates.contains(&Some(28_800)), "{rates:?}");
    assert_eq!(live.bph(), Some(21_600), "{rates:?}");
}

/// `parts` heard live with Auto, then settled as at Stop: clicks at a rate
/// for a while, or a quiet stand (`None`) for a while.
pub(super) fn heard_parts(parts: &[(Option<u32>, f64)]) -> (LiveAnalyzer, Vec<Option<u32>>) {
    let fs = SynthConfig::default().sample_rate;
    let mut samples = Vec::new();
    for (k, &(bph, duration_s)) in parts.iter().enumerate() {
        match bph {
            Some(bph) => {
                let cfg = SynthConfig {
                    bph,
                    duration_s,
                    seed: 10 + k as u64,
                    ..Default::default()
                };
                samples.extend(generate(&cfg, |_| 260.0, |_| 0.0).samples);
            }
            None => samples.extend(vec![0.0; (duration_s * f64::from(fs)) as usize]),
        }
    }
    let mut live = LiveAnalyzer::new(fs, LiveConfig::default());
    let mut rates = Vec::new();
    for chunk in samples.chunks(960) {
        live.push(chunk);
        if rates.last() != Some(&live.bph()) {
            rates.push(live.bph());
        }
    }
    live.settle();
    (live, rates)
}

/// A watch put back after a quiet is locked on to again at its own rate:
/// its time is summed over both locks, and none of its beats is let go
/// (Norm on #2142).
#[test]
fn a_watch_put_back_is_heard_over_both_its_locks() {
    let w = Some(28_800);
    // 90 s, quiet, the same watch for 30 s, quiet, a 20 s lure: every
    // beat of the watch's second run kept.
    let (live, rates) = heard_parts(&[
        (w, 90.0),
        (None, 8.0),
        (w, 30.0),
        (None, 8.0),
        (Some(72_000), 20.0),
    ]);
    assert_eq!(live.bph(), Some(28_800), "{rates:?}");
    let t = beats::last_watch_beat_s(live.beats()).expect("the watch's run");
    assert!((127.0..=128.0).contains(&t), "{t}");
    let rate = live.reading_at(t, 10.0).rate_s_per_day.expect("a rate");
    assert!((rate - 5.0).abs() < 2.0, "rate {rate} s/d");
    // 40 s and 40 s of the watch outweigh a 50 s lure.
    let (live, rates) = heard_parts(&[
        (w, 40.0),
        (None, 8.0),
        (w, 40.0),
        (None, 8.0),
        (Some(72_000), 50.0),
    ]);
    assert_eq!(live.bph(), Some(28_800), "{rates:?}");
}

/// A watch put back after a lure Auto locked on to: the lure's beats are
/// let go though the lock held at the pause is the watch's, so no
/// reading over the lure has figures (Norm on #2142).
#[test]
fn a_lure_between_two_runs_of_the_watch_is_let_go() {
    let w = Some(28_800);
    let (live, rates) = heard_parts(&[
        (w, 60.0),
        (None, 8.0),
        (Some(72_000), 20.0),
        (None, 8.0),
        (w, 40.0),
    ]);
    assert!(
        rates.contains(&Some(72_000)),
        "the lure locks on: {rates:?}"
    );
    assert_eq!(live.bph(), Some(28_800), "{rates:?}");
    let lure: Vec<f64> = live
        .beats()
        .iter()
        .map(|b| b.time)
        .filter(|t| (68.0..92.0).contains(t))
        .collect();
    assert!(
        lure.is_empty(),
        "{} beats in the lure, from {:?}",
        lure.len(),
        lure.first()
    );
    let r = live.reading_at(87.0, 10.0);
    assert!(r.rate_s_per_day.is_none(), "{r:?}");
    let end = live.beats().last().expect("beats").time;
    let rate = live.reading_at(end, 60.0).rate_s_per_day.expect("a rate");
    assert!((rate - 5.0).abs() < 2.0, "rate {rate} s/d");
}
