//! Ring-buffer log: append a line and trim to max_lines / max_bytes (v0.98).

use std::fs::{self, OpenOptions};
use std::io::{Read, Write};

/// Append one line to a file, then trim to at most max_lines and max_bytes (keep tail).
/// Uses atomic write (tmp + rename).
pub fn append_ring_log(
    path: &str,
    line: &str,
    max_lines: usize,
    max_bytes: usize,
) -> anyhow::Result<()> {
    if let Some(parent) = std::path::Path::new(path).parent() {
        fs::create_dir_all(parent)?;
    }

    let mut existing = String::new();
    if let Ok(mut f) = OpenOptions::new().read(true).open(path) {
        let mut buf = Vec::new();
        f.read_to_end(&mut buf)?;
        if buf.len() > max_bytes * 2 {
            let keep_from = buf.len().saturating_sub(max_bytes * 2);
            buf = buf.split_off(keep_from);
        }
        existing = String::from_utf8_lossy(&buf).to_string();
    }

    let mut lines: Vec<&str> = existing.lines().collect();
    lines.push(line);

    if lines.len() > max_lines {
        let keep_from = lines.len().saturating_sub(max_lines);
        lines = lines.split_off(keep_from);
    }

    let mut out = lines.join("\n");
    out.push('\n');

    if out.as_bytes().len() > max_bytes {
        let bytes = out.as_bytes();
        let start = bytes.len().saturating_sub(max_bytes);
        let slice = &bytes[start..];
        let mut cut = 0usize;
        for (i, b) in slice.iter().enumerate() {
            if *b == b'\n' {
                cut = i + 1;
                break;
            }
        }
        let trimmed = if cut > 0 { &slice[cut..] } else { slice };
        out = String::from_utf8_lossy(trimmed).to_string();
        if !out.ends_with('\n') {
            out.push('\n');
        }
    }

    let tmp = format!("{}.tmp", path);
    {
        let mut f = OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .open(&tmp)?;
        f.write_all(out.as_bytes())?;
        f.sync_all()?;
    }
    fs::rename(&tmp, path)?;
    Ok(())
}

/// Read first N and last N lines from a file (v0.99: for exports_status maintain_log samples).
/// On error (e.g. file missing) returns (vec![], vec![]).
#[allow(dead_code)]
pub fn read_head_tail(
    path: &str,
    first_n: usize,
    last_n: usize,
) -> anyhow::Result<(Vec<String>, Vec<String>)> {
    let content = fs::read_to_string(path)?;
    let lines: Vec<&str> = content.lines().collect();
    let total = lines.len();
    let first: Vec<String> = lines
        .iter()
        .take(first_n)
        .map(|s| (*s).to_string())
        .collect();
    let last: Vec<String> = if total <= last_n {
        lines.iter().map(|s| (*s).to_string()).collect()
    } else {
        lines
            .iter()
            .skip(total.saturating_sub(last_n))
            .map(|s| (*s).to_string())
            .collect()
    };
    Ok((first, last))
}
