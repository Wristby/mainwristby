//! Chunked analysis of recordings too long to hold in memory.
//!
//! The recording is decoded block by block and analysed in chunks with a
//! little overlap on each side. The beat template is built once, from the
//! first chunk, and used for every later chunk, so the beat's reference
//! point stays put across chunk boundaries; otherwise the boundaries would
//! show up as a fake periodic component at the chunk length. Beat numbers
//! run on across chunks, so tick and toc keep their sides for the whole run.

use crate::amplitude::{self, AmplitudeWindow};
use crate::analysis::AnalysisConfig;
use crate::audio::{self, AudioError};
use crate::beats::{self, Beat};
use crate::dsp::envelope;
use crate::profile;
use serde::Serialize;
use std::path::Path;

#[derive(Debug, Clone)]
pub struct StreamConfig {
    pub analysis: AnalysisConfig,
    /// Length of each chunk's own stretch of the recording, seconds. Not a
    /// divisor of 60 s, so any boundary effect cannot pose as the fourth wheel.
    pub chunk_s: f64,
    /// Extra audio on each side of a chunk, seconds.
    pub margin_s: f64,
}

/// A chunk's own stretch of the recording by default, seconds
/// ([`StreamConfig::chunk_s`]), and the grid [`amplitude_chunk_of`] groups
/// amplitude windows by whatever the chunks read with.
pub const CHUNK_S: f64 = 47.0;

/// The extra audio on each side of a chunk by default, seconds
/// ([`StreamConfig::margin_s`]), and in [`amplitude_chunk_of`]'s grid.
pub const MARGIN_S: f64 = 1.0;

impl Default for StreamConfig {
    fn default() -> Self {
        StreamConfig {
            analysis: AnalysisConfig::default(),
            chunk_s: CHUNK_S,
            margin_s: MARGIN_S,
        }
    }
}

/// Every beat of a recording, and the amplitude in short windows.
/// Times are seconds from the start of the recording on the sound card's clock.
#[derive(Debug, Clone, Serialize)]
pub struct BeatLog {
    pub sample_rate: u32,
    pub duration_s: f64,
    pub bph: u32,
    pub lift_deg: f64,
    pub beats: Vec<Beat>,
    pub amplitude_windows: Vec<AmplitudeWindow>,
    /// Times of the beats with a clipped sample within their template
    /// window, as [`crate::analysis::Clipping`] counts them.
    #[serde(skip_serializing)]
    pub clipped_beats: Vec<f64>,
    /// Clipped samples in the whole recording.
    pub clipped_samples: usize,
    /// Audio seconds where the beats jumped ([`beats::jumps`]): listening
    /// stopped and started again there, whether or not a break is listed.
    /// [`crate::breaks::with_jumps`] makes them breaks for the readings.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub jumps: Vec<f64>,
    /// Of `jumps`, those where the side sounds told Tick from Tock after
    /// the jump, so the beat numbers there already keep the sides; at the
    /// others the count across the hole is a guess.
    #[serde(skip)]
    pub sided: Vec<f64>,
    /// The breaks, audio seconds, whose sides are named by the beat count
    /// alone ([`crate::breaks::by_count`]): the jumps not in `sided`, or
    /// after [`crate::breaks::renumber`] the breaks it returns.
    #[serde(skip)]
    pub by_count: Vec<f64>,
    /// Clean beats' envelope windows ([`crate::profile::snippet`]) with
    /// each beat's time, sampled evenly across the whole take within a
    /// fixed budget ([`crate::sound_sample`]), so that a stretch anywhere
    /// in it can be looked at by its sound ([`BeatLog::beat_sound`]).
    #[serde(skip)]
    pub snippets: Vec<(f64, Vec<f32>)>,
    /// Whether the chunk the watch was first heard in was read with the
    /// template a short window gave, as live locks on with, because the
    /// chunk's own read both sides in fewer amplitude windows by more than
    /// 2 SE (#1503): the reading then carries
    /// [`crate::measure::Caveat::LockTemplateKept`].
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub lock_template_kept: bool,
}

impl BeatLog {
    /// Leave out everything before `from_s` (audio seconds): the beats, the
    /// amplitude windows that start before it, and the jumps, clipped beats
    /// and kept envelope windows there. The beats keep their numbers, so
    /// Tick and Tock stay named as they were. A lead of noise before the
    /// watch is left out this way ([`crate::session::watch_lead_s`]).
    pub fn keep_from(&mut self, from_s: f64) {
        self.beats.retain(|b| b.time >= from_s);
        self.amplitude_windows.retain(|w| w.start_s >= from_s);
        self.clipped_beats.retain(|&t| t >= from_s);
        for v in [&mut self.jumps, &mut self.sided, &mut self.by_count] {
            v.retain(|&t| t > from_s);
        }
        self.snippets.retain(|s| s.0 >= from_s);
    }

    /// [`crate::measure::stretch_beat_sound`] for `beats`, a stretch's
    /// beats as this log holds them (audio time): the profiles of their
    /// kept envelope windows, Tick from the even beats.
    pub fn beat_sound(
        &self,
        beats: &[Beat],
        cfg: &crate::amplitude::AmplitudeConfig,
    ) -> Option<bool> {
        let find = |t: f64| {
            let k = self.snippets.partition_point(|s| s.0 < t - 1e-9);
            self.snippets
                .get(k)
                .filter(|s| (s.0 - t).abs() < 1e-9)
                .map(|s| s.1.as_slice())
        };
        let snips: Vec<(f64, bool, &[f32])> = beats
            .iter()
            .filter(|b| b.is_good())
            .filter_map(|b| Some((b.time, b.index.rem_euclid(2) == 0, find(b.time)?)))
            .collect();
        let beat = 3600.0 / self.bph.max(1) as f64;
        crate::measure::stretch_beat_sound(
            &snips,
            beats.first()?.time,
            beats.last()?.time,
            self.sample_rate as f64,
            2.0 * beat,
            cfg,
        )
    }
}

#[derive(Clone)]
struct State {
    fs: f64,
    cfg: StreamConfig,
    template: Option<Vec<f32>>,
    /// The template a short window gave, to read the chunk the watch is
    /// first heard in with in place of that chunk's own ([`State::chunk`]).
    lock_try: Option<Vec<f32>>,
    /// Whether the chunk the watch was first heard in is read with the
    /// template a short window gave ([`BeatLog::lock_template_kept`]).
    lock_template_kept: bool,
    /// The typical beat's match with `template` at the end of the sound
    /// read so far ([`beats::detect_after`]).
    level: Option<f32>,
    /// Tick and Tock told apart across each jump by their sound, as live
    /// listening tells them.
    sides: beats::SideCheck,
    jumps: Vec<f64>,
    bph: u32,
    beats: Vec<Beat>,
    /// The amplitude windows, put together after the last chunk from
    /// the windows each chunk's [`AmpJob`] found.
    amp: Vec<AmplitudeWindow>,
    /// Next amplitude window start, seconds.
    next_amp_s: f64,
    /// Chunks analysed so far.
    chunks: usize,
    /// Each side swap's time, with the number of chunks analysed before
    /// it: it swaps the windows those chunks found from that time on.
    swaps: Vec<(usize, f64)>,
    /// The amplitude windows found so far, `(chunk, windows)` as they
    /// come, in any order; put together after the last chunk.
    found: Vec<(usize, Vec<AmplitudeWindow>)>,
    /// The amplitude jobs sent and not yet all back, in order: each one's
    /// chunk and end, seconds.
    amp_out: std::collections::VecDeque<(usize, f64)>,
    /// Chunks whose amplitude windows are back, past `amp_out`'s first.
    amp_back: std::collections::BTreeSet<usize>,
    /// Every amplitude window starting before this, seconds, is found.
    amp_found_to_s: f64,
    clipped_beats: Vec<f64>,
    clipped_samples: usize,
    snippets: crate::sound_sample::SoundSample<Vec<f32>>,
}

