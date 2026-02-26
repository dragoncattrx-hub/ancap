//! Disk usage for a path (filesystem containing the path).
//! Used for exports_health apply_safety.max_disk_pressure_ratio (v0.92).

use std::path::Path;

/// Disk usage for the filesystem containing the given path.
#[derive(Clone, Debug)]
pub struct FsUsage {
    pub total_bytes: u64,
    pub available_bytes: u64,
    pub used_bytes: u64,
    pub used_ratio: f64,
}

/// Returns usage (total, available, used, used_ratio) for the filesystem containing `path`.
pub fn fs_usage(path: &str) -> anyhow::Result<FsUsage> {
    let p = Path::new(path);
    let total = fs4::total_space(p)?;
    let avail = fs4::available_space(p)?;
    let used = total.saturating_sub(avail);
    let ratio = if total == 0 {
        0.0
    } else {
        used as f64 / total as f64
    };
    Ok(FsUsage {
        total_bytes: total,
        available_bytes: avail,
        used_bytes: used,
        used_ratio: ratio,
    })
}
