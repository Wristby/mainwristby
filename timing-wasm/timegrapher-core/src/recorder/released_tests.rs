//! A closed hour its saved copy holds whole is kept there alone (#2040).

use super::tests::{append_second, save_fixture};
use super::*;

/// The sound files left in `dir`, by name.
fn sound_in(dir: &Path) -> Vec<String> {
    let mut v: Vec<String> = fs::read_dir(dir)
        .unwrap()
        .map(|e| e.unwrap().file_name().into_string().unwrap())
        .filter(|n| is_sound(n))
        .collect();
    v.sort();
    v
}

/// A recording kept as the app keeps its sessions.
fn fixture(name: &str) -> (Recorder, PathBuf) {
    let (mut r, base) = save_fixture(name);
    r.keep_saved_hours_in_copy();
    (r, base)
}

/// Unless asked, a recording keeps every hour, saved or not.
#[test]
fn a_recording_keeps_its_hours_unless_asked() {
    let (mut r, base) = save_fixture("released-off");
    append_second(&mut r, 2);
    r.pause().unwrap();
    let take = stream(&mut r, &base.join("unsorted"));
    r.tidy().unwrap();
    assert!(!r.releasing());
    assert_eq!(sound_in(&take), ["audio-001.flac"]);
    let dir = r.finish(None).unwrap();
    assert_eq!(sound_in(&dir), ["audio-001.flac"]);
    fs::remove_dir_all(&base).unwrap();
}

/// Tidy until no hour waits to go, as the app's frames do while paused.
fn tidy_all(r: &mut Recorder) {
    let until = std::time::Instant::now() + std::time::Duration::from_secs(30);
    while r.releasing() && std::time::Instant::now() < until {
        r.tidy().unwrap();
        std::thread::sleep(std::time::Duration::from_millis(20));
    }
    assert!(!r.releasing(), "the hour was let go in time");
}

/// A streamed save into `parent`, noted.
fn stream(r: &mut Recorder, parent: &Path) -> PathBuf {
    let copy = r
        .begin_stream_save(parent, "", None, &[])
        .unwrap()
        .write()
        .unwrap();
    r.note_saved(&copy);
    copy.dir
}

/// A kept take stopped: its saved copy holds the closed hour, so the
/// recording folder lets its own go, and reads it from the copy from then
/// on. Carried on and saved again, the copy keeps the hour as it was and
/// gains the next; saved into another folder, the hour is copied from the
/// take.
#[test]
fn a_closed_hour_its_copy_holds_whole_is_kept_there_alone() {
    let (mut r, base) = fixture("released");
    append_second(&mut r, 2);
    let take = stream(&mut r, &base.join("unsorted"));
    // Stop: the hour closes, and the Stop's save holds it as FLAC.
    r.pause().unwrap();
    assert_eq!(stream(&mut r, &base.join("unsorted")), take);
    tidy_all(&mut r);
    let flac = take.join("audio-001.flac");
    assert_eq!(sound_in(r.dir()), Vec::<String>::new(), "no second copy");
    assert_eq!(sound_in(&take), ["audio-001.flac"]);
    assert_eq!(crate::audio::load(&flac).unwrap().samples.len(), 2 * 8000);
    assert_eq!(r.segment_paths(), std::slice::from_ref(&flac));
    assert!(r.hours_reachable());
    let first = fs::read(&flac).unwrap();
    // Carried on: the next hour is the recording's own until it closes.
    r.resume("test");
    append_second(&mut r, 30);
    assert_eq!(sound_in(r.dir()), ["audio-002.wav"]);
    r.pause().unwrap();
    assert_eq!(stream(&mut r, &base.join("unsorted")), take);
    tidy_all(&mut r);
    assert_eq!(sound_in(r.dir()), Vec::<String>::new());
    assert_eq!(sound_in(&take), ["audio-001.flac", "audio-002.flac"]);
    assert_eq!(fs::read(&flac).unwrap(), first, "the first hour left alone");
    // Saved into another folder: every hour, from the take.
    let other = r.save_copy(&base.join("other"), "", None).unwrap();
    assert_eq!(sound_in(&other), ["audio-001.flac", "audio-002.flac"]);
    assert_eq!(fs::read(other.join("audio-001.flac")).unwrap(), first);
    let session: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(other.join("session.json")).unwrap()).unwrap();
    assert_eq!(
        session["segments"],
        serde_json::json!(["audio-001.flac", "audio-002.flac"])
    );
    fs::remove_dir_all(&base).unwrap();
}

