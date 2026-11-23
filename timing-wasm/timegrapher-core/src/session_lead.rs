//! The lead of noise before the watch that a whole reading leaves out
//! (#844), and the one call every whole reading of a stretch reads by.
//! Part of [`crate::session`].

use super::*;

/// The least a watch must be heard for after a lead of noise for the lead
/// to be left out ([`watch_lead_s`]): two whole scatter windows.
pub const LEAD_WATCH_MIN_S: f64 = 20.0;

/// How much more than the windows after it the first window of a watch
/// after a lead may scatter ([`watch_lead_s`], #1418). Stand noise can
/// scatter under [`crate::beats::NOISE_DOUBT_FRACTION`] in a 10 s window,
/// at 0.7% of a beat at 18,000 and 19,800 bph, where the watch after it
/// scatters 0.01%. A watch's first window may scatter up to this many
/// times its later ones and still count as the watch's; past it, the
/// lead ends a window later.
pub const LEAD_SCATTER_RATIO: f64 = 4.0;

/// The least scatter, as a fraction of a beat, the windows after a lead
/// are taken to have ([`LEAD_SCATTER_RATIO`]): a clean watch's 0.01%
/// would otherwise hold its own first window to a few microseconds. The
/// line for a clean watch is then 0.08% of a beat, under the 0.34% a
/// 10 s window of noise came down to at 18,000 bph.
pub const LEAD_SCATTER_FLOOR: f64 = 0.0002;

/// Where the watch starts in a stretch that opens with a lead of noise
/// (#844), from its scatter windows (`windows`, in time order): the start
/// of the first window that is the watch's: its timing clearly regular
/// (scatter under [`crate::beats::NOISE_DOUBT_FRACTION`] of a beat), the
/// windows from it on clearly regular by their median, and its scatter
/// at most [`LEAD_SCATTER_RATIO`] times theirs, and the same of the next
/// window that doesn't overlap it (#1418), with no found jump from the
/// first's start to the second's end and every window between them on
/// the grid present, with at least
/// [`LEAD_WATCH_MIN_S`] from it to the end. `None` when the first window
/// is the watch's or no such window is found. The whole
/// stretch's median is not asked: a lead about as long as the watch can
/// put it either side of the line. Noise scatters about as much as a doubtful watch
/// (1.5 to 4% of a beat on a stand), and a watch far less, so a noise
/// lead can outweigh the watch after it in the whole stretch's verdict.
/// Where the beats jumped (`jumps`, audio seconds) between that window's
/// start and the one before's, no more than one grid step back, the watch
/// starts at the last such jump instead: there the beats stepped from the
/// noise's onto the watch's. Where windows are missing before it, a jump
/// further back is in the noise (#1423).
/// A whole file leaves the lead out; a reading of a set average (live or
/// saved) does not, so a watch heard briefly after noise there is still
/// no watch.
pub fn watch_lead_s(windows: &[WindowFit], bph: u32, jumps: &[f64]) -> Option<f64> {
    watch_lead_masked(windows, bph, jumps, &[])
}

