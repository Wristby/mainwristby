//! A guided test's own marks on its take: where it settled, the time it
//! didn't use (turns, a position given up, a pause) and what it measured,
//! in the sound's own seconds, kept in a file of their own beside the
//! session file so a take opened again shows them as the test did
//! (#1957). A file of its own, not a key in `session.toml`, so every
//! release that reads session files still opens the take; a take with
//! none reads as it always has.

use serde::{Deserialize, Serialize};
use std::path::Path;

/// The file's name, beside `session.toml`.
pub const FILE: &str = "test-marks.json";
/// What the file says it is.
pub const FORMAT: &str = "timegrapher.test-marks/1";

/// What one stretch of a test's take was.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Mark {
    /// Before the test's first position.
    BeforeTest,
    /// Settling after a move, before its measuring.
    Settling,
    /// Time the test didn't use: a turn, a position given up, a pause.
    NotUsed,
}

/// Which guided test made the take.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Test {
    Positions,
    DynamicPoise,
    Complication,
}

/// One marked stretch, start and end in seconds of the take's sound.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Marked {
    pub start_s: f64,
    pub end_s: f64,
    pub mark: Mark,
}

/// A guided test's marks on its take.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TestMarks {
    pub format: String,
    pub test: Test,
    /// What it settled, didn't use and waited before, oldest first.
    pub marks: Vec<Marked>,
    /// What it measured, oldest first: as the session file's entries list.
    pub measured: Vec<(f64, f64)>,
}

impl TestMarks {
    pub fn new(test: Test, marks: Vec<Marked>, measured: Vec<(f64, f64)>) -> Self {
        TestMarks {
            format: FORMAT.to_string(),
            test,
            marks,
            measured,
        }
    }

    /// The file's text.
    pub fn to_json(&self) -> String {
        serde_json::to_string_pretty(self).unwrap_or_default() + "\n"
    }

    /// The marks kept in the take `dir`: none where it has no file, and
    /// why where its file can't be read, which is said, never taken for
    /// none.
    pub fn read(dir: &Path) -> Result<Option<Self>, String> {
        let path = dir.join(FILE);
        let text = match std::fs::read_to_string(&path) {
            Ok(t) => t,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
            Err(e) => return Err(format!("{FILE}: {e}")),
        };
        let marks: TestMarks = serde_json::from_str(&text).map_err(|e| format!("{FILE}: {e}"))?;
        if marks.format != FORMAT {
            return Err(format!("{FILE}: format {} is not {FORMAT}", marks.format));
        }
        Ok(Some(marks))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Written and read back the same; no file is none; a broken one says
    /// why.
    #[test]
    fn marks_written_read_back_the_same() {
        let dir = std::env::temp_dir().join(format!("tg-test-marks-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        assert_eq!(TestMarks::read(&dir), Ok(None));
        let m = TestMarks::new(
            Test::Positions,
            vec![
                Marked {
                    start_s: 0.0,
                    end_s: 4.0,
                    mark: Mark::BeforeTest,
                },
                Marked {
                    start_s: 4.0,
                    end_s: 14.0,
                    mark: Mark::Settling,
                },
                Marked {
                    start_s: 74.0,
                    end_s: 130.0,
                    mark: Mark::NotUsed,
                },
            ],
            vec![(14.0, 74.0)],
        );
        std::fs::write(dir.join(FILE), m.to_json()).unwrap();
        assert_eq!(TestMarks::read(&dir), Ok(Some(m)));
        std::fs::write(dir.join(FILE), "{").unwrap();
        assert!(TestMarks::read(&dir).unwrap_err().starts_with(FILE));
        let _ = std::fs::remove_dir_all(&dir);
    }
}