impl State {
    /// Analyse chunk `c`, keeping the beats whose time falls in its own
    /// stretch. Its envelope and clipped samples, which depend on its
    /// sound alone, were found beforehand ([`Prepared::prepare`]), so that
    /// many chunks can have them found at once; the rest carries on from
    /// the chunk before, in order.
    ///
    /// Returns what is needed to find the amplitude windows starting in
    /// the chunk, which are found off this thread ([`AmpJob::run`]).
    fn chunk(&mut self, c: &Prepared) -> Option<AmpJob> {
        if self.template.is_some() {
            return self.read_chunk(c);
        }
        let before = self.clone();
        let job = self.read_chunk(c);
        if self.template.is_none() {
            return job;
        }
        // The chunk the watch is first heard in: read again with the
        // template a short window gives, as live locks on with, which is
        // kept when the chunk's own reads both sides in fewer amplitude
        // windows by more than 2 SE, as live keeps its lock's (#1503).
        let Some(lock) = lock_template(&c.env, self.fs, self.bph) else {
            return job;
        };
        let mut alt = before;
        alt.lock_try = Some(lock);
        let alt_job = alt.read_chunk(c);
        if alt.template.is_none() {
            return job;
        }
        let (fs, cfg) = (self.fs, &self.cfg.analysis);
        let wins =
            |j: &Option<AmpJob>| j.as_ref().map_or_else(Vec::new, |j| j.run(&c.env, fs, cfg));
        #[cfg_attr(not(test), expect(unused_mut, reason = "spoiled in tests"))]
        let mut own = wins(&job);
        #[cfg(test)]
        if tests::SPOIL_OWN.with(std::cell::Cell::get) {
            own.iter_mut().for_each(|w| w.even_deg = None);
        }
        if !crate::amplitude::reads_fewer_sides(&wins(&alt_job), &own) {
            return job;
        }
        alt.lock_template_kept = true;
        *self = alt;
        alt_job
    }

    /// [`State::chunk`] read with the template it has, or else the one
    /// its own sound gives ([`State::first_beats`]).
    fn read_chunk(&mut self, c: &Prepared) -> Option<AmpJob> {
        self.chunks += 1;
        let (x, x0, core_a, core_b, env) = (&c.x[..], c.x0, c.core_a, c.core_b, &c.env[..]);
        let fs = self.fs;
        let (local, heard_first) = match &self.template {
            Some(t) => {
                let at = x0 as f64 / fs;
                let (b, level) = beats::detect_after_at(env, fs, self.bph, t, self.level, at);
                self.level = level;
                (b, false)
            }
            None => self.first_beats(env)?,
        };
        let off = x0 as f64 / fs;
        let beat = 3600.0 / self.bph as f64;

        // Number the chunk's beats on from the last beat kept so far.
        let anchor = beats::anchor_of(&local, off, core_a, core_b, self.beats.last(), beat)?;
        let (mut numbered, _) = beats::number_on(
            &local,
            anchor,
            local[anchor].time + off,
            self.beats.last(),
            beat,
        );
        // Jumps in the timing, with the beats just before the chunk so one
        // at its start is seen too.
        let end = numbered[anchor..]
            .iter()
            .position(|b| b.time + off >= core_b)
            .map_or(numbered.len(), |p| anchor + p);
        // The good beats before the chunk, reaching back past a stretch of
        // noise beats after a dropout ([`beats::jumps_among_good`]).
        let before: Vec<Beat> = beats::good_tail(&self.beats, beats::JUMP_CONTEXT)
            .iter()
            .map(|b| Beat {
                time: b.time - off,
                ..*b
            })
            .collect();
        let cuts: Vec<usize> = beats::jumps_among_good(&numbered[anchor..end], &before)
            .into_iter()
            .map(|p| p + anchor)
            .collect();
        let kept_from = self.beats.len();
        for k in anchor..end {
            let b = numbered[k];
            let t = b.time + off;
            // Seen again from the next chunk: the same jump. Where the
            // watch is first heard after noise, its first beat is one too.
            let cut = cuts.contains(&k) || (heard_first && k == anchor);
            if cut && !self.jumps.last().is_some_and(|&j| t - j <= 1.0) {
                self.jumps.push(t);
                self.sides.jump(t);
            }
            if let Some(last) = self.beats.last() {
                if t - last.time < 0.5 * beat || b.index <= last.index {
                    continue;
                }
            }
            self.beats.push(Beat { time: t, ..b });
            if let Some(w) = beat_window(env, fs, &b) {
                if let Some((tick, w)) = sound_snippet(&b, w) {
                    self.snippets.push(t, tick, w.to_vec());
                }
                self.sides.beat(t, b.index, b.quality, w);
            }
            if let Some((j, beats::SideCall::Swapped)) = self.sides.settle() {
                swap_sides_from(j, &mut self.beats, &mut []);
                self.snippets.swap_sides_from(j);
                // The windows of the chunks before this one, found
                // elsewhere, are swapped when put together.
                self.swaps.push((self.chunks - 1, j));
                swap_sides_from(j - off, &mut numbered, &mut []);
            }
        }
        self.count_clipping(&c.clipped, off, core_a, core_b, kept_from);

        self.amplitude_job(numbered, off, off + x.len() as f64 / fs, core_b, beat)
    }

    /// The beats of a chunk before a watch has been heard, and whether the
    /// watch is first heard in it after beats were already kept; none
    /// where the chunk holds no sound.
    fn first_beats(&mut self, env: &[f32]) -> Option<(Vec<Beat>, bool)> {
        let a = &self.cfg.analysis;
        let f = first_beats_in(env, self.fs, a.bph, a)?;
        self.bph = f.bph;
        let mut heard_first = false;
        let mut found = f.beats;
        if let Some(t) = f.template {
            // A short window's template, tried in its place ([`State::chunk`]).
            if let Some(lock) = self.lock_try.take() {
                let (b, level) = beats::detect_after(env, self.fs, f.bph, &lock, None);
                (found, self.template, self.level) = (b, Some(lock), level);
            } else {
                self.template = Some(t);
                self.level = f.level;
            }
            // The beats found before the watch was heard are noise,
            // and no count of beats runs on from them.
            heard_first = !self.beats.is_empty();
        }
        Some((found, heard_first))
    }

    /// Clipping, counted on this chunk's own stretch: its clipped samples
    /// (`idx`, the chunk's clipped sample indices) in `[core_a, core_b)`,
    /// and which beats kept from `kept_from` on clipped.
    fn count_clipping(
        &mut self,
        idx: &[usize],
        off: f64,
        core_a: f64,
        core_b: f64,
        kept_from: usize,
    ) {
        let fs = self.fs;
        if !idx.is_empty() {
            let at = |i: usize| off + i as f64 / fs;
            self.clipped_samples += idx
                .iter()
                .filter(|&&i| at(i) >= core_a && at(i) < core_b)
                .count();
            let (pre, post) = (beats::PRE_S, beats::POST_S);
            for b in &self.beats[kept_from..] {
                let lo = ((b.time - pre - off) * fs).floor().max(0.0) as usize;
                let hi = ((b.time + post - off) * fs).ceil().max(0.0) as usize;
                let k = idx.partition_point(|&i| i < lo);
                if idx.get(k).is_some_and(|&i| i <= hi) {
                    self.clipped_beats.push(b.time);
                }
            }
        }
    }

