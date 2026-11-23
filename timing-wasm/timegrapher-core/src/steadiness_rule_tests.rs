//! One test for each rule #1984 states that no seeded run pins down
//! (Trevor's review of #2078): each sets the few fields its rule reads
//! on a real check and asserts the rule's edge.

use super::*;

/// A real check of 600 steady rate readings, 10 s apart, whose fields a
/// test then sets.
fn base() -> SeriesCheck {
    let y: Vec<f64> = (0..600).map(|i| (i as f64 * 1.7).sin()).collect();
    let mut s = check_series(
        SeriesKind::Rate,
        Grid {
            t0: 0.0,
            step: 10.0,
            y,
        },
        None,
        None,
        None,
        &[],
        &Config::default(),
    );
    s.effective_readings = 1000.0;
    s
}

/// Two stretches, the CUSUM's test passed, explaining `explained`.
fn two_levels(explained: f64) -> Changes {
    let at = |start_s: f64, end_s: f64, mean: f64| Segment {
        start_s,
        end_s,
        mean,
    };
    Changes {
        block_s: 60.0,
        block_sigma: 0.1,
        long_run_sigma: 0.1,
        segments: vec![at(0.0, 3000.0, 0.0), at(3000.0, 6000.0, 1.0)],
        explained,
        p_value: 1e-6,
        named: false,
        note: None,
    }
}

/// A trend whose line and curve both explain `explained`, at `p_value`.
fn slide(explained: f64, p_value: f64) -> Trend {
    Trend {
        per_hour: 0.5,
        explained,
        curve_explained: explained,
        start: 0.0,
        end: 1.0,
        turn: None,
        p_value,
        significant: false,
        named: false,
        note: None,
    }
}

fn cycle_at(period_s: f64) -> Cycle {
    Cycle {
        period_s,
        peak_to_peak: 2.0,
        explained: 0.3,
        source: CycleSource::PeriodSearch,
        wheel: None,
        inner_period_s: None,
        inner_explained: None,
        turns: None,
    }
}

fn search_at(period_s: f64) -> Period {
    Period {
        period_s,
        significance: 10.0,
        beyond_simulated: false,
        explained: 0.2,
        peak_to_peak: 1.0,
        timing_peak_to_peak_ms: None,
        size: 1.0,
        size_unit: "s/d",
        wheel: None,
        other_periods_s: vec![],
        harmonic_of: None,
        other_harmonic_of: vec![],
    }
}

/// Under a level change's lead, a slide within a tenth of its share is
/// the runner-up only when the slide passes its own test.
#[test]
fn a_runner_up_slide_must_pass_its_own_test() {
    let cfg = Config::default();
    let mut s = base();
    s.lead = Lead::ShiftingMean;
    s.changes = Some(two_levels(0.5));
    s.trend = Some(slide(0.48, 0.9));
    assert!(!family::slide_passes(&s, &cfg));
    assert!(family::runner_up(&s, &cfg).is_none());
    assert_eq!(words::runner_up(&s, &cfg), None);
    // The same slide passing its test is within the share, so the case
    // above fails only on the test.
    s.trend = Some(slide(0.48, 1e-9));
    assert!(family::runner_up(&s, &cfg).is_some());
    assert!(words::runner_up(&s, &cfg).is_some_and(|w| w.starts_with("A slide explains")));
}

/// Under a slide's lead, a level change named as the runner-up has its
/// corner marked on the CUSUM.
#[test]
fn a_runner_up_shift_under_a_slide_marks_its_corner() {
    let cfg = Config::default();
    let mut s = base();
    s.lead = Lead::Drifting;
    s.changes = Some(two_levels(0.48));
    s.trend = Some(slide(0.5, 1e-9));
    assert!(family::level_change(&s, &cfg).is_none());
    assert!(family::runner_up(&s, &cfg).is_some());
    let named = family::level_named(&s, &cfg).expect("the runner-up's corner");
    assert_eq!(named.segments[1].start_s, 3000.0);
}

/// A cycle within the search's resolution of its top line (period² over
/// the take, at least [`SEARCH_REFINE_SHARE`]) is that line, as the
/// headline's "also finds" counts it; one just past is another. Over these
/// 6000 s that is 1% at 60 s and 10% at 600 s.
#[test]
fn a_cycle_off_the_search_line_is_one_past_its_resolution() {
    let mut s = base();
    for (line, share) in [(60.0, SEARCH_REFINE_SHARE), (600.0, 0.1)] {
        s.period = Some(search_at(line));
        s.cycle = Some(cycle_at(line * (1.0 + 0.99 * share)));
        assert!(s.faster_than_readings().is_none());
        assert!(s.cycle_off_search().is_none(), "{line} s, inside");
        s.cycle = Some(cycle_at(line * (1.0 + 1.01 * share)));
        assert!(s.cycle_off_search().is_some(), "{line} s, past");
    }
}

