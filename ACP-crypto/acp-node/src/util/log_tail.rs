//! Read head/tail lines from a log file with max_bytes cap (v0.99 exports_status maintain_log).

use std::fs::OpenOptions;
use std::io::{Read, Seek, SeekFrom};

pub struct HeadTail {
    pub head: Vec<String>,
    pub tail: Vec<String>,
    pub truncated: bool,
}

pub fn read_head_tail_lines(
    path: &str,
    head_n: usize,
    tail_n: usize,
    max_bytes: usize,
) -> anyhow::Result<HeadTail> {
    let mut f = OpenOptions::new().read(true).open(path)?;

    let meta = f.metadata()?;
    let len = meta.len() as usize;

    let truncated = len > max_bytes;

    let head_cap = max_bytes.min(64 * 1024).min(len);
    let mut head_buf = vec![0u8; head_cap];
    f.seek(SeekFrom::Start(0))?;
    f.read_exact(&mut head_buf)?;

    let head_text = String::from_utf8_lossy(&head_buf);
    let head_lines: Vec<String> = head_text.lines().take(head_n).map(|s| s.to_string()).collect();

    let tail_cap = max_bytes.min(len);
    let start = (len.saturating_sub(tail_cap)) as u64;
    let mut tail_buf = vec![0u8; tail_cap];
    f.seek(SeekFrom::Start(start))?;
    f.read_exact(&mut tail_buf)?;

    let tail_text = String::from_utf8_lossy(&tail_buf);
    let mut tail_lines_all: Vec<&str> = tail_text.lines().collect();

    if truncated && !tail_lines_all.is_empty() {
        tail_lines_all.remove(0);
    }

    let skip = tail_lines_all.len().saturating_sub(tail_n);
    let tail_lines: Vec<String> = tail_lines_all[skip..]
        .iter()
        .map(|s| (*s).to_string())
        .collect();

    Ok(HeadTail {
        head: head_lines,
        tail: tail_lines,
        truncated,
    })
}