    /// Amplitude on a fixed grid of windows starting inside a chunk that
    /// starts at `off` and ends at `x_end` seconds: which windows, found
    /// by [`AmpJob::run`].
    fn amplitude_job(
        &mut self,
        numbered: Vec<Beat>,
        off: f64,
        x_end: f64,
        core_b: f64,
        beat: f64,
    ) -> Option<AmpJob> {
        let w = self.cfg.analysis.amplitude_window_s;
        let mut to = self.next_amp_s;
        while to < core_b && to + w <= x_end {
            to += w;
        }
        if to > self.next_amp_s {
            self.amp_out.push_back((self.chunks - 1, to));
        }
        (to > self.next_amp_s).then(|| AmpJob {
            chunk: self.chunks - 1,
            numbered,
            off,
            from_s: std::mem::replace(&mut self.next_amp_s, to),
            to_s: to,
            beat,
        })
    }

    /// The amplitude windows of every chunk, `found` as `(chunk,
    /// windows)` in any order: put in chunk order, each swapped by the
    /// side swaps made after its chunk from its start on, as when they
    /// were found in turn.
    fn put_amplitude_together(&mut self, found: Vec<(usize, Vec<AmplitudeWindow>)>) {
        let mut found = std::mem::take(&mut self.found)
            .into_iter()
            .chain(found)
            .collect::<Vec<_>>();
        found.sort_by_key(|f| f.0);
        for (k, wins) in found {
            for mut w in wins {
                swap_found(&mut w, k, &self.swaps);
                self.amp.push(w);
            }
        }
    }

    /// The amplitude windows of chunk `k`, just found.
    fn windows_found(&mut self, (k, wins): (usize, Vec<AmplitudeWindow>)) {
        self.found.push((k, wins));
        self.amp_back.insert(k);
        while let Some(&(first, to_s)) = self.amp_out.front() {
            if !self.amp_back.remove(&first) {
                break;
            }
            self.amp_out.pop_front();
            self.amp_found_to_s = to_s;
        }
    }
}

/// Swap the sides of amplitude window `w`, found in chunk `k`, as the
/// side `swaps` made after that chunk say ([`State::swaps`]).
pub(crate) fn swap_found(w: &mut AmplitudeWindow, k: usize, swaps: &[(usize, f64)]) {
    let n = swaps
        .iter()
        .filter(|&&(after, t)| after > k && w.start_s >= t)
        .count();
    if n % 2 == 1 {
        w.swap_sides();
    }
}

/// The chunk, counted from 0, that the window of `window_s` starting at
/// `start_s` falls in on a grid of [`CHUNK_S`] with [`MARGIN_S`]: the
/// first whose own stretch ends after it starts, with room for the window
/// in its margin, as a default read's amplitude job takes it
/// ([`State::amplitude_job`]). The one grid a saved read and live both
/// group the windows by for [`amplitude::withhold_faint_by_chunk`], from
/// these constants and not a read's config, so the two can't differ
/// (#1738).
pub fn amplitude_chunk_of(start_s: f64, window_s: f64) -> usize {
    let k = (start_s / CHUNK_S).floor().max(0.0) as usize;
    let core_b = (k + 1) as f64 * CHUNK_S;
    k + usize::from(start_s + window_s > core_b + MARGIN_S + 1e-9)
}

/// The amplitude windows starting in one chunk, from `from_s` to `to_s`
/// seconds, and what finding them needs besides the chunk's envelope:
/// its numbered beats, which the in-order analysis gives
/// ([`State::chunk`]).
struct AmpJob {
    /// The chunk's place in the recording, counted from 0.
    chunk: usize,
    numbered: Vec<Beat>,
    /// The chunk's start, seconds.
    off: f64,
    from_s: f64,
    to_s: f64,
    beat: f64,
}

impl AmpJob {
    /// The windows on `env`, the chunk's envelope, at the recording's
    /// times.
    fn run(&self, env: &[f32], fs: f64, cfg: &AnalysisConfig) -> Vec<AmplitudeWindow> {
        // An amplitude thread's panic, for the test that it comes out of
        // the reading: windows of 1.25 s.
        #[cfg(test)]
        assert!(
            cfg.amplitude_window_s != 1.25,
            "test: a chunk's amplitude failed"
        );
        let off = self.off;
        let mut wins = amplitude::windows_between(
            env,
            fs,
            &self.numbered,
            2.0 * self.beat,
            cfg.amplitude_window_s,
            self.from_s - off,
            self.to_s - off,
            &cfg.amplitude,
        );
        for win in &mut wins {
            win.start_s += off;
            win.end_s += off;
        }
        wins
    }
}

/// Number every beat from `t` seconds on one further, which swaps Tick
/// and Tock back after a jump ([`beats::SideCheck`]), and swap the sides of
/// the amplitude windows from there.
fn swap_sides_from(t: f64, beats: &mut [Beat], amp: &mut [AmplitudeWindow]) {
    for b in beats.iter_mut().filter(|b| b.time >= t) {
        b.index += 1;
    }
    for w in amp.iter_mut().filter(|w| w.start_s >= t) {
        w.swap_sides();
    }
}

/// Analyse a WAV or FLAC file of any length into a beat log. `progress`
/// is called with the seconds of audio processed so far.
pub fn analyze_file(
    path: &Path,
    cfg: &StreamConfig,
    progress: impl FnMut(f64),
) -> Result<BeatLog, AudioError> {
    analyze_files(&[path], cfg, progress)
}

/// Analyse several files as one continuous recording, in the order given
/// (a long capture split into segments with no gaps between them).
pub fn analyze_files(
    paths: &[&Path],
    cfg: &StreamConfig,
    progress: impl FnMut(f64),
) -> Result<BeatLog, AudioError> {
    analyze_files_peak(paths, cfg, progress).map(|(log, _)| log)
}

/// [`analyze_files`], with the size of the loudest sample read (full
/// scale 1), found as each block is read: for the take's peak level
/// ([`crate::analysis::Clipping::of`]) with no second pass.
pub fn analyze_files_peak(
    paths: &[&Path],
    cfg: &StreamConfig,
    progress: impl FnMut(f64),
) -> Result<(BeatLog, f32), AudioError> {
    let Some(first) = paths.first() else {
        return Err(AudioError::Unsupported("no files given".into()));
    };
    let info = audio::info(first)?;
    for p in &paths[1..] {
        let i = audio::info(p)?;
        if i.sample_rate != info.sample_rate {
            return Err(AudioError::Unsupported(format!(
                "{} is at {} Hz but {} is at {} Hz",
                p.display(),
                i.sample_rate,
                first.display(),
                info.sample_rate
            )));
        }
    }
    let mut peak = 0f32;
    let log = analyze_fed(
        info.sample_rate,
        cfg,
        prepare_threads(),
        |push| {
            // Each file is decoded to its end, but no further file once
            // the reading has stopped.
            let mut wanted = true;
            for path in paths {
                if !wanted {
                    break;
                }
                audio::stream(path, 1 << 16, |block| {
                    if wanted {
                        peak = block.iter().fold(peak, |m, v| m.max(v.abs()));
                    }
                    wanted = wanted && push(block);
                })?;
            }
            Ok(())
        },
        progress,
    )?;
    Ok((log, peak))
}

