//! Auto's rate at a pause is the watch's (#2112, #2114). A watch lifted
//! off the stand leaves a quiet stand: after 5 s of it Auto lets its
//! rate go ([`LiveAnalyzer::quiet_pass`]), and the stand's own noise (a USB hum, say) can be
//! locked on to at a rate of its own. Every reading of the take is then
//! read at that rate, or at none, though no watch beat at it. So at a
//! pause the rate, and the template it was heard with, go back to the
//! rate heard as a watch longest ([`beats::watch_heard_s`]; Norm on
//! #2142), so noise heard after the watch takes its place only by being
//! heard as a watch for longer.
//! Listening again goes on from there, as from any lock.

use super::*;

/// One lock Auto found: from when its beats count, its rate, the
/// template it heard them with, and how the Tick and Tock stood before
/// it.
#[derive(Debug, Clone)]
struct Lock {
    from_s: f64,
    bph: u32,
    template: Vec<f32>,
    /// The Tick and Tock check, profiles and the snippets they are cut
    /// from, as they stood when the lock was found: put back when the
    /// lock is let go with every lock after it.
    before: Box<Sided>,
}

/// How the Tick and Tock stood at a moment ([`Lock::before`]).
#[derive(Debug, Clone)]
struct Sided {
    sides: beats::SideCheck,
    profiles: [Option<TickProfile>; 2],
    snippets: VecDeque<(f64, bool, UnlockWindow, Vec<f32>)>,
}

/// Auto's locks so far, oldest first.
#[derive(Debug, Clone, Default)]
pub(super) struct Locks(Vec<Lock>);

impl LiveAnalyzer {
    /// Auto has just locked on: its beats from `from_s` on are read at
    /// this rate, with this template.
    pub(super) fn note_lock(&mut self, from_s: f64) {
        if let (Some(bph), Some(template)) = (self.bph, &self.template) {
            self.locks.0.push(Lock {
                from_s,
                bph,
                template: template.clone(),
                before: self.sided_now(),
            });
        }
    }

    /// The Tick and Tock as they stand now.
    fn sided_now(&self) -> Box<Sided> {
        Box::new(Sided {
            sides: self.sides.clone(),
            profiles: self.profiles.clone(),
            snippets: self.snippets.clone(),
        })
    }

    /// The template of the latest lock built again from the first chunk
    /// (#1327): the lock goes on with it.
    pub(super) fn relock_template(&mut self, template: &[f32]) {
        if let Some(l) = self.locks.0.last_mut() {
            l.template = template.to_vec();
        }
    }

    /// At a pause, with Auto: the watch is the rate heard as a watch the
    /// longest ([`beats::watch_heard_s`], summed over every lock at that
    /// rate, since a watch put back after a quiet is locked on to again
    /// at its own rate); a later rate takes its place only by being heard
    /// longer. Length is all that tells a watch from noise heard as one,
    /// so a second watch heard for less than the first (120 s, then 40 s)
    /// is read as the first, and its beats are let go. The locks at other
    /// rates after the rate's first are let go with what they read, and
    /// when the lock held now is not at that rate (or none is held), the
    /// rate's latest lock is put back.
    pub(super) fn back_to_watchs_lock(&mut self) {
        if self.cfg.analysis.bph.is_some() {
            return;
        }
        let Some(bph) = self.watchs_rate() else {
            return;
        };
        // Whether the lock held now, the latest, is at the watch's rate.
        let held = self.bph == Some(bph) && self.locks.0.last().is_some_and(|l| l.bph == bph);
        // From the rate's first lock on: what came before it stands.
        let first = self
            .locks
            .0
            .iter()
            .find(|l| l.bph == bph)
            .map_or(0.0, |l| l.from_s);
        let others = self.spans_where(|l| l.bph != bph && l.from_s >= first);
        // The other-rate locks after the watch's last, let go with every
        // lock after them: the Tick and Tock stand as before the first.
        let tail = self
            .locks
            .0
            .iter()
            .rposition(|l| l.bph == bph)
            .map(|i| i + 1);
        let before = tail
            .and_then(|i| self.locks.0.get(i))
            .map(|l| l.before.clone());
        self.let_go_within(&others);
        self.locks.0.retain(|l| l.bph == bph || l.from_s < first);
        // The lock held is the watch's already (a watch put back after a
        // lure): it stays as it is, with only the others let go.
        if held {
            return;
        }
        let Some(template) = self.locks.0.last().map(|l| l.template.clone()) else {
            return;
        };
        self.forget_rebuild();
        self.template = Some(template);
        self.bph = Some(bph);
        self.found_bph = true;
        self.logged_bph = self.bph;
        self.doubt = None;
        if let Some(b) = before {
            (self.sides, self.profiles, self.snippets) = (b.sides, b.profiles, b.snippets);
        }
    }

