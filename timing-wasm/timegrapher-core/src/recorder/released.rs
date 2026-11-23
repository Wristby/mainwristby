//! A closed hour its saved copy holds whole is kept there alone (#2040).
//!
//! A take kept while it records (a Quick Listen once saved, a watch's
//! own take) is copied into its folder as it goes, so each closed hour
//! was on the disk twice: here in the recording folder and in the take,
//! until the next listen threw the recording folder away. On a long take
//! that doubled the space it used. Now a save checks each closed hour it
//! wrote, once the copy is on the disk: byte for byte, or, for an hour
//! still a WAV here, sample for sample against the FLAC the copy holds.
//! Once the hour here is kept as FLAC too (no thread still converting
//! it), its file here is deleted and the recording reads the hour from
//! the copy from then on: a later save into the same copy finds it there
//! whole, and one into another folder copies it from there.
//!
//! Verify, then delete, as Keep in a Watch does (#2020): nothing goes
//! from here before the copy is checked on the disk, and the copy is
//! looked at again, at its length, just before.

use super::{as_flac, regular_file, sync_file, sync_folder, PendingFile, Recorder, SaveStep};
use std::fs::{self, File};
use std::io::{self, Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};

/// A closed hour a save wrote into its copy and checked there: its name
/// in the recording when the save began, where the copy holds it, and
/// that file's length then.
#[derive(Debug, Clone, PartialEq)]
pub(super) struct HeldWhole {
    pub(super) name: String,
    pub(super) at: PathBuf,
    pub(super) len: u64,
}

impl HeldWhole {
    /// Whether the copy still holds it: a file of its own at its length.
    fn there(&self) -> bool {
        regular_file(&self.at).is_ok_and(|m| m.len() == self.len)
    }

    /// Whether it is the hour `name` of the recording (the WAV it was
    /// noted as may be a FLAC since).
    fn is(&self, name: &str) -> bool {
        self.name == name || as_flac(&self.name) == name
    }
}

/// Each closed hour the last save wrote, at its length there, and whether
/// the copy was found not to hold them when last looked at (#2052).
#[derive(Debug, Default)]
pub(super) struct SavedHours {
    hours: Vec<HeldWhole>,
    gone: bool,
}

impl SavedHours {
    pub(super) fn new(hours: Vec<HeldWhole>) -> Self {
        Self { hours, gone: false }
    }
}

/// The closed hours of `files` a save put into `dest`, each at its length
/// there once in place (#2052): what [`Recorder::look_at_saved_copy`] looks
/// for later. Stat only, no reading. Each is named as the copy names it
/// (a FLAC where the recording may still hold a WAV), not by the
/// recording's segment name: only its place and length are looked at.
pub(super) fn written(files: &[PendingFile], dest: &Path) -> Vec<HeldWhole> {
    files
        .iter()
        .filter(|f| f.held.is_some())
        .filter_map(|f| {
            let at = dest.join(f.name());
            let len = regular_file(&at).ok()?.len();
            let name = f.name().to_string_lossy().into_owned();
            Some(HeldWhole { name, at, len })
        })
        .collect()
}

/// The closed hours of `files` that a save into `dest` was to check, each
/// checked in the copy, on the disk: the ones that hold it whole. None
/// unless the copy's folder, and the one it is in, are synced first
/// (`before` may refuse that, in tests): the hour's name in the copy must
/// be on the disk before its copy here may go, or a power cut could leave
/// it in neither place.
pub(super) fn checked(
    files: &[PendingFile],
    dest: &Path,
    before: &mut impl FnMut(SaveStep, &Path) -> io::Result<()>,
) -> Vec<HeldWhole> {
    if !files.iter().any(|f| f.release.is_some()) {
        return Vec::new();
    }
    let synced = before(SaveStep::Sync, dest)
        .and_then(|()| sync_folder(dest))
        .and_then(|()| dest.parent().map_or(Ok(()), sync_folder));
    if synced.is_err() {
        return Vec::new();
    }
    files
        .iter()
        .filter_map(|f| {
            let name = f.release.as_ref()?;
            let held = f.held.as_ref()?;
            let to = dest.join(f.name());
            let whole = match f.as_flac {
                true => {
                    sync_file(&to).is_ok()
                        && crate::flac::same_samples_file(held, &to).unwrap_or(false)
                }
                false => same_bytes(held, f.len, &to).unwrap_or(false),
            };
            let len = regular_file(&to).ok()?.len();
            whole.then(|| HeldWhole {
                name: name.clone(),
                at: to,
                len,
            })
        })
        .collect()
}

