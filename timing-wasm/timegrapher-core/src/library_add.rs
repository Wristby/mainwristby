//! Adding a take from outside the library to a watch (#1970): planned,
//! with the room it needs checked before anything is written, copied with
//! its progress told and a way to stop it, then finished. A copy is put
//! together in a hidden folder beside its place and moved in whole, so a
//! copy cut short is never a take; one left behind by a copy that never
//! finished (the app closed part way) is cleared when the library is next
//! opened to change.

use super::*;
use std::sync::atomic::{AtomicBool, Ordering};

/// Room kept free on the disk beyond a take copied in, bytes: a copy that
/// would leave less is refused before it starts, so a take being recorded
/// meanwhile, and the computer itself, still have room.
pub const ADD_SPARE_BYTES: u64 = 1_000_000_000;

/// How long a folder left from adding a take must have gone untouched
/// before it is cleared, seconds. A copy under way writes to it every few
/// seconds, so an hour without a change is one that stopped.
pub const STALE_ADD_S: u64 = 3600;

/// The start of the hidden folder a take is put together in ([`staging`]).
pub(super) const ADDING: &str = ".adding-";

/// A take planned to be added ([`Library::plan_add`]).
#[derive(Debug, Clone)]
pub struct AddPlan {
    /// The take's folder outside the library.
    pub from: PathBuf,
    /// Its bytes, all of them copied.
    pub bytes: u64,
    /// The original is kept: a copy, or a move whose original is still in
    /// use when the copy ends ([`Library::finish_add`] deletes it only
    /// when false).
    pub keep_original: bool,
    takes: PathBuf,
    to: PathBuf,
    staged: PathBuf,
    /// Where it went already, moved on the same disk with no copy.
    moved: Option<PathBuf>,
}

impl AddPlan {
    /// Where it is already, when it was moved on the same disk with no
    /// copy to make.
    pub fn moved(&self) -> Option<&Path> {
        self.moved.as_deref()
    }
}

/// Bytes free to this user on the disk holding `dir`; none where that
/// can't be told.
#[cfg(unix)]
pub fn free_bytes(dir: &Path) -> Option<u64> {
    use std::os::unix::ffi::OsStrExt;
    let path = std::ffi::CString::new(dir.as_os_str().as_bytes()).ok()?;
    let mut st: libc::statvfs = unsafe { std::mem::zeroed() };
    // SAFETY: `path` is a valid C string and `st` a place for the answer.
    if unsafe { libc::statvfs(path.as_ptr(), &mut st) } != 0 {
        return None;
    }
    #[allow(clippy::unnecessary_cast, clippy::useless_conversion)]
    Some(u64::from(st.f_bavail as u64) * u64::from(st.f_frsize as u64))
}

/// Bytes free to this user on the disk holding `dir`; none where that
/// can't be told.
#[cfg(windows)]
pub fn free_bytes(dir: &Path) -> Option<u64> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::GetDiskFreeSpaceExW;
    let wide: Vec<u16> = dir.as_os_str().encode_wide().chain([0]).collect();
    let mut free = 0u64;
    // SAFETY: `wide` ends in a nul; the other answers aren't asked for.
    let ok = unsafe {
        GetDiskFreeSpaceExW(
            wide.as_ptr(),
            &mut free,
            std::ptr::null_mut(),
            std::ptr::null_mut(),
        )
    };
    (ok != 0).then_some(free)
}

/// A browser has no local library disk whose available space can be queried.
#[cfg(not(any(unix, windows)))]
pub fn free_bytes(_dir: &Path) -> Option<u64> {
    None
}

/// Why a copy of `bytes` into `dir` is refused, when the disk has `free`
/// bytes (none: not known, and then it is tried): it would leave less
/// than [`ADD_SPARE_BYTES`].
pub fn no_room(bytes: u64, free: Option<u64>) -> Option<String> {
    let free = free?;
    (free < bytes.saturating_add(ADD_SPARE_BYTES)).then(|| {
        format!(
            "there isn't room for it. It needs {}, and the disk has {} free with {} kept \
             spare. Make room on the disk first, or, if the take is already on that disk, \
             move it in rather than copy it.",
            size_text(bytes),
            size_text(free),
            size_text(ADD_SPARE_BYTES)
        )
    })
}

