//! Which stretches of a take settle right through and read nothing
//! (Norm on #1980): split from `take.rs` by concern.

use super::*;

/// Whether entry `e`, a position of `length_s` in the take `m`, settling
/// for [`SETTLE_S`] as none is given, settles right through and reads
/// nothing: one of several stretches of one recording ([`cut_from_one`])
/// no longer than [`SETTLE_S`]. Such a stretch, a position pressed and left
/// at once, is the watch being handled, not a position with a rate (Norm
/// on #1980). A recording of its own keeps [`measured`]'s halving, so a
/// short take still reads, alone or in a session of such takes.
pub fn settles_through(e: &RecordingEntry, m: &Manifest, length_s: f64) -> bool {
    handled(cut_from_one(e, m), length_s, SETTLE_S)
}

/// Whether a stretch `length_s` long, one of `several` in its take, is the
/// watch being handled and not a position: it is no longer than the
/// `settle_s` it would settle for, so nothing of it is settled (Norm on
/// #1980). The one rule for a stretch of a session file
/// ([`settles_through`]) and for a take's opening stretch, the one before
/// the watch is first moved, in the app, which no move settles: a take
/// started in the last take's position and moved at once (Shane on #1980).
/// A take of one stretch reads whatever it has.
pub fn handled(several: bool, length_s: f64, settle_s: f64) -> bool {
    several && length_s <= settle_s
}

/// Whether entry `e` is one of several stretches the take `m` cuts from
/// one recording: another entry names its file too. Such a stretch settles
/// in full, never halved, as the watch was turned within the recording.
pub fn cut_from_one(e: &RecordingEntry, m: &Manifest) -> bool {
    m.recordings.iter().filter(|r| r.file == e.file).count() > 1
}

/// Whether entry `e` of the take `m` reads nothing as its session file
/// lists it, read with no settling given: [`reading_window`] over the
/// entry's listed end says [`NoReading::Nothing`] ([`reads_nothing`], or a
/// stretch that [`settles_through`]). Its position is then not one of the
/// take's. An entry with no end listed runs to its sound's end, unknown
/// here, so it counts (Vernon on #2021: one settle rule, not two).
pub fn listed_unread(e: &RecordingEntry, m: &Manifest) -> bool {
    reads_nothing(e)
        || e.end_s
            .is_some_and(|end| matches!(reading_window(e, m, None, end), Err(NoReading::Nothing)))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(position: &str, start_s: f64, end_s: Option<f64>) -> RecordingEntry {
        RecordingEntry {
            file: ".".into(),
            position: Some(position.into()),
            start_s: Some(start_s),
            end_s,
            ..Default::default()
        }
    }

    /// A position pressed and left at once, in a take of more than one,
    /// reads nothing and is not one of its positions; a take of one entry
    /// still reads a short stretch, and a stretch past the settle reads
    /// from its end (Norm on #1980).
    #[test]
    fn a_stretch_no_longer_than_the_settle_reads_nothing_in_a_take_of_several() {
        let m = Manifest {
            recordings: vec![entry("CU", 0.0, Some(2.0)), entry("DD", 2.0, None)],
            ..Default::default()
        };
        let [cu, dd] = [&m.recordings[0], &m.recordings[1]];
        assert!(listed_unread(cu, &m) && !listed_unread(dd, &m));
        assert!(matches!(
            reading_window(cu, &m, None, 600.0),
            Err(NoReading::Nothing)
        ));
        let w = reading_window(dd, &m, None, 600.0).unwrap();
        assert_eq!((w.from_s, w.to_s), (2.0 + SETTLE_S, 600.0));
        // At the settle exactly, nothing; just past it, what is past it.
        let at = |len: f64| Manifest {
            recordings: vec![entry("CU", 0.0, Some(len)), entry("DD", len, None)],
            ..Default::default()
        };
        assert!(listed_unread(&at(SETTLE_S).recordings[0], &at(SETTLE_S)));
        // A first stretch with no start listed starts at 0, as it reads.
        let no_start = Manifest {
            recordings: vec![
                RecordingEntry {
                    start_s: None,
                    ..entry("DU", 0.0, Some(5.0))
                },
                entry("CU", 5.0, None),
            ],
            ..Default::default()
        };
        assert!(listed_unread(&no_start.recordings[0], &no_start));
        assert!(!listed_unread(&no_start.recordings[1], &no_start));
        let m = at(SETTLE_S + 11.0);
        let w = reading_window(&m.recordings[0], &m, None, 600.0).unwrap();
        assert_eq!((w.from_s, w.to_s), (SETTLE_S, SETTLE_S + 11.0));
        // A settle given stands: the reader's, or the session file's.
        let m = at(2.0);
        assert!(reading_window(&m.recordings[0], &m, Some(0.0), 600.0).is_ok());
        let given = Manifest {
            settle_s: Some(0.0),
            ..at(2.0)
        };
        assert!(!listed_unread(&given.recordings[0], &given));
        // Takes of their own, each its own file, in one session file
        // halve theirs as each did alone (`timegrapher record`).
        let own = |file: &str| RecordingEntry {
            file: file.into(),
            ..entry("DU", 0.0, Some(2.0))
        };
        let apart = Manifest {
            recordings: vec![own("a"), own("b")],
            ..Default::default()
        };
        assert!(!listed_unread(&apart.recordings[0], &apart));
        let w = reading_window(&apart.recordings[0], &apart, None, 600.0).unwrap();
        assert_eq!((w.from_s, w.to_s), (1.0, 2.0));
        // One entry alone halves its settle, so a short take reads.
        let one = Manifest {
            recordings: vec![entry("DU", 0.0, Some(2.0))],
            ..Default::default()
        };
        assert!(!listed_unread(&one.recordings[0], &one));
        let w = reading_window(&one.recordings[0], &one, None, 600.0).unwrap();
        assert_eq!((w.from_s, w.to_s), (1.0, 2.0));
    }

    /// A take's opening stretch, one of several, no longer than its settle
    /// is the watch being handled; one past it, or a take's only stretch,
    /// is a position (Norm and Shane on #1980).
    #[test]
    fn an_opening_stretch_no_longer_than_the_settle_is_handled() {
        assert!(handled(true, 1.0, SETTLE_S));
        assert!(handled(true, 10.0, SETTLE_S));
        assert!(handled(true, SETTLE_S, SETTLE_S));
        assert!(!handled(true, SETTLE_S + 1.0, SETTLE_S));
        assert!(!handled(false, 1.0, SETTLE_S));
        // The Settle set stands, not Witschi's 20 s.
        assert!(handled(true, 25.0, 30.0) && !handled(true, 25.0, 20.0));
    }
}