/// Whether `to` holds the first `len` bytes of `held` and no more, byte
/// for byte, once on the disk: synced before it is read, so a power cut
/// after the check can't take it back.
pub(super) fn same_bytes(held: &File, len: u64, to: &Path) -> io::Result<bool> {
    regular_file(to)?;
    sync_file(to)?;
    let mut there = File::open(to)?;
    if there.metadata()?.len() != len {
        return Ok(false);
    }
    let mut here = held.try_clone()?;
    here.seek(SeekFrom::Start(0))?;
    const CHUNK: usize = 1 << 20;
    let (mut a, mut b) = (vec![0u8; CHUNK], vec![0u8; CHUNK]);
    let mut left = len;
    while left > 0 {
        let n = left.min(CHUNK as u64) as usize;
        here.read_exact(&mut a[..n])?;
        there.read_exact(&mut b[..n])?;
        if a[..n] != b[..n] {
            return Ok(false);
        }
        left -= n as u64;
    }
    Ok(true)
}

impl Recorder {
    /// From now on, each closed hour a save holds whole in its copy is
    /// kept there alone, as the app keeps its sessions: the copy is the
    /// take the user kept, and the recording folder only the session's
    /// own until the next. Off by default, so a recording that is itself
    /// the take (`timegrapher record`) keeps every hour.
    pub fn keep_saved_hours_in_copy(&mut self) {
        self.copy_alone = true;
    }

    /// The hours a save checked in its copy (`held`): each goes from here
    /// once it is kept as FLAC here ([`Recorder::release_due`]).
    pub(super) fn take_released(&mut self, held: &[HeldWhole]) {
        for h in held {
            let known = |v: &[HeldWhole]| v.iter().any(|r| r.is(&h.name) || h.is(&r.name));
            if !known(&self.released) && !known(&self.releasing) {
                self.releasing.push(h.clone());
            }
        }
        self.release_due();
    }

    /// Delete here each hour its copy holds whole, once no thread is
    /// keeping it as FLAC, and read it from the copy from then on. An hour
    /// the copy no longer holds as the save left it, or whose file here
    /// can't be deleted, stays here, read from here as before.
    pub(super) fn release_due(&mut self) {
        let mut i = 0;
        while i < self.releasing.len() {
            let h = &self.releasing[i];
            if self.converting.iter().any(|(wav, _)| h.is(wav)) {
                i += 1;
                continue;
            }
            let h = self.releasing.remove(i);
            let Some(name) = self.segments.iter().find(|s| h.is(s)).cloned() else {
                continue;
            };
            if self.is_open(&name) || !h.there() {
                continue;
            }
            if fs::remove_file(self.dir.join(&name)).is_ok() {
                self.released.push(HeldWhole { name, ..h });
            }
        }
    }

    /// Where the hour `name` is read from when its copy holds it alone.
    pub(super) fn released_at(&self, name: &str) -> Option<&Path> {
        self.released
            .iter()
            .find(|h| h.name == name)
            .map(|h| h.at.as_path())
    }

    /// Whether a save is to check the hour `name` in its copy: not yet
    /// checked, and not the copy's own.
    pub(super) fn to_check(&self, name: &str) -> bool {
        let known = |v: &[HeldWhole]| v.iter().any(|h| h.is(name));
        !known(&self.released) && !known(&self.releasing)
    }

