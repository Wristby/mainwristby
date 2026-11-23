//! The Positions Test's position line (#1729, Hugh's design approved by
//! Peter 2026-11-14): the value is the axis, and each position is a dot
//! where its figure falls, on a lane of its own. The lanes sit in two
//! groups, Horizontal then Vertical, each in the table's order. The three
//! averages (every position, the vertical ones and the horizontal ones)
//! are named reference lines. On a later state of wind, each position's
//! full-wind figure is given beside it, drawn hollow with an arrow to this
//! test's.
//!
//! What to draw and what it says, never how: the app, the CLI's report and
//! the MCP view each draw this one model. No position is ever joined to
//! another (Norm's chart rule 4), and the averages are reference lines, not
//! a fit.

use serde::Serialize;

use crate::chart_scale;
use crate::session::{
    group_mean, has_mean, sourced_indices_over, Position, PositionGroup, PositionValue,
    SourcedFigures, StateIndices,
};
use crate::steadiness::SeriesKind;

/// The key's words for a comparison: this test's dots are solid, the
/// full-wind test's hollow.
pub const THIS_TEST: &str = "This test";
pub const FULL_WIND_TEST: &str = "Full wind test";

/// The name of the line at the mean of every position.
pub const AVERAGE: &str = "Average";

/// One position's lane.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Lane {
    /// The position's common code: "DU", "CU", "1H30".
    pub position: &'static str,
    pub group: PositionGroup,
    /// Its name as the table writes it: "Crown Up (CU, 3H)".
    pub name: String,
    /// This test's figure, `None` where it has none.
    pub value: Option<f64>,
    /// The full-wind test's figure at this position, on a later state.
    pub full_wind: Option<f64>,
    /// `value` and `full_wind` as written beside a chart's title and in a
    /// table, with the unit and a true minus: "+10.2 s/d", "−0.5 s/d".
    pub text: Option<String>,
    pub full_wind_text: Option<String>,
    /// `value` bare, as a table cell under its column's unit writes it:
    /// "+10.2", "−0.5" (the 11-04 units rule).
    pub figure: Option<String>,
    /// The hover: the name and this test's figure with its unit,
    /// "Crown Up (CU, 3H) +10.2 s/d", and the full-wind figure after it
    /// where there is one.
    pub hover: String,
    /// The hover without the name, as a chart beside the first writes
    /// it: "328° (Full wind test 302°)" (Hugh on #1785), or "–" where
    /// this test has no figure.
    pub figures: String,
}

/// Which of the three averages a line is.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum AverageOf {
    All,
    Vertical,
    Horizontal,
}

/// A grey dashed reference line at one of this test's averages.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct AverageLine {
    pub of: AverageOf,
    /// Its name above the plot: "Average", "Vertical", "Horizontal".
    pub name: &'static str,
    pub value: f64,
    /// `value` with its unit and a true minus: "+6.6 s/d".
    pub text: String,
    /// `value` bare, for a table cell: "+6.6".
    pub figure: String,
    /// "Vertical +6.6 s/d".
    pub hover: String,
}

/// One measure's position line for one state of wind.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct PositionLine {
    pub series: SeriesKind,
    /// The chart's name: "Rate".
    pub title: &'static str,
    /// The unit under the axis: "s/d", "°", "ms".
    pub unit: &'static str,
    /// Horizontal lanes first, then vertical, each in the table's order.
    pub lanes: Vec<Lane>,
    /// The averages that exist, in the order Average, Vertical,
    /// Horizontal.
    pub averages: Vec<AverageLine>,
    /// The key, on a later state only: what the solid and the hollow dots
    /// are.
    pub key: Option<[&'static str; 2]>,
    /// The least and greatest value drawn (dots of both tests and the
    /// averages), for the axis to hold; `None` with nothing to draw.
    pub extent: Option<[f64; 2]>,
    /// The value axis every surface draws: the extent padded
    /// ([`chart_scale::data_range`]), a beat error's from no lower than 0,
    /// and snapped to round ends ([`chart_scale::round_ends`]), as
    /// `[lo, hi, step]`.
    pub axis: Option<[f64; 3]>,
}

