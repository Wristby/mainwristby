//! A beat rate changed while listening must not throw the take's beats
//! away (#1949). A change that the beats so far can't stand under starts
//! the reading again, as before, but the reading from before the change is
//! held: it goes on listening at its own rate, set as it was, and given
//! every other setting as it changes. Going back to a rate it stands
//! under (Auto where Auto found its rate, or the rate it read at) brings
//! it back whole, as if the rate had never been changed.

use super::*;

/// How long, in seconds of sound after a rate change, the reading from
/// before it is held ready to come back. Long enough for a slip of the
/// mouse to be noticed and set back; after it the change is taken as
/// meant, and the second reading's work stops.
pub(super) const HELD_S: f64 = 600.0;

/// The reading held from before a beat rate change ([`LiveAnalyzer::hold`]),
/// and the sample at which it is let go.
#[derive(Debug, Clone, Default)]
pub(super) struct Held(Option<(Box<LiveAnalyzer>, u64)>);

impl LiveAnalyzer {
    /// Hold the reading as it is now, its beat rate set as it was (`set`),
    /// before a rate change starts it again. A reading already held stays:
    /// it is the one from before the first change.
    pub(super) fn hold(&mut self, set: Option<u32>) {
        if self.held.0.is_some() {
            return;
        }
        let mut was = self.clone();
        was.held = Held::default();
        was.stop_reading_as_file();
        was.cfg.analysis.bph = set;
        let until = self.total + (HELD_S * self.fs).round() as u64;
        self.held = Held(Some((Box::new(was), until)));
    }

    /// The beat rate set to `bph`: when the held reading stands under it,
    /// that reading back in place of this one, and whether it had heard
    /// beats; none when there is none or it doesn't stand.
    pub(super) fn back_to_held(&mut self, bph: Option<u32>) -> Option<bool> {
        let (was, _) = self.held.0.as_ref()?;
        let stands = bph == was.cfg.analysis.bph
            || match bph {
                Some(b) => Some(b) == was.bph,
                None => was.found_bph,
            };
        if !stands {
            return None;
        }
        let (mut was, _) = self.held.0.take()?;
        let heard = was.set_bph(bph);
        *self = *was;
        Some(heard)
    }

    /// A setting changed: the held reading given it too.
    pub(super) fn in_held(&mut self, f: impl FnOnce(&mut LiveAnalyzer)) {
        if let Some((was, _)) = &mut self.held.0 {
            f(was);
        }
    }

    /// Sound heard: the held reading hears it too, and is let go once the
    /// change has stood for [`HELD_S`].
    pub(super) fn push_held(&mut self, samples: &[f32]) {
        self.let_go_held_at(self.total + samples.len() as u64);
        self.in_held(|l| {
            l.push(samples);
        });
    }

    /// The held reading let go once the sound reaches sample `to` past
    /// its time ([`HELD_S`]).
    pub(super) fn let_go_held_at(&mut self, to: u64) {
        if self.held.0.as_ref().is_some_and(|(_, until)| to > *until) {
            self.held = Held::default();
        }
    }

    /// Whether a reading from before a beat rate change is held, ready to
    /// come back.
    pub fn holds_reading(&self) -> bool {
        self.held.0.is_some()
    }
}