/// While listening, an hour closed and saved goes from the recording
/// folder as the next sound is written; the hour still being written is
/// never let go.
#[test]
fn an_hour_closed_while_listening_goes_once_its_copy_holds_it() {
    let (mut r, base) = fixture("released-live");
    append_second(&mut r, 2);
    r.pause().unwrap();
    r.resume("test");
    append_second(&mut r, 30);
    let take = stream(&mut r, &base.join("unsorted"));
    // Kept as FLAC here by now, then let go as more is heard.
    let until = std::time::Instant::now() + std::time::Duration::from_secs(30);
    let mut second = 31;
    while r.releasing() && std::time::Instant::now() < until {
        append_second(&mut r, second);
        second += 1;
        std::thread::sleep(std::time::Duration::from_millis(20));
    }
    assert!(!r.releasing());
    assert_eq!(sound_in(r.dir()), ["audio-002.wav"]);
    assert_eq!(r.segment_paths()[0], take.join("audio-001.flac"));
    assert_eq!(r.segment_paths()[1], r.dir().join("audio-002.wav"));
    fs::remove_dir_all(&base).unwrap();
}

/// A copy moved (filed under a watch) is where the hours it holds alone
/// are read from; one deleted leaves them out of reach, which the app
/// takes as a recording that can't be carried on.
#[test]
fn hours_kept_in_the_copy_alone_follow_it_and_are_missed_when_it_goes() {
    let (mut r, base) = fixture("released-moved");
    append_second(&mut r, 2);
    r.pause().unwrap();
    let from = stream(&mut r, &base.join("unsorted"));
    tidy_all(&mut r);
    let to = base.join("watch").join("moved take");
    fs::create_dir_all(to.parent().unwrap()).unwrap();
    fs::rename(&from, &to).unwrap();
    r.copy_moved(&from, &to);
    assert_eq!(r.segment_paths(), [to.join("audio-001.flac")]);
    assert!(r.hours_reachable());
    fs::remove_dir_all(&to).unwrap();
    assert!(!r.hours_reachable());
    fs::remove_dir_all(&base).unwrap();
}

/// An hour whose copy isn't the same, byte for byte, by the time it would
/// go stays in the recording folder.
#[test]
fn an_hour_its_copy_does_not_hold_whole_stays() {
    let (mut r, base) = fixture("released-changed");
    append_second(&mut r, 2);
    r.pause().unwrap();
    // Kept as FLAC here first, so the save checks the FLAC's bytes.
    r.tidy().unwrap();
    while !r.converting.is_empty() {
        std::thread::sleep(std::time::Duration::from_millis(20));
        r.tidy().unwrap();
    }
    let copy = r
        .begin_stream_save(&base.join("unsorted"), "", None, &[])
        .unwrap()
        .write()
        .unwrap();
    assert_eq!(copy.held_whole.len(), 1);
    // Changed behind the save's back before it is noted: its length no
    // longer the one checked.
    let flac = copy.dir.join("audio-001.flac");
    let mut f = fs::OpenOptions::new().append(true).open(&flac).unwrap();
    f.write_all(&[0; 7]).unwrap();
    drop(f);
    r.note_saved(&copy);
    tidy_all(&mut r);
    assert_eq!(sound_in(r.dir()), ["audio-001.flac"]);
    assert_eq!(r.segment_paths(), [r.dir().join("audio-001.flac")]);
    fs::remove_dir_all(&base).unwrap();
}