/// The figure a position's lane shows for `kind`.
fn figure(v: &PositionValue, kind: SeriesKind) -> Option<f64> {
    match kind {
        SeriesKind::Rate => v.rate_s_per_day,
        SeriesKind::Amplitude => v.amplitude_deg,
        SeriesKind::BeatError => v.beat_error_ms,
    }
    .filter(|x| x.is_finite())
}

/// A figure with its unit as a screen writes it, a negative one with a
/// true minus: "−0.5 s/d".
pub fn screen(kind: SeriesKind, v: f64) -> String {
    crate::figure_text::true_minus(&kind.fmt(v))
}

/// A measure's value axis, [lo, hi, step], over `values`: their range
/// rounded to whole steps, a beat error's from no lower than 0, since it
/// is a size (Walter on #1742). The step is never finer than the figure
/// it frames, 0.1 s/d, 1° or 0.01 ms (#1749): one position, or several
/// this close, would else step by hundredths of a figure read to tenths.
/// The one axis rule for every chart of a measure's values. None for no
/// values.
pub fn value_axis(kind: SeriesKind, values: &[f64]) -> Option<[f64; 3]> {
    let (lo, hi) = chart_scale::data_range(values)?;
    // Never narrower than a few of the figure, about the values' middle:
    // one position, or several this close, would else span tenths and
    // re-centre at each re-read (#1953, as #1943's poise dial).
    let least = least_span(kind);
    let (lo, hi) = if hi - lo < least {
        let mid = (lo + hi) / 2.0;
        (mid - least / 2.0, mid + least / 2.0)
    } else {
        (lo, hi)
    };
    // A beat error is a size: its axis starts at 0 at the lowest, and a
    // widened span moves up off 0 whole rather than being cut (Norm).
    let (lo, hi) = match kind {
        SeriesKind::BeatError if lo < 0.0 => (0.0, hi - lo),
        _ => (lo, hi),
    };
    let finest = 10f64.powi(-(kind.digits() as i32));
    let (lo, hi, step) = match chart_scale::round_ends(lo, hi) {
        (_, _, step) if step < finest => chart_scale::round_ends_at(lo, hi, finest),
        ends => ends,
    };
    Some([lo, hi, step])
}

/// The Average, Vertical and Horizontal lines of `state`'s `kind`, each
/// where its group has a mean ([`has_mean`]).
fn average_lines(state: &StateIndices, kind: SeriesKind) -> Vec<AverageLine> {
    [
        (AverageOf::All, AVERAGE, None),
        (
            AverageOf::Vertical,
            PositionGroup::Vertical.name(),
            Some(PositionGroup::Vertical),
        ),
        (
            AverageOf::Horizontal,
            PositionGroup::Horizontal.name(),
            Some(PositionGroup::Horizontal),
        ),
    ]
    .into_iter()
    // A mean of one position is that position: no line until two are read
    // (#1959, Walter on #2013).
    .filter(|&(_, _, group)| {
        has_mean(
            state
                .positions
                .iter()
                .filter(|v| group.is_none_or(|g| PositionGroup::of(v.position) == g))
                .map(|v| figure(v, kind)),
        )
    })
    .filter_map(|(of, name, group)| {
        let value = group_mean(&state.positions, kind, group).filter(|x| x.is_finite())?;
        let text = screen(kind, value);
        Some(AverageLine {
            of,
            name,
            value,
            hover: format!("{name} {text}"),
            figure: bare(kind, value),
            text,
        })
    })
    .collect()
}

/// The least span of a measure's value axis: 10 s/d, 10° or 0.2 ms, so a
/// lone figure sits on a scale of some seconds, degrees or tenths of a
/// millisecond, as a timegrapher's chart does (#1953).
pub fn least_span(kind: SeriesKind) -> f64 {
    match kind {
        SeriesKind::Rate => LEAST_SPAN_S_PER_DAY,
        SeriesKind::Amplitude => LEAST_SPAN_DEG,
        SeriesKind::BeatError => LEAST_SPAN_MS,
    }
}