/// Analyse a recording held in memory into a beat log, chunk by chunk
/// exactly as [`analyze_files`] reads a file, so that a reading of a file
/// and of the same audio in memory rest on the same beats.
pub fn analyze_samples(samples: &[f32], sample_rate: u32, cfg: &StreamConfig) -> BeatLog {
    let fed = |push: &mut dyn FnMut(&[f32]) -> bool| {
        samples.chunks(1 << 16).all(push);
        Ok(())
    };
    analyze_fed(sample_rate, cfg, prepare_threads(), fed, |_| {})
        .expect("sound held in memory reads without error")
}

/// Threads to prepare chunks on: every core but one, which the decoding
/// and the in-order analysis keep busy.
pub(crate) fn prepare_threads() -> usize {
    std::thread::available_parallelism().map_or(1, |n| n.get().saturating_sub(1).max(1))
}

/// Chunks cut and waiting to be prepared, and prepared and waiting to be
/// analysed, for each preparing thread: enough to keep every thread busy,
/// few enough to hold little (a 48 s chunk at 48 kHz, with its
/// envelope, is about 18 MB).
const QUEUED_PER_THREAD: usize = 2;

/// The sound `feed` passes to the function it is given, read as one
/// recording, in three stages that run at once: the sound is cut into
/// chunks on one thread, each chunk's envelope and clipping are found on
/// `threads` threads ([`Prepared::prepare`]), and the chunks are analysed
/// in order on this one ([`State::chunk`]), which calls `progress` with
/// the seconds read so far. Each chunk and its analysis are the same
/// whatever the number of threads, so the log is too.
fn analyze_fed(
    sample_rate: u32,
    cfg: &StreamConfig,
    threads: usize,
    feed: impl FnOnce(&mut dyn FnMut(&[f32]) -> bool) -> Result<(), AudioError> + Send,
    progress: impl FnMut(f64),
) -> Result<BeatLog, AudioError> {
    analyze_fed_seen(sample_rate, cfg, threads, feed, progress, |_| {}, false)
}

/// A chunk just analysed, in order, as [`analyze_fed_seen`] shows it: its
/// sound, and the beats kept so far. A beat kept is final but for its
/// side: a side swap ([`State::chunk`]) adds 1 to the numbers of the
/// beats from its time on, at a pending jump's time or, when the take's
/// sides are named the other way round, at minus infinity (all of them).
pub(crate) struct Seen<'a> {
    /// The chunk's sound, its margins included, from sample `x0` on.
    pub x: &'a [f32],
    pub x0: usize,
    /// Its own stretch's start, seconds.
    pub core_a: f64,
    pub beats: &'a [Beat],
    pub bph: u32,
    /// Every side swap so far, in order: chunks analysed before it, and
    /// its time.
    pub swaps: &'a [(usize, f64)],
    /// The jump whose sides are still to be checked, seconds: a swap may
    /// still come at it.
    pub pending: Option<f64>,
    /// Whether the watch has been heard: until it is, the beat rate is
    /// guessed again from each chunk, so `bph` may change.
    pub heard: bool,
    /// The amplitude windows found so far, `(chunk, windows)` in any
    /// order, each still to be swapped by the `swaps` made after its chunk
    /// ([`swap_found`]); every window starting before `windows_to_s` is
    /// among them.
    pub windows: &'a [(usize, Vec<AmplitudeWindow>)],
    pub windows_to_s: f64,
    pub clipped_beats: &'a [f64],
    pub clipped_samples: usize,
    pub jumps: &'a [f64],
    pub sided: &'a [f64],
    /// [`BeatLog::lock_template_kept`] so far.
    pub lock_template_kept: bool,
}

/// [`analyze_fed`], with `seen` shown each chunk once it is analysed, in
/// order (#1514): a take kept as its analysis while it is recorded reads
/// its beats as they come.
pub(crate) fn analyze_fed_seen(
    sample_rate: u32,
    cfg: &StreamConfig,
    threads: usize,
    feed: impl FnOnce(&mut dyn FnMut(&[f32]) -> bool) -> Result<(), AudioError> + Send,
    mut progress: impl FnMut(f64),
    mut seen: impl FnMut(Seen),
    in_step: bool,
) -> Result<BeatLog, AudioError> {
    use std::sync::mpsc::sync_channel;
    let threads = threads.max(1);
    let fs = sample_rate as f64;
    let mut st = State::new(sample_rate, cfg);
    let env_cfg = &cfg.analysis.envelope;
    let queued = QUEUED_PER_THREAD * threads;
    let (cut_tx, cut_rx) = sync_channel::<(usize, Prepared)>(queued);
    let (done_tx, done_rx) = sync_channel::<(usize, Prepared)>(queued);
    // Owned by the preparing threads alone: once they have all stopped
    // (the analysis panicked, or every one of them did), the cutter's
    // sends fail and it stops, so nothing waits on it.
    let cut_rx = std::sync::Arc::new(std::sync::Mutex::new(cut_rx));
    // Chunks analysed in order, waiting for their amplitude windows to be
    // found, and the windows found, in any order.
    let (job_tx, job_rx) = sync_channel::<(AmpJob, Prepared)>(queued);
    let job_rx = std::sync::Arc::new(std::sync::Mutex::new(job_rx));
    let (wins_tx, wins_rx) = std::sync::mpsc::channel();
    let total = std::thread::scope(|sc| {
        let cutter = sc.spawn(move || cut(fs, cfg, feed, cut_tx));
        for rx in std::iter::repeat_n(cut_rx, threads) {
            let tx = done_tx.clone();
            sc.spawn(move || prepare_all(&rx, &tx, fs, env_cfg));
        }
        drop(done_tx);
        for rx in std::iter::repeat_n(job_rx, threads) {
            let tx = wins_tx.clone();
            sc.spawn(move || amplitude_all(&rx, &tx, fs, cfg));
        }
        drop(wins_tx);
        in_order(
            &mut st,
            (done_rx, &wins_rx),
            &job_tx,
            &mut progress,
            &mut seen,
            in_step,
        );
        drop(job_tx);
        cutter.join().expect("the cutting thread panicked")
    })?;
    st.put_amplitude_together(wins_rx.into_iter().collect());
    progress(total as f64 / fs);
    Ok(st.finish(sample_rate, total))
}

/// A chunk's amplitude windows, found: its number, and them.
type Found = (usize, Vec<AmplitudeWindow>);

/// A queue several threads take from, each item once.
type Shared<T> = std::sync::Arc<std::sync::Mutex<std::sync::mpsc::Receiver<T>>>;

/// [`analyze_fed`]'s first stage: the sound `feed` passes, cut into
/// chunks and sent, numbered, to `tx` until nothing more is wanted; with
/// the samples read.
fn cut(
    fs: f64,
    cfg: &StreamConfig,
    feed: impl FnOnce(&mut dyn FnMut(&[f32]) -> bool) -> Result<(), AudioError>,
    tx: std::sync::mpsc::SyncSender<(usize, Prepared)>,
) -> Result<usize, AudioError> {
    let mut c = Cutter::new(fs, cfg);
    let mut n = 0;
    // False once nothing more is wanted.
    let wanted = std::cell::Cell::new(true);
    let mut send = |p: Prepared| {
        if wanted.get() && tx.send((n, p)).is_err() {
            wanted.set(false);
        }
        n += 1;
    };
    feed(&mut |block| {
        if wanted.get() {
            c.push(block, &mut send);
        }
        wanted.get()
    })?;
    Ok(c.finish(&mut send))
}

