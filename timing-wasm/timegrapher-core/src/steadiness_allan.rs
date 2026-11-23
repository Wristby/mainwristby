//! A series' Allan deviation, and which of its points rest on enough
//! differences to be judged: kept beside `steadiness.rs`, under its
//! length cap.

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Allan {
    /// Averaging time, seconds; the Allan deviation there (the series'
    /// units); what independent readings would give; differences used.
    pub tau_s: Vec<f64>,
    pub deviation: Vec<f64>,
    pub white: Vec<f64>,
    pub pairs: Vec<usize>,
    /// Log-log slope over the short end (−0.5 for independent readings,
    /// 0 for flicker, +0.5 for a random walk, +1 for drift).
    pub slope_short: Option<f64>,
    /// The averaging time with the smallest deviation, and that value:
    /// how long to average for the most repeatable reading.
    pub best_tau_s: Option<f64>,
    pub best_deviation: Option<f64>,
    /// Largest deviation over the white line among points with at least
    /// [`ALLAN_JUDGED_DIFFERENCES`]: 1 for independent readings.
    pub max_excess: f64,
    /// Whether each averaging time rests on at least
    /// [`ALLAN_JUDGED_DIFFERENCES`]: the plots draw the others hollow,
    /// their line faint (#1985).
    pub judged: Vec<bool>,
    /// The plots' note at the first hollow point, [`ALLAN_HOLLOW_NOTE`];
    /// None when every point is judged.
    pub hollow_note: Option<&'static str>,
}

/// The fewest differences an Allan deviation rests on for it to be
/// judged: picked as the least scatter, or weighed against independent
/// readings. With 3, a σ estimate is good to roughly ±40% (Norm, #1985).
pub const ALLAN_JUDGED_DIFFERENCES: usize = 8;

/// The note the Allan plots put once at their first hollow point (Norm's
/// words, Hugh's wording on #2012).
pub const ALLAN_HOLLOW_NOTE: &str = "hollow: too few differences to judge";

impl Allan {
    /// The Allan deviation from `ad`, each averaging time with its
    /// deviation and the differences it rests on, against `white`, what
    /// independent readings would give, with the short end's log-log
    /// `slope`: the least scatter and the largest excess over `white` are
    /// taken only among the times judged.
    pub(super) fn of(ad: &[(f64, f64, usize)], white: Vec<f64>, slope: Option<f64>) -> Self {
        let judged: Vec<bool> = ad.iter().map(|p| p.2 >= ALLAN_JUDGED_DIFFERENCES).collect();
        let best = ad
            .iter()
            .zip(&judged)
            .filter(|(_, j)| **j)
            .map(|(p, _)| p)
            .min_by(|a, b| a.1.total_cmp(&b.1));
        let max_excess = ad
            .iter()
            .zip(&white)
            .zip(&judged)
            .filter(|(_, j)| **j)
            .map(|((p, w), _)| p.1 / w)
            .fold(1.0f64, f64::max);
        Self {
            tau_s: ad.iter().map(|p| p.0).collect(),
            deviation: ad.iter().map(|p| p.1).collect(),
            white,
            pairs: ad.iter().map(|p| p.2).collect(),
            slope_short: slope,
            best_tau_s: best.map(|p| p.0),
            best_deviation: best.map(|p| p.1),
            max_excess,
            hollow_note: judged.contains(&false).then_some(ALLAN_HOLLOW_NOTE),
            judged,
        }
    }
}