/// [`least_span`] of a rate, s/d.
pub const LEAST_SPAN_S_PER_DAY: f64 = 10.0;
/// [`least_span`] of an amplitude, degrees.
pub const LEAST_SPAN_DEG: f64 = 10.0;
/// [`least_span`] of a beat error, ms.
pub const LEAST_SPAN_MS: f64 = 0.2;

/// A figure bare, as a table cell under its column's unit writes it, a
/// negative one with a true minus: "−0.5".
pub fn bare(kind: SeriesKind, v: f64) -> String {
    crate::figure_text::true_minus(&kind.number(v))
}

/// The unit as it follows a chart's axis: degrees as "°".
pub fn unit_of(kind: SeriesKind) -> &'static str {
    match kind {
        SeriesKind::Amplitude => "°",
        k => k.unit(),
    }
}

/// `state`'s position line for `kind`, with `full_wind`'s figures beside
/// it when it is a later state of wind compared with the full-wind test.
pub fn position_line(
    state: &StateIndices,
    full_wind: Option<&StateIndices>,
    kind: SeriesKind,
) -> PositionLine {
    position_line_over(state, state, full_wind, kind)
}

/// [`position_line`] with a lane for each position `every` measured, the
/// ten where a session took them, while the averages stay over `state`'s
/// positions, the six (Peter, 11-12).
pub fn position_line_over(
    state: &StateIndices,
    every: &StateIndices,
    full_wind: Option<&StateIndices>,
    kind: SeriesKind,
) -> PositionLine {
    let mut lanes = Vec::new();
    for group in [PositionGroup::Horizontal, PositionGroup::Vertical] {
        for v in every
            .positions
            .iter()
            .filter(|v| PositionGroup::of(v.position) == group)
        {
            let value = figure(v, kind);
            let earlier = full_wind.and_then(|f| {
                f.positions
                    .iter()
                    .find(|w| w.position == v.position)
                    .and_then(|w| figure(w, kind))
            });
            let name = v.position.display_label();
            let text = value.map(|x| screen(kind, x));
            let full_wind_text = earlier.map(|e| screen(kind, e));
            let full = full_wind_text
                .as_ref()
                .map(|e| format!(" ({FULL_WIND_TEST} {e})"))
                .unwrap_or_default();
            let hover = match &text {
                Some(t) => format!("{name} {t}{full}"),
                None => format!("{name}{full}"),
            };
            let figures = match &text {
                Some(t) => format!("{t}{full}"),
                None => format!("\u{2013}{full}"),
            };
            lanes.push(Lane {
                position: v.position.common(),
                group,
                name,
                value,
                full_wind: earlier,
                text,
                full_wind_text,
                figure: value.map(|x| bare(kind, x)),
                hover,
                figures,
            });
        }
    }
    let averages = average_lines(state, kind);
    let drawn: Vec<f64> = lanes
        .iter()
        .flat_map(|l| [l.value, l.full_wind])
        .flatten()
        .chain(averages.iter().map(|a| a.value))
        .collect();
    let extent = (!drawn.is_empty()).then(|| {
        [
            drawn.iter().copied().fold(f64::INFINITY, f64::min),
            drawn.iter().copied().fold(f64::NEG_INFINITY, f64::max),
        ]
    });
    let axis = extent.and_then(|e| value_axis(kind, &e));
    let compared = lanes.iter().any(|l| l.full_wind.is_some());
    PositionLine {
        series: kind,
        title: kind.title(),
        unit: unit_of(kind),
        lanes,
        averages,
        key: compared.then_some([THIS_TEST, FULL_WIND_TEST]),
        extent,
        axis,
    }
}

/// One state of wind's three position lines.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct StateLines {
    pub wind_h: Option<f64>,
    /// The state's heading: "Full wind", "24 h after winding", "Wind not
    /// given" ([`crate::reading_text::wind_state_title`]).
    pub name: String,
    pub rate: PositionLine,
    pub amplitude: PositionLine,
    pub beat_error: PositionLine,
}