/// The byte check: the same bytes at the same length only.
#[test]
fn the_copy_is_checked_byte_for_byte() {
    let dir = std::env::temp_dir().join(format!("tg-released-bytes-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    let here = dir.join("here");
    let bytes: Vec<u8> = (0..3_000_000u32).map(|i| (i * 7 % 251) as u8).collect();
    fs::write(&here, &bytes).unwrap();
    let held = File::open(&here).unwrap();
    let len = bytes.len() as u64;
    let there = dir.join("there");
    fs::write(&there, &bytes).unwrap();
    assert!(released::same_bytes(&held, len, &there).unwrap());
    let mut late = bytes.clone();
    *late.last_mut().unwrap() ^= 1;
    fs::write(&there, &late).unwrap();
    assert!(!released::same_bytes(&held, len, &there).unwrap());
    fs::write(&there, &bytes[..bytes.len() - 1]).unwrap();
    assert!(!released::same_bytes(&held, len, &there).unwrap());
    fs::remove_dir_all(&dir).unwrap();
}

/// Trevor on #2046: no hour counts as held whole in the copy until the
/// copy's folder is synced, so a folder sync that fails lets nothing go;
/// the next save that syncs does.
#[test]
fn nothing_goes_before_the_copys_folder_is_synced() {
    let (mut r, base) = fixture("released-unsynced");
    append_second(&mut r, 2);
    r.pause().unwrap();
    let parent = base.join("unsorted");
    let refused = |step: SaveStep, _: &Path| match step {
        SaveStep::Sync => Err(io::Error::other("injected folder sync failure")),
        _ => Ok(()),
    };
    let copy = r
        .begin_save(&parent, "", None, &[])
        .unwrap()
        .write_using(refused)
        .unwrap();
    assert!(copy.held_whole.is_empty());
    r.note_saved(&copy);
    tidy_all(&mut r);
    // Its keeping as FLAC here done, so one file counts.
    while !r.converting.is_empty() {
        std::thread::sleep(std::time::Duration::from_millis(20));
        r.tidy().unwrap();
    }
    assert_eq!(sound_in(r.dir()), ["audio-001.flac"], "kept here");
    let copy = r
        .begin_save(&parent, "", None, &[])
        .unwrap()
        .write()
        .unwrap();
    assert_eq!(copy.held_whole.len(), 1);
    r.note_saved(&copy);
    tidy_all(&mut r);
    assert_eq!(sound_in(r.dir()), Vec::<String>::new());
    fs::remove_dir_all(&base).unwrap();
}

/// A save whose copy of the hour differs at the moment of its check.
fn tampered_save(r: &mut Recorder, parent: &Path, tamper: impl Fn(&Path)) -> SavedCopy {
    let copy = r
        .begin_save(parent, "", None, &[])
        .unwrap()
        .write_using(|step, dest| {
            if step == SaveStep::Sync {
                tamper(dest);
            }
            Ok(())
        })
        .unwrap();
    r.note_saved(&copy);
    copy
}

/// Trevor's mutants on #2046: an hour kept as FLAC here whose copy is the
/// same length but not the same bytes when checked isn't held whole, and
/// stays here.
#[test]
fn a_copy_differing_byte_for_byte_when_checked_is_not_held_whole() {
    let (mut r, base) = fixture("released-bytes-differ");
    append_second(&mut r, 2);
    r.pause().unwrap();
    while !r.converting.is_empty() {
        std::thread::sleep(std::time::Duration::from_millis(20));
        r.tidy().unwrap();
    }
    let copy = tampered_save(&mut r, &base.join("unsorted"), |dest| {
        let flac = dest.join("audio-001.flac");
        let mut b = fs::read(&flac).unwrap();
        let last = b.len() - 1;
        b[last] ^= 0xff;
        fs::write(&flac, b).unwrap();
    });
    assert!(copy.held_whole.is_empty());
    tidy_all(&mut r);
    assert_eq!(sound_in(r.dir()), ["audio-001.flac"]);
    fs::remove_dir_all(&base).unwrap();
}

/// The same for an hour still a WAV here, held as FLAC in the copy: a
/// copy whose FLAC holds other samples when checked isn't held whole.
#[test]
fn a_copy_differing_sample_for_sample_when_checked_is_not_held_whole() {
    let (mut r, base) = fixture("released-samples-differ");
    // Kept a WAV here, so the copy holds it as FLAC of the WAV's samples.
    r.keep_flac = false;
    append_second(&mut r, 2);
    r.pause().unwrap();
    let other = base.join("other.wav");
    let spec = hound::WavSpec {
        channels: 1,
        sample_rate: 8000,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };
    let mut w = hound::WavWriter::create(&other, spec).unwrap();
    for i in 0..2 * 8000 {
        w.write_sample((i % 300) as i16).unwrap();
    }
    w.finalize().unwrap();
    let copy = tampered_save(&mut r, &base.join("unsorted"), |dest| {
        let flac = dest.join("audio-001.flac");
        fs::remove_file(&flac).unwrap();
        crate::flac::encode_wav(&other, &flac).unwrap();
    });
    assert!(copy.held_whole.is_empty());
    tidy_all(&mut r);
    assert_eq!(sound_in(r.dir()), ["audio-001.wav"]);
    fs::remove_dir_all(&base).unwrap();
}

/// Trevor's mutant on #2046: the hour still being written never goes, even
/// were it noted as held whole (a save never asks to check it, so it is
/// noted here by hand, as a copy that holds it would be).
#[test]
fn the_hour_being_written_never_goes() {
    let (mut r, base) = fixture("released-open");
    append_second(&mut r, 2);
    let take = stream(&mut r, &base.join("unsorted"));
    let wav = take.join("audio-001.wav");
    let len = fs::metadata(&wav).unwrap().len();
    r.take_released(&[HeldWhole {
        name: "audio-001.wav".into(),
        at: wav,
        len,
    }]);
    tidy_all(&mut r);
    assert_eq!(sound_in(r.dir()), ["audio-001.wav"]);
    assert_eq!(r.segment_paths(), [r.dir().join("audio-001.wav")]);
    append_second(&mut r, 3);
    fs::remove_dir_all(&base).unwrap();
}

/// #2052: whether the copy saved last still holds its sound, by stat
/// alone. Nothing saved, nothing there; saved, it is, even as the hour
/// being written grows past the save. Moved in the app, it follows; an
/// hour cut short outside the app, or the take deleted, and it isn't.
#[test]
fn the_copy_saved_last_is_there_until_its_sound_goes() {
    let (mut r, base) = fixture("saved-there");
    append_second(&mut r, 2);
    assert!(!gone(&mut r), "nothing saved yet");
    r.pause().unwrap();
    r.resume("test");
    append_second(&mut r, 30);
    let take = stream(&mut r, &base.join("unsorted"));
    assert!(!gone(&mut r));
    // The hour being written grows after the save: still as saved.
    append_second(&mut r, 31);
    let take2 = stream(&mut r, &base.join("unsorted"));
    assert_eq!(take2, take);
    append_second(&mut r, 32);
    assert!(!gone(&mut r), "the open hour grown past the save");
    // And the copy's own open hour longer than the save left it, as a
    // streamed save appending to it is when a look lands (Trevor on #2060).
    let copy_open = take.join("audio-002.wav");
    assert!(copy_open.exists(), "the open hour is the copy's WAV");
    let mut f = fs::OpenOptions::new()
        .append(true)
        .open(&copy_open)
        .unwrap();
    std::io::Write::write_all(&mut f, &[0; 64]).unwrap();
    drop(f);
    assert!(!gone(&mut r), "the copy's open hour grown");
    // Moved in the app (filed under a watch): it follows.
    let moved = base.join("watches").join("take");
    fs::create_dir_all(moved.parent().unwrap()).unwrap();
    fs::rename(&take, &moved).unwrap();
    r.copy_moved(&take, &moved);
    assert!(!gone(&mut r), "followed the move");
    // A closed hour cut short outside the app: not there.
    let closed = moved.join("audio-001.flac");
    let bytes = fs::read(&closed).unwrap();
    fs::write(&closed, &bytes[..bytes.len() - 1]).unwrap();
    assert!(gone(&mut r), "a closed hour cut short");
    fs::write(&closed, &bytes).unwrap();
    assert!(!gone(&mut r));
    // The open hour's copy cut short: not there.
    let open = moved.join("audio-002.wav");
    let wav = fs::read(&open).unwrap();
    fs::write(&open, &wav[..wav.len() / 2]).unwrap();
    assert!(gone(&mut r), "the open hour cut short");
    fs::write(&open, &wav).unwrap();
    assert!(!gone(&mut r));
    // The take deleted outside the app: not there.
    fs::remove_dir_all(&moved).unwrap();
    assert!(gone(&mut r), "the take deleted");
    fs::remove_dir_all(&base).unwrap();
}

/// #2052: a closed hour the copy holds but the recording keeps too (no
/// opt-in, or not let go yet) is looked for in the copy all the same.
#[test]
fn a_closed_hour_kept_in_both_places_is_looked_for_in_the_copy() {
    let (mut r, base) = save_fixture("saved-there-both");
    append_second(&mut r, 2);
    r.pause().unwrap();
    let take = stream(&mut r, &base.join("unsorted"));
    // Kept here too (as a WAV, or a FLAC once kept as one on its thread).
    assert!(!sound_in(r.dir()).is_empty(), "kept here too");
    assert!(!gone(&mut r));
    fs::remove_file(take.join("audio-001.flac")).unwrap();
    assert!(gone(&mut r), "the copy's hour gone");
    fs::remove_dir_all(&base).unwrap();
}

/// Whether the copy saved last is gone, looked at now.
fn gone(r: &mut Recorder) -> bool {
    r.look_at_saved_copy();
    r.saved_copy_gone()
}

/// Trevor on #2060: saved into another folder after its hour went to the
/// first take alone, the recording reads that hour from the copy saved
/// last. The first take deleted, the sound is still whole where it was
/// saved last, and can be carried on and saved again; the copy saved
/// last deleted, it is gone.
#[test]
fn an_hour_held_alone_follows_a_save_into_another_folder() {
    let (mut r, base) = fixture("saved-elsewhere");
    append_second(&mut r, 2);
    r.pause().unwrap();
    let first = stream(&mut r, &base.join("unsorted"));
    tidy_all(&mut r);
    assert_eq!(
        sound_in(r.dir()),
        Vec::<String>::new(),
        "kept in the take alone"
    );
    let other = stream(&mut r, &base.join("other"));
    assert_ne!(other, first);
    assert_eq!(sound_in(&other), ["audio-001.flac"]);
    fs::remove_dir_all(&first).unwrap();
    assert!(r.hours_reachable(), "read from the copy saved last");
    assert!(!gone(&mut r), "whole where it was saved last");
    assert_eq!(r.segment_paths(), [other.join("audio-001.flac")]);
    fs::remove_dir_all(&other).unwrap();
    assert!(gone(&mut r), "the copy saved last deleted");
    assert!(!r.hours_reachable());
    fs::remove_dir_all(&base).unwrap();
}

/// Felix on #2060: an hour kept in the first take alone, saved into
/// another folder whose sync fails, isn't read from there: it isn't known
/// to be on the disk. So the first take deleted, it is gone, though the
/// copy saved last looks whole; with the sync, the same save moves it.
#[test]
fn an_hour_held_alone_follows_a_save_elsewhere_only_once_checked_there() {
    let (mut r, base) = fixture("saved-elsewhere-unsynced");
    append_second(&mut r, 2);
    r.pause().unwrap();
    let first = stream(&mut r, &base.join("unsorted"));
    tidy_all(&mut r);
    assert_eq!(
        sound_in(r.dir()),
        Vec::<String>::new(),
        "kept in the take alone"
    );
    let refused = |step: SaveStep, _: &Path| match step {
        SaveStep::Sync => Err(io::Error::other("injected folder sync failure")),
        _ => Ok(()),
    };
    let copy = r
        .begin_save(&base.join("other"), "", None, &[])
        .unwrap()
        .write_using(refused)
        .unwrap();
    assert!(copy.held_whole.is_empty(), "not checked there");
    r.note_saved(&copy);
    assert_eq!(
        r.segment_paths(),
        [first.join("audio-001.flac")],
        "read from the first"
    );
    fs::remove_dir_all(&first).unwrap();
    assert!(!r.hours_reachable());
    assert!(gone(&mut r), "its hour gone with the first take");
    fs::remove_dir_all(&base).unwrap();
}
