//! The time of day along a take: where each of its seconds falls on this
//! computer's clock, from when its recording began and the breaks in its
//! sound. With the Paper Strip's Time of Day on, each of its time labels
//! has the time of day under it.

use crate::breaks::{self, Break};
use chrono::{DateTime, Local, TimeZone};

/// A take's seconds on the wall clock.
#[derive(Debug, Clone, PartialEq)]
pub struct WallClock {
    /// Unix seconds at the take's second 0: when its recording began.
    pub start_unix: f64,
    /// The breaks in the take's sound, each moving the clock on by its
    /// gap ([`breaks::wall`]).
    pub breaks: Vec<Break>,
}

/// From this step between labelled lines, seconds, a label names the day
/// too: lines six hours or more apart cross midnight.
const DAY_LABEL_STEP_S: f64 = 21_600.0;

impl WallClock {
    /// A take begun at `started_utc` (as `2026-10-20T21:32:00Z`) with
    /// `breaks` (the take's seconds before each, its length in true
    /// seconds); `None` when the start can't be read.
    pub fn of_take(started_utc: &str, breaks: &[Break]) -> Option<Self> {
        let start_unix = crate::full_wind::unix_of_utc(started_utc)?;
        Some(Self::new(start_unix, breaks))
    }

    /// A take begun at Unix second `start_unix`, with `breaks`.
    pub fn new(start_unix: f64, breaks: &[Break]) -> Self {
        WallClock {
            start_unix,
            breaks: breaks.to_vec(),
        }
    }

    /// Unix seconds at the take's second `t`: its start, and `t` on true
    /// time ([`breaks::wall`]: every break before `t` added).
    pub fn unix_at(&self, t: f64) -> f64 {
        self.start_unix + breaks::wall(&self.breaks, t)
    }

    /// The time of day at the take's second `t`, for a line on a time
    /// axis whose lines are `step` seconds apart: "14:35:20", or
    /// "Thu 06:00" six hours or more apart.
    pub fn label(&self, t: f64, step: f64) -> String {
        label_in(self.unix_at(t), step, &Local)
    }

    /// The time of day at the take's second `t`, to the hundredth of a
    /// second, for the cursor: "14:35:20.45".
    pub fn label_fine(&self, t: f64) -> String {
        fine_in(self.unix_at(t), &Local)
    }
}

/// `unix` in `tz`, rounded to the second.
fn local_in<Tz: TimeZone>(unix: f64, tz: &Tz) -> Option<DateTime<Tz>> {
    let utc = DateTime::from_timestamp(unix.round() as i64, 0)?;
    Some(utc.with_timezone(tz))
}

/// [`WallClock::label`] for Unix second `unix` in `tz`.
fn label_in<Tz: TimeZone>(unix: f64, step: f64, tz: &Tz) -> String
where
    Tz::Offset: std::fmt::Display,
{
    let Some(d) = local_in(unix, tz) else {
        return String::new();
    };
    let shown = if step >= DAY_LABEL_STEP_S {
        "%a %H:%M"
    } else {
        "%H:%M:%S"
    };
    d.format(shown).to_string()
}

/// [`WallClock::label_fine`] for Unix second `unix` in `tz`.
fn fine_in<Tz: TimeZone>(unix: f64, tz: &Tz) -> String
where
    Tz::Offset: std::fmt::Display,
{
    let cs = (unix * 100.0).round();
    let whole = (cs / 100.0).floor();
    let frac = (cs - whole * 100.0) as u32;
    match local_in(whole, tz) {
        Some(d) => format!("{}.{frac:02}", d.format("%H:%M:%S")),
        None => String::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::FixedOffset;

    fn utc() -> FixedOffset {
        FixedOffset::east_opt(0).unwrap()
    }

    /// 2026-11-20 14:32:17.5 UTC, a Friday.
    const START: f64 = 1_795_185_137.5;

    #[test]
    fn a_take_reads_its_start() {
        let w = WallClock::of_take("2026-11-20T14:32:17.5Z", &[]).unwrap();
        assert!((w.start_unix - START).abs() < 1e-6);
        assert_eq!(label_in(w.unix_at(0.0), 1.0, &utc()), "14:32:18");
        assert_eq!(label_in(w.unix_at(42.5), 60.0, &utc()), "14:33:00");
        assert!(WallClock::of_take("not a time", &[]).is_none());
    }

    /// A break moves every second after it on by its length; one with a
    /// negative gap moves nothing.
    #[test]
    fn breaks_move_the_clock_on() {
        let at = |audio_s, gap_s| Break { audio_s, gap_s };
        let w = WallClock::new(1000.0, &[at(10.0, 5.0), at(30.0, -3.0), at(60.0, 30.0)]);
        assert_eq!(w.unix_at(5.0), 1005.0);
        assert_eq!(w.unix_at(20.0), 1025.0);
        assert_eq!(w.unix_at(70.0), 1105.0);
    }

    #[test]
    fn labels_suit_the_step() {
        let tz = utc();
        assert_eq!(label_in(START, 10.0, &tz), "14:32:18");
        assert_eq!(label_in(START, 300.0, &tz), "14:32:18");
        assert_eq!(label_in(START, 21_600.0, &tz), "Fri 14:32");
        let ist = FixedOffset::east_opt(5 * 3600 + 30 * 60).unwrap();
        assert_eq!(label_in(START, 60.0, &ist), "20:02:18");
        assert_eq!(fine_in(START + 0.004, &tz), "14:32:17.50");
        assert_eq!(fine_in(START + 0.497, &tz), "14:32:18.00");
    }
}