/// [`analyze_fed`]'s second stage, on one of its threads: prepare chunks
/// from `rx` and send them to `tx` until either is closed.
fn prepare_all(
    rx: &Shared<(usize, Prepared)>,
    tx: &std::sync::mpsc::SyncSender<(usize, Prepared)>,
    fs: f64,
    cfg: &crate::dsp::EnvelopeConfig,
) {
    loop {
        let next = rx.lock().expect("a preparing thread panicked").recv();
        let Ok((i, mut c)) = next else { break };
        c.prepare(fs, cfg);
        if tx.send((i, c)).is_err() {
            break;
        }
    }
}

/// The amplitude windows of each chunk from `rx`, sent to `tx` with the
/// chunk's number, on one of [`analyze_fed`]'s threads, until either is
/// closed.
fn amplitude_all(
    rx: &Shared<(AmpJob, Prepared)>,
    tx: &std::sync::mpsc::Sender<(usize, Vec<AmplitudeWindow>)>,
    fs: f64,
    cfg: &StreamConfig,
) {
    loop {
        let next = rx.lock().expect("an amplitude thread panicked").recv();
        let Ok((job, c)) = next else { break };
        if tx
            .send((job.chunk, job.run(&c.env, fs, &cfg.analysis)))
            .is_err()
        {
            break;
        }
    }
}

/// [`analyze_fed`]'s third stage: the prepared chunks from `rx`, analysed
/// in the order cut whatever order they come in, each chunk's amplitude
/// job sent to `jobs` and the windows found taken from `wins` as they
/// come, and `progress` told each chunk's end but the last. `in_step`
/// waits for each chunk's windows before the next chunk is shown, so
/// what `seen` is shown never depends on how fast the amplitude threads
/// run: a test's schedule, never a recording's (#1938).
fn in_order(
    st: &mut State,
    (rx, wins): (
        std::sync::mpsc::Receiver<(usize, Prepared)>,
        &std::sync::mpsc::Receiver<Found>,
    ),
    jobs: &std::sync::mpsc::SyncSender<(AmpJob, Prepared)>,
    progress: &mut impl FnMut(f64),
    seen: &mut impl FnMut(Seen),
    in_step: bool,
) {
    let mut ready = std::collections::BTreeMap::new();
    let mut next = 0;
    for (i, c) in rx {
        ready.insert(i, c);
        while let Some(c) = ready.remove(&next) {
            let job = st.chunk(&c);
            next += 1;
            while let Ok(found) = wins.try_recv() {
                st.windows_found(found);
            }
            seen(Seen {
                x: &c.x,
                x0: c.x0,
                core_a: c.core_a,
                beats: &st.beats,
                bph: st.bph,
                swaps: &st.swaps,
                pending: st.sides.pending_since(),
                heard: st.template.is_some(),
                windows: &st.found,
                windows_to_s: st.amp_found_to_s,
                clipped_beats: &st.clipped_beats,
                clipped_samples: st.clipped_samples,
                jumps: &st.jumps,
                sided: st.sides.sided(),
                lock_template_kept: st.lock_template_kept,
            });
            // The last chunk's end is reported once, by the caller.
            if c.core_b.is_finite() {
                progress(c.core_b);
            }
            // Stops when the amplitude threads have (one panicked).
            if job.is_some_and(|job| jobs.send((job, c)).is_err()) {
                return;
            }
            while in_step && !st.amp_out.is_empty() {
                let Ok(found) = wins.recv() else { return };
                st.windows_found(found);
            }
        }
    }
}

/// One chunk of the recording with what its sound alone gives: its
/// envelope and its clipped samples. Chunks are prepared several at a
/// time, each on a thread of its own, and analysed in order after
/// ([`State::chunk`]).
struct Prepared {
    /// The chunk's sound, margins included, starting at sample `x0`.
    x: Vec<f32>,
    x0: usize,
    /// Its own stretch, seconds.
    core_a: f64,
    core_b: f64,
    env: Vec<f32>,
    /// Indices into `x` of its clipped samples.
    clipped: Vec<usize>,
}

impl Prepared {
    fn prepare(&mut self, fs: f64, cfg: &crate::dsp::EnvelopeConfig) {
        // A preparing thread's panic, for the test that it comes out of
        // the reading.
        #[cfg(test)]
        assert!(
            !self.x.first().is_some_and(|v| v.is_nan()),
            "test: a chunk failed"
        );
        self.env = envelope(&self.x, fs, cfg);
        self.clipped = crate::diagnose::clipped_indices(&self.x, crate::analysis::CLIP_LEVEL);
    }
}

/// Cuts sound passed in blocks of any size into chunks on a fixed grid:
/// each chunk's own stretch with a margin on either side.
struct Cutter {
    fs: f64,
    core: usize,
    margin: usize,
    /// `buf` holds samples from absolute index `buf0`; the next chunk's own
    /// stretch starts at `next`.
    buf: Vec<f32>,
    buf0: usize,
    next: usize,
    total: usize,
}

impl Cutter {
    fn new(fs: f64, cfg: &StreamConfig) -> Self {
        Cutter {
            fs,
            core: (cfg.chunk_s * fs).round() as usize,
            margin: (cfg.margin_s * fs).round() as usize,
            buf: Vec::new(),
            buf0: 0,
            next: 0,
            total: 0,
        }
    }

    fn chunk(&self, from: usize, to: usize, core_b: f64) -> Prepared {
        Prepared {
            x: self.buf[from - self.buf0..to - self.buf0].to_vec(),
            x0: from,
            core_a: self.next as f64 / self.fs,
            core_b,
            env: Vec::new(),
            clipped: Vec::new(),
        }
    }

    fn push(&mut self, block: &[f32], out: &mut impl FnMut(Prepared)) {
        let (core, margin) = (self.core, self.margin);
        self.buf.extend_from_slice(block);
        self.total += block.len();
        while self.buf0 + self.buf.len() >= self.next + core + margin {
            let from = self.next.saturating_sub(margin);
            out(self.chunk(
                from,
                self.next + core + margin,
                (self.next + core) as f64 / self.fs,
            ));
            self.next += core;
            let keep_from = self.next.saturating_sub(margin);
            self.buf.drain(..keep_from - self.buf0);
            self.buf0 = keep_from;
        }
    }

    /// The last chunk, if any sound is left, running to the end; the
    /// samples read in all.
    fn finish(self, out: &mut impl FnMut(Prepared)) -> usize {
        if self.total > self.next {
            let from = self.next.saturating_sub(self.margin);
            out(self.chunk(from, self.buf0 + self.buf.len(), f64::INFINITY));
        }
        self.total
    }
}

impl State {
    fn new(sample_rate: u32, cfg: &StreamConfig) -> Self {
        State {
            fs: sample_rate as f64,
            cfg: cfg.clone(),
            template: None,
            lock_try: None,
            lock_template_kept: false,
            level: None,
            sides: beats::SideCheck::default(),
            jumps: Vec::new(),
            bph: cfg.analysis.bph.unwrap_or(0),
            beats: Vec::new(),
            amp: Vec::new(),
            next_amp_s: 0.0,
            chunks: 0,
            swaps: Vec::new(),
            found: Vec::new(),
            amp_out: Default::default(),
            amp_back: Default::default(),
            amp_found_to_s: 0.0,
            clipped_beats: Vec::new(),
            clipped_samples: 0,
            snippets: Default::default(),
        }
    }

