//! Exports state fingerprint for precise plan reuse (v0.94/v0.95).
//! v1: total_bytes, newest_ready, inprog, ready.
//! v2: + ready_bytes, oldest_ready_created_at_ts → sha256 hex.

use std::fs;

pub const STATE_FINGERPRINT_VERSION: u32 = 2;

/// Fingerprint of exports dir state (v2: total_bytes, ready_bytes, newest/oldest_ready_ts, inprogress_count, ready_count).
#[derive(Clone, Debug)]
#[allow(dead_code)]
pub struct ExportsStateFingerprint {
    pub version: u32,
    pub total_bytes: u64,
    pub ready_bytes: u64,
    pub newest_ready_created_at_ts: Option<u64>,
    pub oldest_ready_created_at_ts: Option<u64>,
    pub inprogress_count: u64,
    pub ready_count: u64,
    pub fingerprint_hex: String,
}

/// Compute fingerprint v1 (legacy). Prefer compute_exports_state_fingerprint_v2.
#[allow(dead_code)]
pub fn compute_exports_state_fingerprint(
    total_bytes: u64,
    newest_ready_created_at_ts: Option<u64>,
    inprogress_count: u64,
    ready_count: u64,
) -> ExportsStateFingerprint {
    let newest = newest_ready_created_at_ts.unwrap_or(0);
    let s = format!(
        "v=1|total_bytes={}|newest_ready={}|inprog={}|ready={}",
        total_bytes, newest, inprogress_count, ready_count
    );
    let hex = crate::util::hash::sha256_hex(s.as_bytes());
    ExportsStateFingerprint {
        version: 1,
        total_bytes,
        ready_bytes: 0,
        newest_ready_created_at_ts,
        oldest_ready_created_at_ts: None,
        inprogress_count,
        ready_count,
        fingerprint_hex: hex,
    }
}

/// Compute fingerprint v2: total_bytes, ready_bytes, newest/oldest_ready_ts, inprogress_count, ready_count.
pub fn compute_exports_state_fingerprint_v2(
    total_bytes: u64,
    ready_bytes: u64,
    newest_ready_created_at_ts: Option<u64>,
    oldest_ready_created_at_ts: Option<u64>,
    inprogress_count: u64,
    ready_count: u64,
) -> ExportsStateFingerprint {
    let newest = newest_ready_created_at_ts.unwrap_or(0);
    let oldest = oldest_ready_created_at_ts.unwrap_or(0);
    let s = format!(
        "v={}|total_bytes={}|ready_bytes={}|newest_ready={}|oldest_ready={}|inprog={}|ready_count={}",
        STATE_FINGERPRINT_VERSION,
        total_bytes,
        ready_bytes,
        newest,
        oldest,
        inprogress_count,
        ready_count
    );
    let hex = crate::util::hash::sha256_hex(s.as_bytes());
    ExportsStateFingerprint {
        version: STATE_FINGERPRINT_VERSION,
        total_bytes,
        ready_bytes,
        newest_ready_created_at_ts,
        oldest_ready_created_at_ts,
        inprogress_count,
        ready_count,
        fingerprint_hex: hex,
    }
}

/// Scan exports dir and return (total_bytes, ready_bytes, newest_ready_created_at_ts, oldest_ready_created_at_ts, inprogress_count, ready_count).
/// Used by exports_gc_plan and for fingerprint v2.
pub fn scan_exports_dir_for_fingerprint(
    export_dir: &str,
) -> anyhow::Result<(u64, u64, Option<u64>, Option<u64>, u64, u64)> {
    let mut total_bytes: u64 = 0;
    let mut inprogress_count: u64 = 0;
    let mut manifest_names: Vec<String> = Vec::new();

    let rd = fs::read_dir(export_dir)?;
    for e in rd.flatten() {
        let name = e.file_name().to_string_lossy().to_string();
        if name.contains("..") || name.contains('/') || name.contains('\\') {
            continue;
        }
        if let Ok(md) = e.metadata() {
            total_bytes = total_bytes.saturating_add(md.len());
        }
        if name.ends_with(".json") {
            manifest_names.push(name.clone());
        }
        if name.ends_with(".inprogress") {
            inprogress_count += 1;
        }
    }

    let mut ready_count: u64 = 0;
    let mut ready_bytes: u64 = 0;
    let mut newest_ready: Option<u64> = None;
    let mut oldest_ready: Option<u64> = None;

    for mn in manifest_names {
        let mp = format!("{}/{}", export_dir, mn);
        let s = match fs::read_to_string(&mp) {
            Ok(s) => s,
            Err(_) => continue,
        };
        let mj: serde_json::Value = match serde_json::from_str(&s) {
            Ok(v) => v,
            Err(_) => continue,
        };
        let created_at_ts = mj.get("created_at_ts").and_then(|v| v.as_u64()).unwrap_or(0);
        let filename = mj
            .get("filename")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| mn.trim_end_matches(".json").to_string());
        let export_path = format!("{}/{}", export_dir, filename);
        let inprog_path = format!("{}.inprogress", &export_path);
        if fs::metadata(&inprog_path).is_ok() {
            continue;
        }
        ready_count += 1;
        let eb = fs::metadata(&export_path).ok().map(|m| m.len()).unwrap_or(0);
        let mb = fs::metadata(&mp).ok().map(|m| m.len()).unwrap_or(0);
        ready_bytes = ready_bytes.saturating_add(eb.saturating_add(mb));
        newest_ready = Some(
            newest_ready
                .map(|x| x.max(created_at_ts))
                .unwrap_or(created_at_ts),
        );
        oldest_ready = Some(
            oldest_ready
                .map(|x| x.min(created_at_ts))
                .unwrap_or(created_at_ts),
        );
    }

    Ok((
        total_bytes,
        ready_bytes,
        newest_ready,
        oldest_ready,
        inprogress_count,
        ready_count,
    ))
}
