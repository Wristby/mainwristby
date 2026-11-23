//! The headline's words for each lead, and what it also says: split
//! from steadiness.rs to keep it under 3000 lines (#1984).

use super::*;

/// The most shifts the step-or-slide headline names one by one; past it,
/// their count and the first and last (#2120).
const SHIFTS_NAMED: usize = 3;

/// The headline where neither a step nor a slide leads (Hugh, #1984):
/// both adjusted shares, the larger first.
pub(super) fn step_or_slide_text(s: &SeriesCheck, cap: &str) -> String {
    let fallback = format!("{cap} shifts level or slides.");
    let Some(ch) = s.changes.as_ref() else {
        return fallback;
    };
    let Some((slide, steps)) = family::adjusted_shares(s, ch) else {
        return fallback;
    };
    let at: Vec<String> = ch
        .segments
        .iter()
        .skip(1)
        .map(|g| every_text(g.start_s))
        .collect();
    // Each shift named for a few, past that their count and the first and
    // last (#2120), with its verb agreeing.
    let (shift, explain) = match at.as_slice() {
        [one] => (format!("a shift at {one}"), "explains"),
        [first, .., last] if at.len() > SHIFTS_NAMED => (
            format!("{} shifts from {first} to {last}", at.len()),
            "explain",
        ),
        _ => (format!("shifts at {}", at.join(", ")), "explain"),
    };
    let pct = |v: f64| format!("{:.1}%", 100.0 * v);
    let (first, second) = if slide >= steps {
        (
            format!("a slide explains {}", pct(slide)),
            format!("{shift} {}", pct(steps)),
        )
    } else {
        (
            format!("{shift} {explain} {}", pct(steps)),
            format!("a slide {}", pct(slide)),
        )
    };
    format!(
        "{cap} shifts level or slides, but its readings move together too much to tell which, so the larger share doesn't decide it: {first}, {second}."
    )
}

/// The other of a slide and a level change, when its own test names it
/// too, the lead went to the first, and it explains within a tenth as
/// much ([`family::runner_up`]): said with both adjusted shares, so
/// that a step the plot shows under a slide's headline, or a slide under a
/// step's, is accounted for (Norm, #1984).
pub(super) fn runner_up(s: &SeriesCheck, cfg: &Config) -> Option<String> {
    let (ch, second, first) = family::runner_up(s, cfg)?;
    let pct = |v: f64| format!("{:.1}%", 100.0 * v);
    let what = if s.lead == Lead::Drifting {
        let at: Vec<String> = ch
            .segments
            .iter()
            .skip(1)
            .map(|g| every_text(g.start_s))
            .collect();
        if at.len() == 1 {
            format!("A shift at {} explains", at[0])
        } else {
            format!("Shifts at {} explain", at.join(", "))
        }
    } else {
        "A slide explains".to_string()
    };
    Some(format!(
        "{what} about as much ({} against {}).",
        pct(second),
        pct(first)
    ))
}

pub(super) fn every_text(sec: f64) -> String {
    if sec >= 5400.0 {
        format!("{:.1} h", sec / 3600.0)
    } else if sec >= 120.0 {
        format!("{:.0} min", sec / 60.0)
    } else {
        format!("{sec:.0} s")
    }
}

/// The level shifts in the words both the headline and the one-line
/// summary use, so a plot's title says what its text says: every level
/// for a few, past that the range and the ends, each level left to the
/// table (#734, Walter's walk of #1096).
pub(super) fn shifts_text(s: &SeriesCheck) -> String {
    let k = s.series;
    let ch = s.changes.as_ref().unwrap();
    let n = ch.segments.len() - 1;
    let times = crate::measure::plural(n);
    if ch.segments.len() <= 4 {
        let means: Vec<String> = ch.segments.iter().map(|g| k.fmt(g.mean)).collect();
        return format!("shifts level {n} time{times}: {}", means.join(", then "));
    }
    let lo = ch
        .segments
        .iter()
        .map(|g| g.mean)
        .fold(f64::INFINITY, f64::min);
    let hi = ch
        .segments
        .iter()
        .map(|g| g.mean)
        .fold(f64::NEG_INFINITY, f64::max);
    format!(
        "shifts level {n} time{times}, between {} and {}: {} at the start, {} at the end",
        k.fmt(lo),
        k.fmt(hi),
        k.fmt(ch.segments[0].mean),
        k.fmt(ch.segments[n].mean)
    )
}