/// The position lines of each state of wind, fullest first as `states`
/// are: a later state whose wind was given is compared with the fullest
/// one, when that is the full-wind test (0 h).
pub fn state_lines(states: &[StateIndices]) -> Vec<StateLines> {
    state_lines_over(states, states)
}

/// [`state_lines`] with a lane for each position in `every`, the same
/// states over every position measured ([`Position::TEN`]), the averages
/// over `states`' own.
///
/// [`Position::TEN`]: crate::session::Position::TEN
pub fn state_lines_over(states: &[StateIndices], every: &[StateIndices]) -> Vec<StateLines> {
    let full = every.first().filter(|s| s.wind_h == Some(0.0));
    states
        .iter()
        .zip(every)
        .enumerate()
        .map(|(i, (s, e))| {
            let earlier = full.filter(|_| i > 0 && s.wind_h.is_some_and(|h| h > 0.0));
            let line = |kind| position_line_over(s, e, earlier, kind);
            StateLines {
                wind_h: s.wind_h,
                name: crate::reading_text::wind_state_title(s.wind_h),
                rate: line(SeriesKind::Rate),
                amplitude: line(SeriesKind::Amplitude),
                beat_error: line(SeriesKind::BeatError),
            }
        })
        .collect()
}

/// One Positions Test's position lines (#1729): `figures` over the six
/// for the averages, with `more` (the 45° stops) given lanes too, and
/// the full-wind test `full` compared when this test's wind is known
/// and later than full ([`state_lines_over`]'s rule, which the session
/// report draws by too). The amplitudes are compared only where `lifts`,
/// full wind's then this test's, are the same and recorded (#1923): the
/// table under the lines says why not, the one place it is said.
pub fn test_lines(
    wind_h: Option<f64>,
    figures: &[SourcedFigures],
    more: &[SourcedFigures],
    full: Option<&[SourcedFigures]>,
    lifts: [Option<f64>; 2],
) -> StateLines {
    let every: Vec<SourcedFigures> = figures
        .iter()
        .chain(more.iter().filter(|m| figures.iter().all(|f| f.0 != m.0)))
        .copied()
        .collect();
    let over = |w, f: &[SourcedFigures], p: &[Position]| sourced_indices_over(w, f, p);
    let (mut states, mut lanes) = (Vec::new(), Vec::new());
    if let Some(f) = full {
        states.push(over(Some(0.0), f, &Position::ALL));
        lanes.push(over(Some(0.0), f, &Position::TEN));
    }
    states.push(over(wind_h, figures, &Position::ALL));
    lanes.push(over(wind_h, &every, &Position::TEN));
    let mut lines = state_lines_over(&states, &lanes)
        .pop()
        .expect("this test's state is always there");
    let compared = lines.amplitude.key.is_some();
    if compared && crate::session::LiftGap::of(lifts).is_some() {
        let (s, e) = (states.last(), lanes.last());
        let this = "this test's state is always there";
        lines.amplitude =
            position_line_over(s.expect(this), e.expect(this), None, SeriesKind::Amplitude);
    }
    lines
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::session::{sourced_indices, BeatErrorSource};

    fn figures(rates: &[(Position, f64, f64)]) -> Vec<SourcedFigures> {
        rates
            .iter()
            .map(|&(p, r, a)| {
                (
                    p,
                    Some(r),
                    Some(a),
                    Some(0.2),
                    Some(BeatErrorSource::Unlock),
                )
            })
            .collect()
    }

    fn six(shift: f64) -> Vec<SourcedFigures> {
        figures(&[
            (Position::CH, 2.0 + shift, 300.0),
            (Position::CB, 4.0 + shift, 296.0),
            (Position::H3, 10.0 + shift, 270.0),
            (Position::H6, 6.0 + shift, 268.0),
            (Position::H9, 5.0 + shift, 266.0),
            (Position::H12, 7.0 + shift, 272.0),
        ])
    }

    /// Lanes run Horizontal then Vertical in the table's order; the three
    /// averages are the table's own; no key without a comparison.
    #[test]
    fn a_state_gives_its_lanes_and_averages() {
        let st = sourced_indices(Some(0.0), &six(0.0));
        let line = position_line(&st, None, SeriesKind::Rate);
        let order: Vec<&str> = line.lanes.iter().map(|l| l.position).collect();
        assert_eq!(order, ["DU", "DD", "CD", "CL", "CU", "CR"]);
        assert_eq!(line.lanes[2].group, PositionGroup::Vertical);
        assert_eq!(line.lanes[4].hover, "Crown Up (CU, 3H) +10.0 s/d");
        assert_eq!(line.lanes[4].text.as_deref(), Some("+10.0 s/d"));
        assert_eq!(line.averages[1].text, "+7.0 s/d");
        let avg: Vec<(&str, f64)> = line.averages.iter().map(|a| (a.name, a.value)).collect();
        assert_eq!(
            avg,
            [
                ("Average", 34.0 / 6.0),
                ("Vertical", 7.0),
                ("Horizontal", 3.0)
            ]
        );
        // The table's figures, from the one place averages are taken.
        assert_eq!(Some(avg[0].1), st.x);
        assert_eq!(Some(avg[1].1), st.xv);
        assert_eq!(Some(avg[2].1), st.xh);
        assert_eq!(line.key, None);
        assert_eq!(line.extent, Some([2.0, 10.0]));
        assert_eq!(line.axis, Some([0.0, 12.0, 2.0]));
        let amp = position_line(&st, None, SeriesKind::Amplitude);
        assert_eq!(amp.unit, "°");
        assert_eq!(Some(amp.averages[0].value), st.amplitude_mean);
        let be = position_line(&st, None, SeriesKind::BeatError);
        assert_eq!(Some(be.averages[0].value), st.beat_error_mean);
        // A beat error is a size: its padded axis stops at 0.
        let near: Vec<SourcedFigures> = [(Position::CH, 0.01), (Position::H3, 0.4)]
            .iter()
            .map(|&(p, b)| {
                (
                    p,
                    Some(1.0),
                    Some(270.0),
                    Some(b),
                    Some(BeatErrorSource::Unlock),
                )
            })
            .collect();
        let be = position_line(
            &sourced_indices(Some(0.0), &near),
            None,
            SeriesKind::BeatError,
        );
        assert_eq!(be.axis.map(|a| a[0]), Some(0.0), "{:?}", be.axis);
    }

    /// A 24 h state is set against the full-wind test: each lane carries
    /// its full-wind figure, the key names both, and the extent holds both.
    #[test]
    fn a_later_state_carries_the_full_wind_figures() {
        let states = vec![
            sourced_indices(Some(0.0), &six(0.0)),
            sourced_indices(Some(24.0), &six(-3.0)),
        ];
        let lines = state_lines(&states);
        assert_eq!(lines[0].rate.key, None);
        assert_eq!(lines[0].name, "Full wind");
        assert_eq!(lines[1].name, "24 h after winding");
        let later = &lines[1].rate;
        assert_eq!(later.key, Some([THIS_TEST, FULL_WIND_TEST]));
        assert_eq!(later.lanes[0].value, Some(-1.0));
        assert_eq!(later.lanes[0].full_wind, Some(2.0));
        assert_eq!(later.extent, Some([-1.0, 10.0]));
        assert!(later.lanes[0].hover.ends_with("(Full wind test +2.0 s/d)"));
        assert_eq!(later.lanes[0].full_wind_text.as_deref(), Some("+2.0 s/d"));
        assert_eq!(later.lanes[0].text.as_deref(), Some("\u{2212}1.0 s/d"));
        assert!(later.lanes[0]
            .hover
            .starts_with("Dial Up (DU) \u{2212}1.0 s/d"));
        // No full-wind test, no comparison.
        let alone = state_lines(&states[1..]);
        assert_eq!(alone[0].rate.key, None);
    }

    /// One position, or several this close, steps its axis no finer
    /// than the figure: 0.1 s/d, 1°, 0.01 ms (Walter on #1747, #1749:
    /// −13.06 to −12.94 s/d in 0.02 steps for a lone −13.0).
    #[test]
    fn a_lone_figures_axis_steps_no_finer_than_the_figure() {
        let cases = [
            (SeriesKind::Rate, vec![-13.0], 0.1),
            (SeriesKind::Rate, vec![-13.01, -12.99], 0.1),
            (SeriesKind::Amplitude, vec![221.8], 1.0),
            (SeriesKind::BeatError, vec![0.22], 0.01),
        ];
        for (kind, values, finest) in cases {
            let [lo, hi, step] = value_axis(kind, &values).expect("an axis");
            assert!(step >= finest - 1e-12, "{kind:?} {values:?}: {step}");
            assert!(values.iter().all(|v| (lo..=hi).contains(v)), "{lo} to {hi}");
            assert!(hi > lo, "{lo} to {hi}");
            // Whole steps from end to end.
            let n = (hi - lo) / step;
            assert!((n - n.round()).abs() < 1e-6, "{lo} to {hi} by {step}");
        }
        // A wide spread keeps its own, coarser step.
        let [_, _, step] = value_axis(SeriesKind::Rate, &[-10.0, 12.0]).expect("an axis");
        assert!(step >= 5.0, "{step}");
    }

    /// One position's axis spans at least a few of the figure about it,
    /// and holds as its figure drifts by tenths at each re-read
    /// (#1953, the v1.1 shakedown: +17.4 to +17.6 s/d, then +17.8 to
    /// +18.0, then +17.7 to +17.9).
    #[test]
    fn a_lone_figures_axis_is_some_figures_wide_and_holds_still() {
        for (kind, v, nudge) in [
            (SeriesKind::Rate, 17.5, 0.1),
            (SeriesKind::Amplitude, 246.0, 1.0),
            (SeriesKind::BeatError, 0.28, 0.01),
        ] {
            let [lo, hi, step] = value_axis(kind, &[v]).expect("an axis");
            assert!(hi - lo >= least_span(kind) - 1e-9, "{kind:?}: {lo} to {hi}");
            // About the figure, not from one end of it.
            assert!(
                ((lo + hi) / 2.0 - v).abs() <= step + 1e-9,
                "{kind:?}: {lo} to {hi}"
            );
            // Ten re-reads drifting by a figure's tenth each: the axis
            // moves at most once, where its middle crosses a step, not
            // at each (as the 0.2 s/d one did).
            let mut axes: Vec<[f64; 2]> = (0..10)
                .map(|k| value_axis(kind, &[v + nudge * f64::from(k) / 10.0]).expect("an axis"))
                .map(|a| [a[0], a[1]])
                .collect();
            axes.dedup();
            assert!(axes.len() <= 2, "{kind:?}: {axes:?}");
        }
        // A regulated watch's rate either side of 0 keeps one axis about
        // it: no jump of the span from one side to the other (Norm).
        for v in [-0.05, 0.05] {
            let [lo, hi, _] = value_axis(SeriesKind::Rate, &[v]).expect("an axis");
            assert!(
                lo < 0.0 && hi > 0.0 && (lo + hi).abs() <= 2.0,
                "{v}: {lo} to {hi}"
            );
        }
        // A beat error near 0 moves its span up off 0, never cut narrower.
        let [lo, hi, _] = value_axis(SeriesKind::BeatError, &[0.05]).expect("an axis");
        assert!(lo >= 0.0 && hi - lo >= LEAST_SPAN_MS - 1e-9, "{lo} to {hi}");
    }

    /// One position draws no Average, Vertical or Horizontal line: a mean
    /// of one is that position; two Horizontal draw Average and Horizontal
    /// but not Vertical (#1959, Walter on #2013).
    #[test]
    fn an_average_needs_two_positions() {
        let one = figures(&[(Position::CH, 2.0, 300.0)]);
        let lines = state_lines(&[sourced_indices(Some(0.0), &one)]);
        assert!(
            lines[0].rate.averages.is_empty(),
            "{:?}",
            lines[0].rate.averages
        );
        let two = figures(&[(Position::CH, 2.0, 300.0), (Position::CB, 4.0, 296.0)]);
        let lines = state_lines(&[sourced_indices(Some(0.0), &two)]);
        let names: Vec<&str> = lines[0].rate.averages.iter().map(|a| a.name).collect();
        assert_eq!(names, [AVERAGE, PositionGroup::Horizontal.name()]);
    }

    /// A session of ten positions draws a lane for each of the ten, its
    /// averages over the six (Peter, 11-12).
    #[test]
    fn ten_positions_draw_ten_lanes_and_average_the_six() {
        let mut ten = six(0.0);
        ten.push((Position::H1h30, Some(100.0), Some(250.0), None, None));
        let six_only = vec![sourced_indices(Some(0.0), &ten)];
        let every = vec![sourced_indices_over(Some(0.0), &ten, &Position::TEN)];
        let lines = state_lines_over(&six_only, &every);
        assert_eq!(lines[0].rate.lanes.len(), 7);
        assert!(lines[0].rate.lanes.iter().any(|l| l.value == Some(100.0)));
        assert_eq!(
            lines[0].rate.averages,
            state_lines(&six_only)[0].rate.averages
        );
    }

    /// A Positions Test's lines (#1729) are the session report's rule: the
    /// 45° stops get lanes but stay out of the averages, and the full-wind
    /// test is compared only when this test's wind is known and later.
    #[test]
    fn a_test_draws_by_the_session_rule() {
        let mut more = six(9.0);
        more.push((Position::H1h30, Some(100.0), Some(250.0), None, None));
        let late = test_lines(
            Some(24.0),
            &six(-3.0),
            &more,
            Some(&six(0.0)),
            [Some(52.0); 2],
        );
        assert_eq!(late.rate.lanes.len(), 7);
        assert_eq!(
            late.rate.lanes[0].value,
            Some(-1.0),
            "the test's own figure"
        );
        assert_eq!(late.rate.lanes[0].full_wind, Some(2.0));
        assert_eq!(late.rate.key, Some([THIS_TEST, FULL_WIND_TEST]));
        assert_eq!(
            late.amplitude.lanes[0].figures,
            "300° (Full wind test 300°)"
        );
        let session = state_lines(&[
            sourced_indices(Some(0.0), &six(0.0)),
            sourced_indices(Some(24.0), &six(-3.0)),
        ]);
        assert_eq!(late.rate.averages, session[1].rate.averages);
        assert_eq!(late.amplitude.averages, session[1].amplitude.averages);
        for wind in [None, Some(0.0)] {
            let alone = test_lines(wind, &six(-3.0), &[], Some(&six(0.0)), [Some(52.0); 2]);
            assert_eq!(alone.rate.key, None, "{wind:?}");
            assert_eq!(alone.rate.lanes[0].full_wind, None, "{wind:?}");
        }
    }

    /// A test read at a lift other than the full-wind test's, or at one
    /// not recorded, draws no full-wind amplitudes, so no arrows, its
    /// hovers its own figures alone; its rate and beat error are
    /// compared all the same (#1923).
    #[test]
    fn amplitudes_at_different_lifts_are_not_compared() {
        let same = test_lines(
            Some(24.0),
            &six(-3.0),
            &[],
            Some(&six(0.0)),
            [Some(52.0); 2],
        );
        assert!(same.amplitude.key.is_some());
        assert!(same.amplitude.lanes.iter().all(|l| l.full_wind.is_some()));
        for lifts in [[Some(52.0), Some(55.0)], [None, Some(52.0)]] {
            let apart = test_lines(Some(24.0), &six(-3.0), &[], Some(&six(0.0)), lifts);
            assert_eq!(apart.amplitude.key, None, "{lifts:?}");
            assert!(apart.amplitude.lanes.iter().all(|l| l.full_wind.is_none()));
            let lone = test_lines(Some(24.0), &six(-3.0), &[], None, [None; 2]);
            assert_eq!(apart.amplitude.lanes, lone.amplitude.lanes, "{lifts:?}");
            assert_eq!(apart.rate, same.rate, "{lifts:?}");
            assert_eq!(apart.beat_error, same.beat_error, "{lifts:?}");
            for (a, b) in apart.amplitude.lanes.iter().zip(&same.amplitude.lanes) {
                assert_eq!(a.value, b.value, "each its own amplitude");
            }
        }
    }
}
