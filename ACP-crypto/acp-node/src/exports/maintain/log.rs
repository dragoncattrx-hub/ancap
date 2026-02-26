//! Ring-buffer maintain.log writer (v1.0). Path sanitized.

use crate::util::path_sanitize;
use crate::util::ring_log;

pub fn write_maintain_line(
    path: &str,
    line: &str,
    max_lines: usize,
    max_bytes: usize,
) -> anyhow::Result<()> {
    let sanitized = path_sanitize::sanitize_exports_path(path)
        .ok_or_else(|| anyhow::anyhow!("maintain_log path not under exports root"))?;
    ring_log::append_ring_log(&sanitized, line, max_lines, max_bytes)
}