    /// The log of a recording of `total` samples, every chunk analysed.
    fn finish(self, sample_rate: u32, total: usize) -> BeatLog {
        BeatLog {
            sample_rate,
            duration_s: total as f64 / self.fs,
            bph: self.bph,
            lift_deg: self.cfg.analysis.amplitude.lift_deg,
            beats: self.beats,
            amplitude_windows: {
                let mut amp = self.amp;
                let w = self.cfg.analysis.amplitude_window_s;
                amplitude::withhold_faint_by_chunk(&mut amp, |s| amplitude_chunk_of(s, w));
                amplitude::reject_side_outliers(&mut amp, amplitude::OUTLIER_SPAN_S);
                amp
            },
            clipped_beats: self.clipped_beats,
            clipped_samples: self.clipped_samples,
            by_count: crate::breaks::by_count(self.jumps.iter().copied(), self.sides.sided()),
            jumps: self.jumps,
            sided: self.sides.sided().to_vec(),
            snippets: self.snippets.into_items(),
            lock_template_kept: self.lock_template_kept,
        }
    }
}

/// Beat `b`'s envelope window on the short template
/// ([`crate::profile::snippet`]), times from the start of `env`: the
/// window the beat sound sample and the side check keep.
fn beat_window<'a>(env: &'a [f32], fs: f64, b: &Beat) -> Option<&'a [f32]> {
    profile::snippet(env, fs, b.time, crate::amplitude::UnlockWindow::SHORT)
}

/// Beat `b`'s window `w` as the beat sound is judged from it: only a good
/// beat's ([`Beat::is_good`]), with whether it is a Tick (an even beat).
/// The one choice for the take's beat sound sample and the first chunk's
/// watch test ([`watch_heard_in`]).
fn sound_snippet<'a>(b: &Beat, w: &'a [f32]) -> Option<(bool, &'a [f32])> {
    b.is_good().then_some((b.index.rem_euclid(2) == 0, w))
}

/// Whether the first stretch's `beats` (times from the start of `env`)
/// are a watch's, as every reading judges a stretch: by their timing
/// scatter (`jitter_us`) and, where that is in doubt
/// ([`crate::measure::beat_sound_needed`]), by their averaged sound
/// ([`crate::measure::no_watch_reason`]). The stretch holds whole scatter
/// windows wherever it has a scatter, so its regularity is assessed.
fn watch_heard_in(
    env: &[f32],
    fs: f64,
    bph: u32,
    beats: &[Beat],
    jitter_us: Option<f64>,
    cfg: &crate::amplitude::AmplitudeConfig,
) -> bool {
    let sound = || {
        let snips: Vec<(bool, &[f32])> = beats
            .iter()
            .filter_map(|b| sound_snippet(b, beat_window(env, fs, b)?))
            .collect();
        let osc_period_s = 2.0 * crate::timing::beat_period_s(None, bph);
        crate::measure::beat_sound_found(snips, fs, osc_period_s, cfg)
    };
    let sound = crate::measure::beat_sound_needed(jitter_us, bph, true)
        .then(sound)
        .flatten();
    crate::measure::no_watch_reason(jitter_us, bph, true, sound).is_none()
}

/// The template live locks on with, from the envelope `env` of the chunk
/// a watch is first heard in at `bph`: the beats of its first
/// [`crate::live::LiveConfig`] window from where its sound starts, when
/// that holds enough of them ([`LOCK_BEATS`]). None where it doesn't.
fn lock_template(env: &[f32], fs: f64, bph: u32) -> Option<Vec<f32>> {
    let from = beats::sound_onset(env, fs)?;
    let window = crate::live::LiveConfig::default().window_s;
    let to = (from + (window * fs).ceil() as usize).min(env.len());
    let (b, t) = beats::detect(&env[from..to], fs, bph);
    (b.len() >= LOCK_BEATS).then_some(t)
}

/// The fewest beats a short window holds for live to lock on with them.
pub(crate) const LOCK_BEATS: usize = 8;

/// The beats of the first stretch a watch may be heard in, and the
/// template they give.
pub struct FirstBeats {
    /// The rate set, or else guessed from `env`.
    pub bph: u32,
    /// The beats found, times from the start of `env`.
    pub beats: Vec<Beat>,
    /// The beat template, kept only when the beats are a watch's.
    pub template: Option<Vec<f32>>,
    /// The level to carry on to the sound after ([`beats::detect_after`]).
    pub level: Option<f32>,
}

