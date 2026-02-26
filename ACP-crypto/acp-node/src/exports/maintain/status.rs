//! exports_status: scan exports dir, build status + samples (v1.0).

use super::types::{StatusOpts, StatusResult};
use crate::util::log_tail;
use crate::util::path_sanitize;
use serde_json::json;
use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};

fn parse_inprogress_meta(path: &str) -> (Option<String>, Option<u64>) {
    let s = match std::fs::read_to_string(path) {
        Ok(s) => s,
        Err(_) => return (None, None),
    };
    let mut export_id: Option<String> = None;
    let mut hb: Option<u64> = None;
    for line in s.lines() {
        if let Some(v) = line.strip_prefix("export_id=") {
            export_id = Some(v.trim().to_string());
        } else if let Some(v) = line.strip_prefix("heartbeat_seconds=") {
            hb = v.trim().parse::<u64>().ok();
        }
    }
    (export_id, hb)
}

pub fn exports_status(opts: StatusOpts) -> anyhow::Result<StatusResult> {
    let _lock = crate::util::export_lock::ExportLock::acquire(&opts.paths.lock_path)?;

    let export_dir = &opts.paths.exports_dir;
    let now_ts: u64 = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let mut total_bytes: u64 = 0;
    let mut inprogress_count = 0usize;
    let mut failed_count = 0usize;
    let mut ready_units: Vec<serde_json::Value> = Vec::new();
    let mut inprogress_samples: Vec<String> = Vec::new();
    let mut inprogress_details: Vec<serde_json::Value> = Vec::new();
    let mut stale_inprogress_count = 0usize;
    let mut stale_inprogress_sample: Vec<serde_json::Value> = Vec::new();
    let mut failed_samples: Vec<String> = Vec::new();
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
        if name.ends_with(".inprogress") {
            inprogress_count += 1;
            if inprogress_samples.len() < opts.limit_samples {
                inprogress_samples.push(name.clone());
            }
            if inprogress_details.len() < opts.limit_samples {
                let inprog_path = format!("{}/{}", export_dir, name);
                let mtime_ts = e
                    .metadata()
                    .ok()
                    .and_then(|m| m.modified().ok())
                    .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                let age_minutes = if mtime_ts > 0 && now_ts >= mtime_ts {
                    (now_ts - mtime_ts) / 60
                } else {
                    0
                };
                let base_name = name.trim_end_matches(".inprogress").to_string();
                let (export_id, heartbeat_seconds) = parse_inprogress_meta(&inprog_path);
                inprogress_details.push(json!({
                    "name": name.clone(),
                    "base_name": base_name.clone(),
                    "export_id": export_id,
                    "heartbeat_seconds": heartbeat_seconds,
                    "age_minutes": age_minutes
                }));
                let is_stale = age_minutes >= opts.max_age_minutes;
                if is_stale {
                    stale_inprogress_count += 1;
                    if stale_inprogress_sample.len() < opts.stale_sample_size {
                        stale_inprogress_sample.push(json!({
                            "name": name,
                            "base_name": base_name,
                            "export_id": export_id,
                            "heartbeat_seconds": heartbeat_seconds,
                            "age_minutes": age_minutes
                        }));
                    }
                }
            }
        }
        if name.contains(".failed") {
            failed_count += 1;
            if failed_samples.len() < opts.limit_samples {
                failed_samples.push(name.clone());
            }
        }
        if name.ends_with(".json") {
            manifest_names.push(name);
        }
    }

    let mut ready_count = 0usize;
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
        let eb = fs::metadata(&export_path).ok().map(|m| m.len()).unwrap_or(0);
        let mb = fs::metadata(&mp).ok().map(|m| m.len()).unwrap_or(0);
        ready_bytes = ready_bytes.saturating_add(eb.saturating_add(mb));
        if ready_units.len() < opts.limit_samples {
            let day_iso = if created_at_ts > 0 {
                let di = (created_at_ts / 86_400) as i64;
                Some(crate::util::date::day_iso_from_day_index(di))
            } else {
                None
            };
            ready_units.push(json!({
                "filename": filename,
                "created_at_ts": created_at_ts,
                "created_day_iso": day_iso,
                "bytes_export": eb,
                "bytes_manifest": mb,
                "rows": mj.get("rows").and_then(|v| v.as_u64()),
                "window_days": mj.get("params").and_then(|p| p.get("window_days")).and_then(|v| v.as_u64()),
                "hash": mj.get("params").and_then(|p| p.get("hash")).and_then(|v| v.as_str()).map(|s| s.to_string())
            }));
        }
    }

    let newest_day_iso = newest_ready.map(|ts| {
        let di = (ts / 86_400) as i64;
        crate::util::date::day_iso_from_day_index(di)
    });
    let oldest_day_iso = oldest_ready.map(|ts| {
        let di = (ts / 86_400) as i64;
        crate::util::date::day_iso_from_day_index(di)
    });
    let pressure = opts.max_total_bytes.map(|m| total_bytes > m).unwrap_or(false);
    let (recommendation, recommendation_hint) = if stale_inprogress_count > 0 {
        (
            Some("run exports_recover_stale_inprogress".to_string()),
            Some(json!({
                "rpc": "exports_recover_stale_inprogress",
                "params": {
                    "max_age_minutes": opts.max_age_minutes,
                    "dry_run": true,
                    "mode": "delete",
                    "limit": 200,
                    "force": false
                },
                "notes": [
                    "If rpc returns reason=exports_lock_busy (busy=true), do NOT use force. Retry later when exports ops are idle.",
                    "Run dry_run first; if output looks safe, rerun with dry_run=false."
                ]
            })),
        )
    } else {
        (None, None)
    };

    let maintain_log_path = path_sanitize::sanitize_exports_path(&opts.paths.maintain_log_path)
        .unwrap_or_else(|| opts.paths.maintain_log_path.clone());
    let maintain_log_val = if opts.include_maintain_log {
        match log_tail::read_head_tail_lines(
            &maintain_log_path,
            opts.maintain_log_head_lines,
            opts.maintain_log_tail_lines,
            opts.maintain_log_max_bytes,
        ) {
            Ok(ht) => json!({
                "path": maintain_log_path,
                "read_max_bytes": opts.maintain_log_max_bytes,
                "head": ht.head,
                "tail": ht.tail,
                "truncated": ht.truncated,
                "error": serde_json::Value::Null
            }),
            Err(e) => json!({
                "path": maintain_log_path,
                "read_max_bytes": opts.maintain_log_max_bytes,
                "head": [],
                "tail": [],
                "truncated": false,
                "error": format!("{}", e)
            }),
        }
    } else {
        serde_json::Value::Null
    };

    let mut samples_obj = serde_json::Map::new();
    samples_obj.insert("ready".to_string(), json!(ready_units));
    samples_obj.insert("inprogress".to_string(), json!(inprogress_samples));
    samples_obj.insert("inprogress_details".to_string(), json!(inprogress_details));
    samples_obj.insert("stale_inprogress_sample".to_string(), json!(stale_inprogress_sample));
    samples_obj.insert("failed".to_string(), json!(failed_samples));
    if opts.include_maintain_log {
        samples_obj.insert("maintain_log".to_string(), maintain_log_val);
    }

    let status = json!({
        "accepted": true,
        "ready_count": ready_count,
        "inprogress_count": inprogress_count,
        "failed_count": failed_count,
        "max_age_minutes": opts.max_age_minutes,
        "stale_inprogress_count": stale_inprogress_count,
        "total_bytes": total_bytes,
        "ready_bytes": ready_bytes,
        "max_total_bytes": opts.max_total_bytes,
        "pressure": pressure,
        "recommendation": recommendation,
        "recommendation_hint": recommendation_hint,
        "newest_ready_created_at_ts": newest_ready,
        "newest_ready_day_iso": newest_day_iso,
        "oldest_ready_created_at_ts": oldest_ready,
        "oldest_ready_day_iso": oldest_day_iso,
        "samples": serde_json::Value::Object(samples_obj),
    });

    Ok(StatusResult {
        accepted: true,
        status,
        samples: None,
    })
}