#[expect(
    clippy::too_many_lines,
    reason = "over the limit before it was set; split it (architecture guide, section 12)"
)]
pub(super) fn lead_text(s: &SeriesCheck, mean: f64) -> String {
    let k = s.series;
    let name = k.name();
    let cap = {
        let mut c = name.chars();
        c.next()
            .map_or(String::new(), |f| f.to_uppercase().chain(c).collect())
    };
    let every = every_text;
    let step = every(s.step_s);
    // Without a short-term SD the clause is left out, not written "±0".
    let spread = s.short_term_sd.map_or(String::new(), |v| {
        format!(", ±{} from one reading to the next", k.fmt_pm(v))
    });
    match s.lead {
        // check_series states the too-short case, with its rule, before
        // the tests run.
        Lead::TooShort => s.headline.clone(),
        Lead::Steady => match fast_line(s) {
            // A period-search line the headline adds is a cycle: say
            // nothing of cycles here.
            None if search_also(s).is_some() => format!(
                "{cap}: {} {step} readings, median {}{}; no level change, trend or correlation between readings detected.",
                s.readings,
                k.fmt(s.median.unwrap_or(mean)),
                spread
            ),
            None => format!(
                "{cap}: {} {step} readings, median {}{}; no cycle, level change, trend or correlation between readings detected.",
                s.readings,
                k.fmt(s.median.unwrap_or(mean)),
                spread
            ),
            Some(line) => format!(
                "{cap}: {} {step} readings, median {}{}; no level change, trend or correlation between readings detected; {line}.",
                s.readings,
                k.fmt(s.median.unwrap_or(mean)),
                spread
            ),
        },
                Lead::Periodic => match (&s.cycle, &s.two_state) {
            (Some(p), _) => format!(
                "{cap} repeats every {}{}{}, {} peak to peak.",
                every(p.period_s),
                p.wheel
                    .as_ref()
                    .map_or(String::new(), |w| format!(" (the {w})")),
                inner_text(p),
                k.fmt_size(p.peak_to_peak)
            ),
            (None, Some(t)) => format!(
                "{cap} drops to a low level and back on a cycle{}.",
                t.period_s
                    .map_or(String::new(), |p| format!(" of about {}", every(p)))
            ),
            _ => format!("{cap} repeats on a cycle."),
        },
        Lead::TwoStates | Lead::Measurement => {
            let t = s.two_state.as_ref().unwrap();
            let base = format!(
                "{cap} switches between two levels, {} and {}, about every {}",
                k.fmt(t.low),
                k.fmt(t.high),
                every(t.switch_every_s)
            );
            if s.lead == Lead::Measurement {
                let why = match lone_side(t) {
                    Some(side) => clusters(side),
                    None if t.unlock_jump => "the beat error from the unlock jumps between the levels; the one from the drop does not".to_string(),
                    None => {
                        let tick = t.tick_change.unwrap_or(0.0).abs();
                        let tock = t.tock_change.unwrap_or(0.0).abs();
                        let (a, b) = if tick > tock { ("Tick", "Tock") } else { ("Tock", "Tick") };
                        format!("the {a} side changes between the levels; the {b} side does not")
                    }
                };
                format!("{base}; {why}.")
            } else {
                format!("{base}.")
            }
        }
        Lead::ShiftingMean => format!("{cap} {}.", shifts_text(s)),
        Lead::StepOrSlide => step_or_slide_text(s, &cap),
        Lead::Drifting => {
            let t = s.trend.as_ref().unwrap();
            if let Some((at, v)) = t.turn.filter(|_| t.curve_explained > t.explained + 0.05) {
                // The curve's turn is its top or bottom, never a change
                // at that time (Norm, #1984).
                let side = if v >= t.start.max(t.end) {
                    "highest"
                } else {
                    "lowest"
                };
                return format!(
                    "{cap} changes slowly along a curve: from {}, {side} at {} ({}), to {} at the end.",
                    k.fmt(t.start),
                    every(at),
                    k.fmt(v),
                    k.fmt(t.end)
                );
            }
            format!(
                "{cap} slides from {} to {} ({} per hour).",
                k.fmt(t.start),
                k.fmt(t.end),
                k.fmt_per_hour(t.per_hour)
            )
        }
        Lead::Wandering => {
            let mut parts = Vec::new();
            if let Some(a) = &s.autocorrelation {
                parts.push(format!(
                    "lag-1 correlation {:.2}, Ljung–Box p {}{}",
                    a.r.get(1).copied().unwrap_or(f64::NAN),
                    p_text(a.p_value),
                    a.memory_s
                        .map_or(String::new(), |m| format!(", correlated for about {}", every(m)))
                ));
            }
            if let Some(a) = s.allan.as_ref().filter(|a| a.max_excess >= 2.0) {
                parts.push(format!(
                    "Allan deviation up to {:.1}× what independent readings give",
                    a.max_excess
                ));
            }
            match fast_line(s) {
                None if search_also(s).is_some() => format!(
                    "Successive {step} {name} readings are correlated ({}); no level change or trend detected.",
                    parts.join("; ")
                ),
                None => format!(
                    "Successive {step} {name} readings are correlated ({}); no cycle, level change or trend detected.",
                    parts.join("; ")
                ),
                Some(line) => format!(
                    "Successive {step} {name} readings are correlated ({}); no level change or trend detected; {line}.",
                    parts.join("; ")
                ),
            }
        }
    }
}