/// The beat template as a file's reading builds it, from the envelope
/// `env` of its first chunk: looked at from where its sound starts, at
/// the rate set (`bph`) or a guessed one, and kept only once its beats
/// are a watch's (#476), judged as every reading judges a stretch
/// ([`crate::measure::no_watch_reason`]): the median timing scatter of
/// its `a.amplitude_window_s` windows, and, where that scatter is in doubt,
/// the beats' averaged sound. Stand noise after exact zeros scattered
/// 1.9% of a beat at a given 28,800 bph and passed on timing alone;
/// its template then read the watch after it, so no step onto the
/// watch was found and the lead was read in (#2189). Silence or noise
/// before the watch is placed sets neither the rate nor the beat's sound.
/// Live builds its template again this way once it has a chunk's sound
/// (#1327), so both read with the same template. None when `env` holds
/// no sound.
pub fn first_beats_in(
    env: &[f32],
    fs: f64,
    bph: Option<u32>,
    a: &AnalysisConfig,
) -> Option<FirstBeats> {
    let from = beats::sound_onset(env, fs)?;
    let bph = bph.unwrap_or_else(|| beats::guess_bph(env, fs));
    let (b, t, level) = beats::detect_levelled(&env[from..], fs, bph);
    let shift = from as f64 / fs;
    let beats: Vec<Beat> = b
        .into_iter()
        .map(|x| Beat {
            time: x.time + shift,
            ..x
        })
        .collect();
    let windows = crate::session::scatter_windows(
        &crate::clean::Cuts::new(None, &[], &[]),
        &beats,
        bph,
        0.0,
        env.len() as f64 / fs,
        a.amplitude_window_s,
    );
    let jitter_us = crate::session::scatter_jitter_us(&windows);
    let heard = watch_heard_in(env, fs, bph, &beats, jitter_us, &a.amplitude);
    Some(FirstBeats {
        bph,
        beats,
        template: heard.then_some(t),
        level: if heard { level } else { None },
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::synth::{generate, SynthConfig};

    thread_local! {
        /// The Tick left out of every amplitude window the first chunk's
        /// own template reads, as on Walter's damaged captures (#1503).
        pub(super) static SPOIL_OWN: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
    }

    /// The amplitude chunk grid (#1738, Trevor on #1800): a 2 s window that
    /// starts in a chunk's last 2 s belongs to it while it ends inside the
    /// chunk's margin, and to the next once it reaches past it.
    #[test]
    fn a_window_in_a_chunks_margin_is_that_chunks() {
        let at = |s: f64| amplitude_chunk_of(s, 2.0);
        assert_eq!((CHUNK_S, MARGIN_S), (47.0, 1.0));
        // Chunk 0's own stretch is 0 to 47 s; its margin runs to 48 s.
        for (start, chunk) in [
            (0.0, 0),
            (44.0, 0),
            // Ends at 47 s, inside the stretch.
            (45.0, 0),
            // Ends at 48 s, the margin's end: still chunk 0.
            (46.0, 0),
            // Ends at 48.5 s, past the margin.
            (46.5, 1),
            (47.0, 1),
            // Chunk 1's own stretch ends at 94 s, its margin at 95 s.
            (93.0, 1),
            (93.5, 2),
            (94.0, 2),
        ] {
            assert_eq!(at(start), chunk, "a window starting at {start} s");
        }
    }

    /// A file's reading keeps the template its first chunk gives on clean
    /// sound, and the one its first 4 s give, as live locks on, when the
    /// chunk's reads both sides in far fewer windows (#1503): then the
    /// windows are read on both sides and the reading says so.
    #[test]
    fn a_first_chunk_template_reading_fewer_sides_gives_way_to_the_lock_on_one() {
        let cfg = SynthConfig {
            duration_s: 120.0,
            ..Default::default()
        };
        let audio = generate(&cfg, |_| 280.0, |_| 0.0);
        let read = |spoil: bool| {
            SPOIL_OWN.with(|s| s.set(spoil));
            let log = analyze_samples(&audio.samples, cfg.sample_rate, &StreamConfig::default());
            SPOIL_OWN.with(|s| s.set(false));
            log
        };
        let clean = read(false);
        assert!(!clean.lock_template_kept);
        let both = |l: &BeatLog| {
            l.amplitude_windows
                .iter()
                .filter(|w| w.mean().is_some())
                .count()
        };
        assert!(both(&clean) > 50, "{}", both(&clean));
        let kept = read(true);
        assert!(kept.lock_template_kept);
        assert!(both(&kept) > 50, "{}", both(&kept));
        let m = crate::session::measure(&kept, None, 0.0, 120.0);
        assert!(m
            .caveats
            .contains(&crate::measure::Caveat::LockTemplateKept));
        let m = crate::session::measure(&clean, None, 0.0, 120.0);
        assert!(!m
            .caveats
            .contains(&crate::measure::Caveat::LockTemplateKept));
    }

    /// The chunks' envelopes and clipping found on several threads give
    /// the same log, to the bit, as one thread does: on
    /// a take with a dropout (a jump in the beats), a quiet stretch and
    /// clipped beats, read as one recording in uneven blocks.
    #[test]
    fn preparing_chunks_on_several_threads_changes_nothing() {
        let mut a = generate(
            &SynthConfig {
                duration_s: 600.0,
                ..Default::default()
            },
            |t| 270.0 + 10.0 * (t / 90.0).sin(),
            |_| 0.3,
        );
        let fs = a.sample_rate as f64;
        for (i, v) in a.samples.iter_mut().enumerate() {
            let t = i as f64 / fs;
            if (300.0..320.0).contains(&t) {
                *v *= 0.1;
            } else if (400.0..420.0).contains(&t) {
                *v = (*v * 40.0).clamp(-1.0, 1.0);
            }
        }
        // 3.3 s of listening lost: the beats jump there.
        let cut = (200.0 * fs) as usize;
        a.samples.drain(cut..cut + (3.3 * fs) as usize);
        let read = |threads: usize| {
            let fed = |push: &mut dyn FnMut(&[f32]) -> bool| {
                // Uneven blocks, as no decoder gives them.
                a.samples.chunks(40_009).all(push);
                Ok(())
            };
            analyze_fed(
                a.sample_rate,
                &StreamConfig::default(),
                threads,
                fed,
                |_| {},
            )
            .unwrap()
        };
        let one = read(1);
        assert!(!one.jumps.is_empty(), "no jump");
        assert!(!one.clipped_beats.is_empty(), "no clipping");
        for threads in [2, 5] {
            let many = read(threads);
            let bits = |log: &BeatLog| {
                let beats: Vec<_> = log
                    .beats
                    .iter()
                    .map(|b| (b.time.to_bits(), b.index, b.quality.to_bits()))
                    .collect();
                let amp: Vec<String> = log
                    .amplitude_windows
                    .iter()
                    .map(|w| format!("{w:?}"))
                    .collect();
                let snips: Vec<_> = log
                    .snippets
                    .iter()
                    .map(|s| (s.0.to_bits(), s.1.clone()))
                    .collect();
                (
                    beats,
                    amp,
                    log.clipped_beats.clone(),
                    log.clipped_samples,
                    log.jumps.clone(),
                    log.sided.clone(),
                    log.by_count.clone(),
                    snips,
                    log.bph,
                    log.duration_s.to_bits(),
                )
            };
            assert!(bits(&one) == bits(&many), "{threads} threads");
        }
    }

    /// Whether `read` returns (panicking) within a minute: a panic while a
    /// recording is read must come out of the reading, not leave it
    /// waiting for ever (Trevor's probe, #1116).
    fn returns_from(read: impl FnOnce() + Send + 'static) -> bool {
        let (tx, rx) = std::sync::mpsc::channel();
        std::thread::spawn(move || {
            let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(read));
            let _ = tx.send(r.is_err());
        });
        rx.recv_timeout(std::time::Duration::from_secs(60)) == Ok(true)
    }

    /// The first chunk's beats are a watch's only as every reading judges
    /// a stretch (#2189): stand noise whose beats scatter 1.9% of a beat,
    /// under the 2% line, as Walter's after exact zeros did at a given
    /// 28,800 bph, shows no watch's sound, so it is no watch and gives no
    /// template; a watch at the same scatter still is one.
    #[test]
    fn noise_scattering_under_the_line_gives_no_template_where_its_sound_shows_no_watch() {
        let (fs, bph) = (48000.0, 28800);
        let cfg = AnalysisConfig::default();
        let beat = 3600.0 / bph as f64;
        // 1.9% of a beat, in the doubt zone.
        let jitter_us = Some(0.019 * beat * 1e6);
        assert!(crate::measure::beat_sound_needed(jitter_us, bph, true));
        assert!(beats::watch_heard(jitter_us, bph), "passes on timing alone");
        let mut rng = crate::synth::Rng::new(7);
        let noise: Vec<f32> = (0..(30.0 * fs) as usize)
            .map(|_| (0.05 * rng.normal()) as f32)
            .collect();
        let env = envelope(&noise, fs, &cfg.envelope);
        let on_grid: Vec<Beat> = (1..230)
            .map(|k| Beat {
                index: k,
                time: k as f64 * beat,
                quality: 1.0,
            })
            .collect();
        assert!(!watch_heard_in(
            &env,
            fs,
            bph,
            &on_grid,
            jitter_us,
            &cfg.amplitude
        ));
        let watch = generate(
            &SynthConfig {
                duration_s: 30.0,
                ..Default::default()
            },
            |_| 270.0,
            |_| 0.0,
        );
        let env = envelope(&watch.samples, fs, &cfg.envelope);
        let (heard, _) = beats::detect(&env, fs, bph);
        assert!(watch_heard_in(
            &env,
            fs,
            bph,
            &heard,
            jitter_us,
            &cfg.amplitude
        ));
    }

    /// [`first_beats_in`] keeps no template where its beats pass on timing
    /// alone but their sound shows no watch (#2189): 10 s of exact zeros,
    /// then clicks every beat at 28,800 bph, each set off at random by
    /// about 1.5% of a beat, in noise. A click has no unlock or drop, as
    /// the stand's sound had none.
    #[test]
    fn exact_zeros_then_regular_clicks_in_noise_give_no_template() {
        let (fs, bph) = (48000.0, 28800);
        let cfg = AnalysisConfig::default();
        let beat = 3600.0 / bph as f64;
        let mut rng = crate::synth::Rng::new(11);
        let n = (47.0 * fs) as usize;
        let zeros = (10.0 * fs) as usize;
        let mut x: Vec<f32> = (0..n)
            .map(|i| {
                if i < zeros {
                    0.0
                } else {
                    (0.02 * rng.normal()) as f32
                }
            })
            .collect();
        let mut t = 10.0 + 0.5 * beat;
        while t < 46.5 {
            let at = ((t + SCATTER * beat * rng.normal()) * fs) as usize;
            x[at] = 1.0;
            t += beat;
        }
        let env = envelope(&x, fs, &cfg.envelope);
        let f = first_beats_in(&env, fs, Some(bph), &cfg).expect("sound");
        let w = crate::session::scatter_windows(
            &crate::clean::Cuts::new(None, &[], &[]),
            &f.beats,
            bph,
            0.0,
            env.len() as f64 / fs,
            cfg.amplitude_window_s,
        );
        let jitter_us = crate::session::scatter_jitter_us(&w);
        assert!(beats::watch_heard(jitter_us, bph), "passes on timing alone");
        assert!(crate::measure::beat_sound_needed(jitter_us, bph, true));
        assert!(f.template.is_none(), "a template kept from clicks");
    }

    /// How far each click is set off, SD as a share of a beat
    /// ([`exact_zeros_then_regular_clicks_in_noise_give_no_template`]):
    /// the clicks' scatter comes out about 1.3%, in the doubt zone.
    const SCATTER: f64 = 0.012;

    /// The beat sound is judged from good beats' windows only, Tick from
    /// the even beats, for the take's sample and the first chunk's watch
    /// test alike ([`sound_snippet`]).
    #[test]
    fn only_a_good_beats_window_is_a_sound_snippet() {
        let w = [0.0f32; 4];
        let beat = |index, quality| Beat {
            index,
            time: 0.0,
            quality,
        };
        assert_eq!(sound_snippet(&beat(4, 1.0), &w).map(|s| s.0), Some(true));
        assert_eq!(sound_snippet(&beat(5, 1.0), &w).map(|s| s.0), Some(false));
        let bad = beats::JUMP_QUALITY * 0.5;
        assert!(sound_snippet(&beat(4, bad), &w).is_none());
    }

    /// A long take's worth of chunks, more than the queues hold.
    fn fifteen_minutes() -> Vec<f32> {
        generate(
            &SynthConfig {
                duration_s: 900.0,
                ..Default::default()
            },
            |_| 270.0,
            |_| 0.3,
        )
        .samples
    }

    #[test]
    fn a_panic_in_the_analysis_comes_out_of_the_reading() {
        let x = fifteen_minutes();
        assert!(returns_from(move || {
            let fed = |push: &mut dyn FnMut(&[f32]) -> bool| {
                x.chunks(1 << 16).all(push);
                Ok(())
            };
            let _ = analyze_fed(48_000, &StreamConfig::default(), 1, fed, |_| panic!("boom"));
        }));
    }

    #[test]
    fn a_panic_while_preparing_comes_out_of_the_reading() {
        let mut x = fifteen_minutes();
        // Every chunk's preparation panics ([`Prepared::prepare`] under
        // test, on a chunk starting with NaN).
        x.iter_mut().for_each(|v| *v = f32::NAN);
        assert!(returns_from(move || {
            let fed = |push: &mut dyn FnMut(&[f32]) -> bool| {
                x.chunks(1 << 16).all(push);
                Ok(())
            };
            let _ = analyze_fed(48_000, &StreamConfig::default(), 2, fed, |_| {});
        }));
    }

    #[test]
    fn a_panic_while_finding_the_amplitude_comes_out_of_the_reading() {
        let x = fifteen_minutes();
        // Every chunk's amplitude windows panic ([`AmpJob::run`] under
        // test, on windows of 1.25 s).
        let mut cfg = StreamConfig::default();
        cfg.analysis.amplitude_window_s = 1.25;
        assert!(returns_from(move || {
            let fed = |push: &mut dyn FnMut(&[f32]) -> bool| {
                x.chunks(1 << 16).all(push);
                Ok(())
            };
            let _ = analyze_fed(48_000, &cfg, 2, fed, |_| {});
        }));
    }

    /// The envelope windows kept are the good beats', over the whole take:
    /// none for the faint beats of a quiet stretch (−20 dB, 20 to 30 s),
    /// and the beats after the first minute too, within the sample's
    /// budget.
    #[test]
    fn snippets_are_the_good_beats_of_the_whole_take() {
        let mut a = generate(
            &SynthConfig {
                duration_s: 70.0,
                ..Default::default()
            },
            |_| 270.0,
            |_| 0.0,
        );
        let fs = a.sample_rate as f64;
        for (i, v) in a.samples.iter_mut().enumerate() {
            if (20.0..30.0).contains(&(i as f64 / fs)) {
                *v *= 0.1;
            }
        }
        let log = analyze_samples(&a.samples, a.sample_rate, &StreamConfig::default());
        let good: Vec<f64> = log
            .beats
            .iter()
            .filter(|b| b.is_good())
            .map(|b| b.time)
            .collect();
        assert!(log.beats.iter().any(|b| !b.is_good()));
        let kept: Vec<f64> = log.snippets.iter().map(|s| s.0).collect();
        assert!(kept.iter().any(|&t| t >= 65.0), "the end is kept");
        let budget = crate::sound_sample::SOUND_SAMPLE_BEATS;
        assert!(
            (budget / 2..=budget).contains(&kept.len()) && good.len() > budget,
            "{} of {}",
            kept.len(),
            good.len()
        );
        for t in kept {
            assert!(good.iter().any(|&g| (g - t).abs() < 1e-9), "{t}");
        }
    }

    /// A watch whose impulse grows as loud as its drop, 0.8 to 1.2 of it,
    /// after the template was built while it was quiet (as Peter's DayDate
    /// 36 run-down's Tick, #1819), at 20% noise, is timed on its drop: in
    /// 99% of beats or more within 0.1 ms of the same take whose impulse
    /// stays quiet. Without the move onto the drop, 79% of beats were at
    /// 1.2, on these seeds.
    #[test]
    fn a_beat_whose_impulse_grows_as_loud_as_its_drop_is_timed_on_its_drop() {
        let read = |impulse: f64, seed: u64| {
            let seg = |gain: f64, seed: u64| {
                let mut c = SynthConfig {
                    duration_s: 240.0,
                    seed,
                    snr_db: 20.0 * (1.0 / 0.2f64).log10(),
                    ..Default::default()
                };
                c.sounds[1].gain = gain;
                generate(&c, |_| 220.0, |_| 0.0)
            };
            let (a, b) = (seg(0.25, seed), seg(impulse, seed + 1));
            let mut x = a.samples;
            x.extend_from_slice(&b.samples);
            let cfg = StreamConfig {
                analysis: AnalysisConfig {
                    bph: Some(28800),
                    ..Default::default()
                },
                ..Default::default()
            };
            analyze_samples(&x, a.sample_rate, &cfg)
        };
        for (r, seed) in [(0.8, 181_900), (1.0, 181_902), (1.2, 181_904)] {
            let (quiet, tie) = (read(0.25, seed), read(r, seed));
            let late = |l: &BeatLog| -> Vec<f64> {
                (l.beats.iter())
                    .filter(|b| b.time >= 250.0)
                    .map(|b| b.time)
                    .collect()
            };
            let (q, t) = (late(&quiet), late(&tie));
            let near = (t.iter())
                .filter(|x| {
                    let i = q.partition_point(|v| v < x);
                    [i.checked_sub(1), Some(i)]
                        .into_iter()
                        .flatten()
                        .filter_map(|j| q.get(j))
                        .any(|v| (v - *x).abs() <= 1e-4)
                })
                .count();
            eprintln!("S {r}: {near} of {}", q.len());
            assert!(near * 100 >= q.len() * 99, "{r}: {near} of {}", q.len());
        }
    }
}