impl Library {
    /// Plan adding the take folder `from`, from outside the library, to a
    /// watch (by its id): copied, or moved when `keep_original` is false.
    /// Every check is made first, the room for a copy among them; a move
    /// on the same disk is made at once (no copy), so [`AddPlan::moved`]
    /// says where it went. Nothing else is written but the watch's takes
    /// folder.
    pub fn plan_add(
        &mut self,
        from: &Path,
        watch_id: &str,
        keep_original: bool,
    ) -> Result<AddPlan, String> {
        if !self.adding {
            self.writable()?;
        } else if !keep_original {
            // Without the lock the app may move or delete the watch while
            // the take goes in: only a copy keeps the original safe.
            return Err(
                "the app has these watches open, so a take can only be copied in, not moved: \
                 leave out --move, or close the app first"
                    .into(),
            );
        }
        if !(from.join(take::MANIFEST).is_file() || from.join(take::RECORD).is_file()) {
            return Err(format!(
                "{} is not a take folder (it has no session.toml or session.json)",
                from.display()
            ));
        }
        self.not_already_in(from)?;
        if from.join(take::MANIFEST).is_file() {
            // A session file that doesn't read would show as a broken take.
            manifest_of(from).map_err(|e| format!("this take's session file doesn't read: {e}"))?;
        }
        stays_readable(from, "add the take again")?;
        let to_watch = self
            .watches
            .iter()
            .find(|w| w.watch.id == watch_id)
            .ok_or("That watch is no longer in your watches")?;
        let takes = to_watch.dir.join(TAKES);
        if self.adding {
            // Never make again a watch the app has just renamed or deleted.
            if !to_watch.dir.join(WATCH_FILE).is_file() {
                return Err(format!(
                    "\"{}\" is no longer in your watches",
                    to_watch.watch.name
                ));
            }
            match fs::create_dir(&takes) {
                Err(e) if e.kind() != std::io::ErrorKind::AlreadyExists => {
                    return Err(format!("{}: {e}", takes.display()))
                }
                _ => {}
            }
        } else {
            fs::create_dir_all(&takes).map_err(|e| format!("{}: {e}", takes.display()))?;
        }
        let to = unused_dir(&takes, &file_name(from));
        let moved = (!keep_original && fs::rename(from, &to).is_ok()).then(|| to.clone());
        let bytes = if moved.is_some() {
            0
        } else {
            folder_bytes(from)
        };
        if moved.is_none() {
            if let Some(why) = no_room(bytes, free_bytes(&takes)) {
                return Err(why);
            }
        }
        let staged = staging(&takes, &to);
        Ok(AddPlan {
            from: from.to_path_buf(),
            bytes,
            keep_original,
            takes,
            to,
            staged,
            moved,
        })
    }

    /// Finish adding the take planned in `plan`, copied as `copied` says
    /// ([`copy_add`]): a move's original deleted, and the library read
    /// again. `Ok((folder, Some(why)))` when it is in the watch but some of
    /// the original couldn't be deleted.
    pub fn finish_add(
        &mut self,
        plan: &AddPlan,
        copied: Result<PathBuf, String>,
    ) -> Result<(PathBuf, Option<String>), String> {
        let to = copied?;
        let left = if plan.keep_original || plan.moved.is_some() {
            None
        } else {
            fs::remove_dir_all(&plan.from).err().map(|e| {
                format!(
                    "The take is in the watch, but some of {} couldn't be deleted ({e}): what \
                     is left there is a copy",
                    plan.from.display()
                )
            })
        };
        self.scan();
        Ok((to, left))
    }

    /// Clear the folders left from adding a take that never finished: any
    /// `.adding-…` folder in a watch's takes untouched for
    /// [`STALE_ADD_S`]. Only a copy is ever put together there, so nothing
    /// is lost; a copy still under way is left alone. Only with the lock.
    pub(super) fn clear_stale_adds(&self) {
        if self.lock.is_none() {
            return;
        }
        let now = std::time::SystemTime::now();
        let stale = |dir: &Path| {
            newest_change(dir)
                .and_then(|t| now.duration_since(t).ok())
                .is_some_and(|age| age.as_secs() >= STALE_ADD_S)
        };
        let watches = fs::read_dir(&self.root).into_iter().flatten().flatten();
        for w in watches {
            let takes = w.path().join(TAKES);
            for e in fs::read_dir(&takes).into_iter().flatten().flatten() {
                let name = e.file_name();
                let ours = name.to_string_lossy().starts_with(ADDING);
                if ours && e.file_type().is_ok_and(|t| t.is_dir()) && stale(&e.path()) {
                    let _ = fs::remove_dir_all(e.path());
                }
            }
        }
    }
}