    /// The stretches, start and end in seconds, that the locks `which`
    /// picks read: each from its start to the next lock's.
    fn spans_where(&self, which: impl Fn(&Lock) -> bool) -> Vec<(f64, f64)> {
        let locks = &self.locks.0;
        (locks.iter().enumerate())
            .filter(|(_, l)| which(l))
            .map(|(i, l)| {
                (
                    l.from_s,
                    locks.get(i + 1).map_or(f64::INFINITY, |n| n.from_s),
                )
            })
            .collect()
    }

    /// What the locks let go read in `spans`, let go with them: their
    /// beats were numbered at a rate that isn't the watch's, and their
    /// amplitude windows cut on a template that isn't its. Nothing is put
    /// in their place; those stretches read as no watch. Only the
    /// analysis: the sound kept is untouched.
    fn let_go_within(&mut self, spans: &[(f64, f64)]) {
        let out = |t: f64| spans.iter().any(|&(a, b)| a <= t && t < b);
        let n = self.beats.len();
        self.beats.retain(|b| !out(b.time));
        if self.beats.len() < n {
            self.beats_gen = fresh_gen();
        }
        self.clipped.retain(|&t| !out(t));
        self.amp.retain(|w| !out(w.start_s));
        self.sample.retain(|x| !out(x.0));
        self.snippets.retain(|x| !out(x.0));
    }

    /// The rate heard as a watch the longest over all its locks, the
    /// first heard on a tie; none when no lock heard a run as long as a
    /// piece.
    fn watchs_rate(&self) -> Option<u32> {
        let mut heard: Vec<(u32, f64)> = Vec::new();
        for (l, (from, to)) in self.locks.0.iter().zip(self.spans_where(|_| true)) {
            let lo = self.beats.partition_point(|b| b.time < from);
            let hi = self.beats.partition_point(|b| b.time < to);
            let s = beats::watch_heard_s(&self.beats[lo..hi]);
            match heard.iter_mut().find(|h| h.0 == l.bph) {
                Some(h) => h.1 += s,
                None => heard.push((l.bph, s)),
            }
        }
        let mut best: Option<(u32, f64)> = None;
        for (bph, s) in heard {
            if s > 0.0 && best.is_none_or(|(_, b)| s > b) {
                best = Some((bph, s));
            }
        }
        best.map(|(bph, _)| bph)
    }