/// One line of the period search is its resolution wide, period² over the
/// take and at least [`SEARCH_REFINE_SHARE`]: over these 6000 s, 1% at
/// 60 s and 10% at 600 s, either way.
#[test]
fn one_search_line_is_its_resolution_wide() {
    let s = base();
    for (line, share) in [(60.0, SEARCH_REFINE_SHARE), (600.0, 0.1)] {
        for side in [1.0, -1.0] {
            assert!(s.same_search_line(line * (1.0 + side * 0.99 * share), line));
            assert!(!s.same_search_line(line * (1.0 + side * 1.01 * share), line));
        }
    }
}

/// A fold at the search's sized line, within its resolution, states that
/// line's sine size as the headline's "also finds" writes it; at the
/// headline's own cycle, or off the line, none (Norm, #1984).
#[test]
fn a_fold_at_the_search_line_states_the_also_finds_sine_size() {
    let mut s = base();
    s.period = Some(search_at(60.0));
    s.cycle = Some(cycle_at(600.0));
    let size = SeriesKind::fmt_size_in("s/d", 1.0);
    for at in [60.0, 60.0 * 1.009] {
        assert_eq!(s.search_line_size_text(at).as_deref(), Some(size.as_str()));
    }
    assert_eq!(s.search_line_size_text(60.0 * 1.011), None);
    let also = search_also(&s).expect("the search's line");
    assert!(
        also.contains(&format!("60 s ({size} sine peak to peak)")),
        "{also}"
    );
    s.cycle = Some(cycle_at(60.0));
    assert_eq!(s.search_line_size_text(60.0), None);
}

/// A search line too fast for the readings to show is never the line a
/// cycle is called off.
#[test]
fn a_line_too_fast_for_the_readings_has_no_cycle_off_it() {
    let mut s = base();
    s.period = Some(search_at(20.0));
    s.cycle = Some(cycle_at(600.0));
    assert!(s.faster_than_readings().is_some());
    assert!(s.cycle_off_search().is_none());
}

/// Only a fold at the cycle's own period is at the cycle, so only it
/// states the cycle's size: not one at the search's other line, nor one
/// a tenth of a percent off.
#[test]
fn only_the_cycles_own_period_is_at_the_cycle() {
    let mut s = base();
    s.cycle = Some(cycle_at(600.0));
    assert!(s.is_cycle_period(600.0));
    for off in [600.0 * 1.001, 780.0, 450.0] {
        assert!(!s.is_cycle_period(off), "{off}");
    }
    s.cycle = None;
    assert!(!s.is_cycle_period(600.0));
}

/// A headline that can't tell a step from a slide names both, so
/// neither detail row says it isn't the headline's finding.
#[test]
fn a_step_or_slide_headline_names_both_detail_rows() {
    let cfg = Config::default();
    let mut s = base();
    s.lead = Lead::StepOrSlide;
    s.changes = Some(two_levels(0.48));
    s.trend = Some(slide(0.5, 1e-9));
    family::mark_named(&mut s, &cfg);
    let t = s.trend.as_ref().unwrap();
    assert!(t.named && t.note.is_none(), "{:?}", t.note);
    let c = s.changes.as_ref().unwrap();
    assert!(c.named && c.note.is_none(), "{:?}", c.note);
}

/// A step-or-slide headline names a few shifts one by one, with a verb
/// that agrees; past three, their count and the first and last, never a
/// list of a dozen times (#2120, Shane on the DayDate 36's run-down).
#[test]
fn a_step_or_slide_headline_counts_many_shifts() {
    let at = |start_s: f64| Segment {
        start_s,
        end_s: start_s + 3600.0,
        mean: start_s / 3600.0,
    };
    let headline = |hours: &[f64]| {
        let mut s = base();
        s.lead = Lead::StepOrSlide;
        let mut ch = two_levels(0.98);
        ch.segments = std::iter::once(0.0)
            .chain(hours.iter().map(|h| h * 3600.0))
            .map(at)
            .collect();
        s.changes = Some(ch);
        s.trend = Some(slide(0.25, 1e-9));
        words::step_or_slide_text(&s, "Rate")
    };
    let says = |shifts: &str| {
        format!(
            "Rate shifts level or slides, but its readings move together too much to tell which, \
             so the larger share doesn't decide it: {shifts}, a slide 24.8%."
        )
    };
    assert_eq!(headline(&[37.6]), says("a shift at 37.6 h explains 98.0%"));
    assert_eq!(
        headline(&[37.6, 55.0, 60.0]),
        says("shifts at 37.6 h, 55.0 h, 60.0 h explain 98.0%")
    );
    let twelve = headline(&[
        37.6, 55.0, 60.0, 62.8, 64.6, 65.8, 66.1, 66.3, 66.4, 66.5, 66.7, 67.0,
    ]);
    assert_eq!(
        twelve,
        says("12 shifts from 37.6 h to 67.0 h explain 97.9%")
    );
}