/// Copy the take planned in `plan` into its watch: put together beside its
/// place and moved in whole. `progress` is told the bytes copied so far;
/// `cancel` set stops it. On any error, or stopped, what was copied is
/// deleted and the original is as it was. Where it went, which a move on
/// the same disk already says.
pub fn copy_add(
    plan: &AddPlan,
    progress: &mut dyn FnMut(u64),
    cancel: &AtomicBool,
) -> Result<PathBuf, String> {
    if let Some(to) = &plan.moved {
        return Ok(to.clone());
    }
    let mut c = Copying {
        done: 0,
        progress,
        cancel,
    };
    let copied = copy_tree_with(&plan.from, &plan.staged, &[], &mut c).and_then(|_| {
        move_in(
            &plan.staged,
            &plan.takes,
            &file_name(&plan.from),
            plan.to.clone(),
        )
    });
    if copied.is_err() {
        let _ = fs::remove_dir_all(&plan.staged);
    }
    copied
}

/// A copy under way: its bytes so far, who is told them, and whether to
/// stop.
pub(super) struct Copying<'a> {
    done: u64,
    progress: &'a mut dyn FnMut(u64),
    cancel: &'a AtomicBool,
}

impl Copying<'_> {
    /// A copy told to no one, never stopped.
    pub(super) fn quiet(f: impl FnOnce(&mut Copying) -> Result<(), String>) -> Result<(), String> {
        let never = AtomicBool::new(false);
        let mut c = Copying {
            done: 0,
            progress: &mut |_| {},
            cancel: &never,
        };
        f(&mut c)
    }
}

/// [`copy_tree`] telling `c` each part copied.
pub(super) fn copy_tree_with(
    from: &Path,
    to: &Path,
    skip: &[&str],
    c: &mut Copying,
) -> Result<(), String> {
    fs::create_dir_all(to).map_err(|e| format!("{}: {e}", to.display()))?;
    for e in fs::read_dir(from).map_err(|e| format!("{}: {e}", from.display()))? {
        let e = e.map_err(|e| format!("{}: {e}", from.display()))?;
        let (src, dst) = (e.path(), to.join(e.file_name()));
        if skip.iter().any(|s| e.file_name() == *s) {
            continue;
        }
        let kind = e
            .file_type()
            .map_err(|e| format!("{}: {e}", src.display()))?;
        if kind.is_dir() {
            copy_tree_with(&src, &dst, &[], c)?;
        } else if kind.is_file() {
            copy_file_with(&src, &dst, c)?;
        } else {
            // A link, a named pipe or a device: reading a pipe would never
            // end, and a link's target may be outside the library.
            return Err(format!(
                "{} is a link or a special file, which can't be copied to another disk: \
                 move it out of the Watches folder first",
                src.display()
            ));
        }
    }
    // The folder's own entries too, where the system allows it (not on
    // Windows, which can't open a folder as a file).
    if let Ok(d) = fs::File::open(to) {
        let _ = d.sync_all();
    }
    Ok(())
}

/// One file copied, its time and permissions kept, synced, telling `c`
/// as it goes.
pub(super) fn copy_file_with(src: &Path, dst: &Path, c: &mut Copying) -> Result<(), String> {
    use std::io::{Read, Write};
    let copied = (|| {
        let mut r = fs::File::open(src)?;
        let mut w = fs::File::create(dst)?;
        let mut buf = vec![0u8; 1 << 20];
        loop {
            if c.cancel.load(Ordering::Relaxed) {
                return Err(std::io::Error::other("stopped"));
            }
            let n = r.read(&mut buf)?;
            if n == 0 {
                break;
            }
            w.write_all(&buf[..n])?;
            c.done += n as u64;
            (c.progress)(c.done);
        }
        w.set_modified(r.metadata()?.modified()?)?;
        w.sync_all()?;
        drop(w);
        fs::set_permissions(dst, r.metadata()?.permissions())
    })();
    copied.map_err(|e| format!("Copying {} to {}: {e}", src.display(), dst.display()))
}

/// When anything in `dir`, or `dir` itself, last changed.
fn newest_change(dir: &Path) -> Option<std::time::SystemTime> {
    let mut newest = fs::metadata(dir).and_then(|m| m.modified()).ok()?;
    let mut stack = vec![dir.to_path_buf()];
    while let Some(d) = stack.pop() {
        for e in fs::read_dir(&d).into_iter().flatten().flatten() {
            let Ok(m) = e.metadata() else { continue };
            if let Ok(t) = m.modified() {
                newest = newest.max(t);
            }
            if m.is_dir() {
                stack.push(e.path());
            }
        }
    }
    Some(newest)
}