    /// An hour kept in a copy alone that a save copies into another
    /// folder is checked there as an hour let go is (Felix on #2060), so
    /// the save may read it from there from then on ([`Self::saved_into`]).
    pub(super) fn check_released_elsewhere(&self, f: &mut PendingFile, name: &str, dest: &Path) {
        let elsewhere = self
            .released_at(name)
            .is_some_and(|at| at != dest.join(f.name()));
        if f.release.is_none() && elsewhere {
            f.release = Some(name.to_string());
        }
    }

    /// A save wrote `copy` (#2052): the hours it holds, looked for there
    /// from now on. An hour kept in an earlier copy alone is read from
    /// this one once checked whole in it, on the disk (a save into another
    /// folder copies it there from the earlier copy): the copy saved last
    /// going is then what makes it unreachable, not the earlier one
    /// (Trevor and Felix on #2060). One not checked whole stays read from
    /// the earlier copy.
    pub(super) fn saved_into(&mut self, copy: &super::SavedCopy) {
        for h in &mut self.released {
            if let Some(w) = copy.held_whole.iter().find(|w| w.name == h.name) {
                h.at = w.at.clone();
                h.len = w.len;
            }
        }
        self.saved_hours = SavedHours::new(copy.written.clone());
    }

    /// The copy moved from `from` to `to`: the hours it holds alone are
    /// read from there.
    pub(super) fn released_moved(&mut self, from: &Path, to: &Path) {
        let all = self.released.iter_mut().chain(self.releasing.iter_mut());
        for h in all.chain(self.saved_hours.hours.iter_mut()) {
            if let Ok(rest) = h.at.strip_prefix(from) {
                h.at = to.join(rest);
            }
        }
    }

    /// Whether every hour kept in the saved copy alone is still there as
    /// it was saved: when one isn't (the take was deleted, or its sound
    /// removed), the recording can't be carried on or saved again whole.
    pub fn hours_reachable(&self) -> bool {
        self.released.iter().all(HeldWhole::there)
    }

    /// Whether an hour checked in the copy is still kept here too, waiting
    /// to be kept as FLAC here first: [`Recorder::tidy`] lets it go.
    pub fn releasing(&self) -> bool {
        !self.releasing.is_empty()
    }

    /// Take in the hours kept as FLAC since last time, and let go of each
    /// its copy holds whole. For a recording paused, where no sound comes
    /// to do it; listening does it as it writes.
    pub fn tidy(&mut self) -> io::Result<()> {
        if self.reap(false) {
            self.write_session(None, None)?;
        }
        self.release_due();
        Ok(())
    }

    /// Look again at whether the copy saved last still holds the sound it
    /// was saved with (#2052): each closed hour it wrote at its length, the
    /// hour still being written at least as long as it was left, and every
    /// hour kept in a copy alone (one a save elsewhere couldn't check whole
    /// stays read from the earlier copy, see `saved_into`). Stat only: for
    /// now and then (the window back in front, a refusal), never every
    /// frame; a save itself starts afresh.
    pub fn look_at_saved_copy(&mut self) {
        let open = |(at, len): &(PathBuf, u64)| regular_file(at).is_ok_and(|m| m.len() >= *len);
        self.saved_hours.gone = self.saved_name.is_some()
            && !(self.saved_hours.hours.iter().all(HeldWhole::there)
                && self.grown.as_ref().is_none_or(open)
                && self.hours_reachable());
    }

    /// Whether the copy saved last was found, when last looked at, no
    /// longer to hold its sound: the take deleted, or its sound removed or
    /// cut short, outside the app. False when nothing was saved, and just
    /// after a save.
    pub fn saved_copy_gone(&self) -> bool {
        self.saved_hours.gone
    }
}