/// [`watch_lead_s`] where the stretch holds `masked` stretches (on the
/// windows' time): a grid slot whose window would overlap one is left out
/// by the mask, not missing, so a pair across a mask is unbroken. Counted
/// as missing, a clean watch's first window, its pair across a mask, read
/// as noise, and the first window past the mask as the watch's start: a
/// position read in two masked-apart stretches lost its first (#2187).
/// A jump in masked time, or at a mask's ends, is left out with it.
fn watch_lead_masked(
    windows: &[WindowFit],
    bph: u32,
    jumps: &[f64],
    masked: &[(f64, f64)],
) -> Option<f64> {
    let step = RATE_WINDOW_STEP_S;
    let width = windows.first().map_or(0.0, |w| w.end_s - w.start_s);
    let masked_slot = |t: f64| masked.iter().any(|&(a, b)| t < b && t + width > a);
    // A jump inside a mask, or at its ends (where a reading's cuts sit),
    // is in sound the mask leaves out.
    let jumps: Vec<f64> = jumps
        .iter()
        .copied()
        .filter(|&j| !masked.iter().any(|&(a, b)| j >= a - 1e-9 && j <= b + 1e-9))
        .collect();
    let jumps = jumps.as_slice();
    // Every grid slot between two windows is there or masked.
    let joined = |a: &WindowFit, b: &WindowFit| {
        let mut t = a.start_s + step;
        while t < b.start_s - 1e-9 {
            if !masked_slot(t) {
                return false;
            }
            t += step;
        }
        true
    };
    let fraction =
        |w: &[WindowFit]| crate::beats::timing_scatter_fraction(scatter_jitter_us(w), bph);
    let clear =
        |w: &[WindowFit]| fraction(w).is_some_and(|f| f < crate::beats::NOISE_DOUBT_FRACTION);
    // A window passes when it is clearly regular and scatters about as
    // the windows after it do (#1418).
    let passes = |k: usize| {
        clear(&windows[k..=k])
            && clear(&windows[k..])
            && fraction(&windows[k..=k])
                .zip(fraction(&windows[k..]))
                .is_some_and(|(f, r)| f <= LEAD_SCATTER_RATIO * r.max(LEAD_SCATTER_FLOOR))
    };
    // It is the watch's when the next window clear of it (its confirmer)
    // passes too: one window of noise can scatter as little as a watch's,
    // two apart don't. The pair may not straddle a found jump, and every
    // window on the grid from it to its confirmer must be there: a pair
    // across the step onto the watch, or across a window missing there,
    // would set noise beside the watch's own (#1418).
    let watch = |k: usize| {
        let Some(c) =
            (k + 1..windows.len()).find(|&c| windows[c].start_s >= windows[k].end_s - 1e-9)
        else {
            return false;
        };
        let unbroken = windows[k..=c].windows(2).all(|p| joined(&p[0], &p[1]));
        let (from, to) = (windows[k].start_s, windows[c].end_s);
        unbroken && !jumps.iter().any(|&j| j > from && j <= to) && passes(k) && passes(c)
    };
    let last_end = windows.last()?.end_s;
    if watch(0) {
        return None;
    }
    for (k, w) in windows.iter().enumerate().skip(1) {
        if last_end - w.start_s < LEAD_WATCH_MIN_S - 1e-9 {
            return None;
        }
        if watch(k) {
            // Only a jump within one step of it: where the grid before it
            // is broken, a jump further back is in the noise (#1423).
            let after = windows[k - 1].start_s.max(w.start_s - RATE_WINDOW_STEP_S);
            let jump = jumps
                .iter()
                .copied()
                .filter(|&j| j > after && j <= w.start_s);
            return Some(jump.fold(w.start_s, |_, j| j));
        }
    }
    None
}

/// [`watch_lead_s`] for the stretch of `log` from `from_s` to `to_s`
/// (audio seconds), read on its scatter windows as [`measure_masked`]
/// reads them: where the watch starts after a lead of noise, as the audio
/// time of the first beat there. Every whole reading (`analyze`, and a
/// take's entries) leaves its lead out from here. The windows a mask
/// leaves out are masked, not missing ([`watch_lead_masked`], #2187).
pub fn lead_s(
    log: &BeatLog,
    clock: Option<&ClockFit>,
    breaks: &[Break],
    masked: &[(f64, f64)],
    from_s: f64,
    to_s: f64,
) -> Option<f64> {
    let to_s = to_s.min(log.duration_s).max(0.0);
    let from_s = from_s.max(0.0).min(to_s);
    let holes = Cuts::new(clock, breaks, masked);
    let map = |t: f64| holes.true_time(t);
    let in_range: Vec<Beat> = log.beats[stretch_beats(&log.beats, from_s, to_s)].to_vec();
    let beats = holes.beats(&in_range);
    let part = window_part_s(&log.amplitude_windows);
    let windows = scatter_windows(&holes, &beats, log.bph, map(from_s), map(to_s), part);
    let jumps: Vec<f64> = log.jumps.iter().map(|&j| map(j)).collect();
    let on_time: Vec<(f64, f64)> = masked.iter().map(|&(a, b)| (map(a), map(b))).collect();
    let lead_t = watch_lead_masked(&windows, log.bph, &jumps, &on_time)?;
    in_range
        .iter()
        .find(|b| map(b.time) >= lead_t - 1e-9)
        .map(|b| b.time)
}

/// [`measure_reading`] of the stretch from `from_s` to `to_s`, its lead
/// of noise before the watch left out ([`lead_s`], #844) with a caveat
/// counting the seconds from `counted_from`: the one rule by which every
/// whole reading of a stretch reads it, a take's entries
/// ([`crate::take`]), a Positions Test row and the app's whole take
/// ([`measure_together`]). A take that began on the empty stand read
/// +449 s/d over its whole take in the app, +50.5 s/d everywhere else
/// (#2177).
pub fn measure_from_lead(
    log: &BeatLog,
    clock: Option<&ClockFit>,
    breaks: &[Break],
    masked: &[(f64, f64)],
    (from_s, to_s): (f64, f64),
    read: &[(f64, f64)],
    counted_from: f64,
) -> Measurement {
    let lead = lead_s(log, clock, breaks, masked, from_s, to_s);
    let mut m = measure_reading(
        log,
        clock,
        breaks,
        masked,
        (lead.unwrap_or(from_s), to_s),
        read,
    );
    if let Some(t) = lead {
        let seconds = t - counted_from;
        crate::measure::add(
            &mut m.caveats,
            crate::measure::Caveat::LeadLeftOut { seconds },
        );
    }
    m
}