    /// Auto's locks forgotten, with the beats.
    pub(super) fn forget_locks(&mut self) {
        self.locks = Locks::default();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// An analyzer with Auto, and for each part a lock at its start at its
    /// rate (its template that rate, as a number) with good beats at that
    /// rate up to its end; the latest lock held.
    fn locked(parts: &[(f64, f64, u32)]) -> LiveAnalyzer {
        let mut l = LiveAnalyzer::new(48_000, LiveConfig::default());
        for &(from, to, bph) in parts {
            let step = 3600.0 / f64::from(bph);
            let mut k = 0;
            while from + k as f64 * step <= to {
                l.beats.push(Beat {
                    index: k,
                    time: from + k as f64 * step,
                    quality: 1.0,
                });
                k += 1;
            }
            l.locks.0.push(Lock {
                from_s: from,
                bph,
                template: vec![bph as f32],
                before: l.sided_now(),
            });
            (l.bph, l.template) = (Some(bph), Some(vec![bph as f32]));
        }
        l.found_bph = true;
        l
    }

    fn rates(l: &LiveAnalyzer) -> Vec<u32> {
        l.locks.0.iter().map(|l| l.bph).collect()
    }

    /// How long a watch was heard: runs split at a pause, each as long as
    /// a piece, summed; a run shorter than a piece counts for nothing.
    #[test]
    fn watch_heard_s_sums_the_runs_between_pauses() {
        let run = |from: f64, n: i64| {
            (0..n).map(move |k| Beat {
                index: k,
                time: from + k as f64 * 0.125,
                quality: 1.0,
            })
        };
        // 0 to 15 s, a 3 s pause, 18 to 30 s: 27 s, not the 30 s across.
        let two: Vec<Beat> = run(0.0, 121).chain(run(18.0, 97)).collect();
        assert_eq!(beats::watch_heard_s(&two), 27.0);
        // A 5 s run after a pause counts for nothing.
        let short: Vec<Beat> = run(0.0, 121).chain(run(18.0, 41)).collect();
        assert_eq!(beats::watch_heard_s(&short), 15.0);
        assert_eq!(beats::watch_heard_s(&[]), 0.0);
    }

    /// Two rates heard as a watch for the same time: the earlier one is
    /// the watch's, and the later one, though held, is let go.
    #[test]
    fn on_a_tie_the_rate_heard_first_is_the_watchs() {
        let mut l = locked(&[(0.0, 20.0, 28_800), (30.0, 50.0, 14_400)]);
        l.back_to_watchs_lock();
        assert_eq!(l.bph, Some(28_800));
        assert_eq!(l.template, Some(vec![28_800.0]));
        assert_eq!(rates(&l), [28_800]);
        assert!(l.beats.iter().all(|b| b.time <= 20.0));
    }

    /// No lock heard a run as long as a piece: nothing is put back, and a
    /// rate let go stays let go.
    #[test]
    fn with_no_watch_heard_nothing_is_put_back() {
        let mut l = locked(&[(0.0, 5.0, 28_800)]);
        (l.bph, l.template) = (None, None);
        l.back_to_watchs_lock();
        assert_eq!((l.bph, l.template.clone()), (None, None));
    }

    /// What came before the watch's rate's first lock stands; what the
    /// other-rate locks after it read goes, with the locks themselves:
    /// beats, clipped beats, and the beats' generation moves on.
    #[test]
    fn only_other_rate_locks_after_the_watchs_first_are_let_go() {
        let mut l = locked(&[
            (0.0, 20.0, 14_400),
            (30.0, 70.0, 28_800),
            (80.0, 90.0, 14_400),
        ]);
        l.clipped = vec![10.0, 50.0, 85.0];
        let generation = l.beats_gen;
        l.back_to_watchs_lock();
        assert_eq!(l.bph, Some(28_800));
        assert_eq!(rates(&l), [14_400, 28_800]);
        assert_eq!(l.clipped, [10.0, 50.0]);
        assert_ne!(l.beats_gen, generation);
        let before = l.beats.iter().filter(|b| b.time <= 20.0).count();
        assert_eq!(before, 81, "the first lock's beats stand");
        assert!(l.beats.iter().all(|b| b.time < 80.0));
    }

    /// The locks after the watch's last let go: the Tick and Tock check,
    /// profiles and snippets stand as they did when the first of them was
    /// found, the watch's end, not as the lure left them.
    #[test]
    fn the_tick_and_tock_stand_as_at_the_watchs_end() {
        let mut l = locked(&[(0.0, 40.0, 28_800), (50.0, 55.0, 72_000)]);
        let snip = (39.9, true, UnlockWindow::SHORT, vec![1.0_f32]);
        l.locks.0[1].before.snippets = VecDeque::from([snip.clone()]);
        l.snippets = VecDeque::from([(54.0, false, UnlockWindow::SHORT, vec![2.0_f32])]);
        // As the lure left them: a profile of its own, and its jump's
        // sides still to be checked.
        let (watch, _) = relock_tests::heard_parts(&[(Some(28_800), 40.0)]);
        l.profiles = watch.profiles.clone();
        assert!(l.profiles[0].is_some());
        l.locks.0[1].before.sides = watch.sides.clone();
        l.sides = watch.sides.clone();
        l.sides.jump(50.0);
        assert_eq!(l.sides.pending_since(), Some(50.0));
        l.back_to_watchs_lock();
        assert_eq!(l.bph, Some(28_800));
        assert_eq!(l.snippets, VecDeque::from([snip]));
        assert!(
            l.profiles.iter().all(Option::is_none),
            "the lure's profiles"
        );
        assert_eq!(l.sides.pending_since(), None, "the lure's jump");
    }

    /// The lock held is the watch's: it stays as it is, its template with
    /// it, though the lock noted another.
    #[test]
    fn the_watchs_lock_held_stays_as_it_is() {
        let mut l = locked(&[(0.0, 40.0, 28_800)]);
        l.template = Some(vec![7.0]);
        l.back_to_watchs_lock();
        assert_eq!(l.template, Some(vec![7.0]));
    }

    /// A template built again from the first chunk (#1327) is the lock's
    /// from then on: put back after a lure, the watch is read with it.
    #[test]
    fn the_template_built_again_is_the_locks() {
        let w = Some(28_800);
        let (l, _) = relock_tests::heard_parts(&[(w, 80.0)]);
        assert!(l.template_switch_s().is_some(), "taken over");
        assert_eq!(l.locks.0.last().map(|k| &k.template), l.template.as_ref());
    }

    /// After a lure heard long enough to tell its sides apart is let go,
    /// the amplitude windows and the Tick and Tock profiles are the
    /// watch's, as if the lure was never heard.
    #[test]
    fn after_a_lure_the_windows_and_profiles_are_the_watchs() {
        let w = Some(28_800);
        let (watch, _) = relock_tests::heard_parts(&[(w, 40.0)]);
        let (l, rates) = relock_tests::heard_parts(&[(w, 40.0), (None, 8.0), (Some(72_000), 20.0)]);
        assert!(rates.contains(&Some(72_000)), "{rates:?}");
        assert!(
            l.amp.iter().all(|a| a.start_s < 48.0),
            "a window of the lure kept"
        );
        let points = |l: &LiveAnalyzer| {
            l.profiles
                .each_ref()
                .map(|p| p.as_ref().map(|p| p.median.len()))
        };
        assert_eq!(points(&l), points(&watch));
        assert!(points(&l)[0].is_some());
    }
}
