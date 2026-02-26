//! GC plan store: persist plan to disk for two-phase GC (plan → apply).
//! Path: <export_dir>/.plans/<plan_id>.json, atomic write.
//! Deploy: .plans/ and files should be owned by node user (e.g. acp:acp), mode 0700.

use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::fs;
use std::path::Path;

const PLAN_TTL_SECS: u64 = 600; // 10 minutes
const PLAN_ID_MAX_LEN: usize = 128;

/// Reject plan_id that could lead to path traversal (.., /, \\) or invalid filenames.
pub fn is_plan_id_safe(plan_id: &str) -> bool {
    if plan_id.is_empty() || plan_id.len() > PLAN_ID_MAX_LEN {
        return false;
    }
    !plan_id.contains("..") && !plan_id.contains('/') && !plan_id.contains('\\')
}

/// Options stored with the plan (no now_ts — apply uses current time when recomputing).
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct GcPlanOptsStored {
    pub keep_days: u64,
    pub max_total_bytes: Option<u64>,
    pub strategy: String,
    pub protect_last_n: usize,
    pub plan_limit: usize,
    pub delete_limit: usize,
    pub protected_sample_size: usize,
}

/// Summary block for list/get (fast scan without full would_delete).
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct PlanSummary {
    pub before_total_bytes: u64,
    pub projected_after_total_bytes: u64,
    pub would_delete_count: usize,
    pub would_delete_total_bytes: u64,
    pub cannot_reach_target: bool,
    /// v0.88: minimum total bytes if we keep only protected (for operator suggestions).
    #[serde(default)]
    pub min_possible_total_bytes: Option<u64>,
}

/// v0.97: One entry for canonical plan_hash (fixed field order).
#[derive(Clone, serde::Serialize)]
struct WouldDeleteHashEntry {
    created_at_ts: u64,
    filename: String,
}

/// Canonical struct used only for computing plan_hash (deterministic JSON). v0.97: would_delete sorted by (created_at_ts, filename).
#[derive(serde::Serialize)]
struct PlanHashInput<'a> {
    plan_id: &'a str,
    expires_at_ts: u64,
    opts: &'a GcPlanOptsStored,
    would_delete: &'a [WouldDeleteHashEntry],
    projected_after_total_bytes: u64,
    before_total_bytes: u64,
}

/// Build sorted canonical list from would_delete JSON entries (for hash and storage order).
fn would_delete_canonical_sorted(would_delete: &[serde_json::Value]) -> Vec<WouldDeleteHashEntry> {
    let mut entries: Vec<WouldDeleteHashEntry> = would_delete
        .iter()
        .filter_map(|v| {
            let created_at_ts = v.get("created_at_ts").and_then(|x| x.as_u64()).unwrap_or(0);
            let filename = v
                .get("filename")
                .and_then(|x| x.as_str())
                .unwrap_or("")
                .to_string();
            Some(WouldDeleteHashEntry {
                created_at_ts,
                filename,
            })
        })
        .collect();
    entries.sort_by(|a, b| (a.created_at_ts, &a.filename).cmp(&(b.created_at_ts, &b.filename)));
    entries
}

/// Build sorted (created_at_ts, filename) order of would_delete and matching manifests; return (canonical_entries, sorted_values, sorted_manifests).
fn sort_would_delete_for_plan(
    would_delete: &[serde_json::Value],
    would_delete_manifests: &std::collections::HashSet<String>,
) -> (Vec<WouldDeleteHashEntry>, Vec<serde_json::Value>, Vec<String>) {
    let mut with_manifest: Vec<(u64, String, String, serde_json::Value)> = would_delete
        .iter()
        .filter_map(|v| {
            let created_at_ts = v.get("created_at_ts").and_then(|x| x.as_u64()).unwrap_or(0);
            let filename = v.get("filename").and_then(|x| x.as_str()).unwrap_or("").to_string();
            let manifest_path = v
                .get("manifest_path")
                .and_then(|x| x.as_str())
                .map(String::from)
                .unwrap_or_else(|| String::new());
            Some((created_at_ts, filename, manifest_path, v.clone()))
        })
        .collect();
    with_manifest.sort_by(|a, b| (a.0, &a.1).cmp(&(b.0, &b.1)));
    let canonical: Vec<WouldDeleteHashEntry> = with_manifest
        .iter()
        .map(|(ts, fn_, _, _)| WouldDeleteHashEntry {
            created_at_ts: *ts,
            filename: fn_.clone(),
        })
        .collect();
    let sorted_values: Vec<serde_json::Value> = with_manifest.iter().map(|(_, _, _, v)| v.clone()).collect();
    let sorted_manifests: Vec<String> = with_manifest
        .iter()
        .map(|(_, _, mp, _)| {
            if mp.is_empty() {
                String::new()
            } else {
                mp.clone()
            }
        })
        .collect();
    let sorted_manifests = if sorted_manifests.iter().all(|s| !s.is_empty()) {
        sorted_manifests
    } else {
        let mut m: Vec<String> = would_delete_manifests.iter().cloned().collect();
        m.sort();
        m
    };
    (canonical, sorted_values, sorted_manifests)
}

/// Full stored plan file (written to .plans/<plan_id>.json).
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct StoredPlan {
    #[serde(default = "default_plan_version")]
    pub version: String,
    pub plan_id: String,
    pub plan_hash: String,
    #[serde(default)]
    pub created_at_ts: u64,
    pub expires_at_ts: u64,
    pub opts: GcPlanOptsStored,
    pub summary: Option<PlanSummary>,
    /// Sorted for stable hash and deterministic apply order.
    pub would_delete_manifests: Vec<String>,
    pub projected_after_total_bytes: u64,
    pub before_total_bytes: u64,
    pub would_delete_count: usize,
    pub would_delete_total_bytes: u64,
    pub would_delete: Vec<serde_json::Value>,
    pub protected_count: usize,
    pub protected_sample: Vec<serde_json::Value>,
    pub protected_newest_created_at_ts: Option<u64>,
    pub cannot_reach_target: bool,
    pub min_possible_total_bytes: Option<u64>,
    pub cutoff_ts: u64,
    pub needed_to_free_bytes: Option<u64>,
    pub kept_count: usize,
    pub kept_newest_created_at_ts: Option<u64>,
    pub kept_newest_day_iso: Option<String>,
    pub kept_total_bytes: u64,
    pub deleted_sample: Vec<serde_json::Value>,
    pub errors_sample: Vec<String>,
    /// v0.86: copy of opts.max_total_bytes (target we aim for).
    #[serde(default)]
    pub target_max_total_bytes: u64,
    /// v0.86: max(0, before_total_bytes - target_max_total_bytes).
    #[serde(default)]
    pub bytes_freed_needed: u64,
    /// v0.87: summary.would_delete_total_bytes.
    #[serde(default)]
    pub bytes_freed_estimated: u64,
    /// v0.87: projected_after_total_bytes <= target_max_total_bytes.
    #[serde(default)]
    pub meets_target: bool,
    /// v0.94: fingerprint of exports state when plan was built (for precise reuse).
    #[serde(default)]
    pub state_fingerprint: Option<String>,
    /// v0.95: version of fingerprint formula (e.g. 2); reuse only when version matches.
    #[serde(default)]
    pub state_fingerprint_version: Option<u32>,
}

fn default_plan_version() -> String {
    "v0.82".to_string()
}

fn plan_hash_from_parts(
    plan_id: &str,
    expires_at_ts: u64,
    opts: &GcPlanOptsStored,
    would_delete_canonical: &[WouldDeleteHashEntry],
    projected_after_total_bytes: u64,
    before_total_bytes: u64,
) -> String {
    let input = PlanHashInput {
        plan_id,
        expires_at_ts,
        opts,
        would_delete: would_delete_canonical,
        projected_after_total_bytes,
        before_total_bytes,
    };
    let json = serde_json::to_vec(&input).expect("plan hash input serialization");
    hex::encode(Sha256::digest(&json))
}

/// Save plan to .plans/<plan_id>.json (atomic write). Returns plan_hash. v0.97: would_delete sorted by (created_at_ts, filename), canonical hash.
pub fn save_plan(
    export_dir: &str,
    plan_id: &str,
    created_at_ts: u64,
    expires_at_ts: u64,
    opts: &GcPlanOptsStored,
    result: &crate::exports::gc::GcPlanResult,
    state_fingerprint: Option<&str>,
    state_fingerprint_version: Option<u32>,
) -> anyhow::Result<String> {
    if !is_plan_id_safe(plan_id) {
        anyhow::bail!("invalid plan_id (path traversal or invalid)");
    }
    let (would_delete_canonical, sorted_would_delete, sorted_manifests) =
        sort_would_delete_for_plan(&result.would_delete, &result.would_delete_manifests);

    let plan_hash = plan_hash_from_parts(
        plan_id,
        expires_at_ts,
        opts,
        &would_delete_canonical,
        result.projected_after_total_bytes,
        result.before_total_bytes,
    );

    let target_max_total_bytes = opts.max_total_bytes.unwrap_or(0);
    let bytes_freed_needed = result.before_total_bytes.saturating_sub(target_max_total_bytes);
    let bytes_freed_estimated = result.would_delete_total_bytes;
    let meets_target = result.projected_after_total_bytes <= target_max_total_bytes;

    let summary = PlanSummary {
        before_total_bytes: result.before_total_bytes,
        projected_after_total_bytes: result.projected_after_total_bytes,
        would_delete_count: result.would_delete_count,
        would_delete_total_bytes: result.would_delete_total_bytes,
        cannot_reach_target: result.cannot_reach_target,
        min_possible_total_bytes: result.min_possible_total_bytes,
    };

    let stored = StoredPlan {
        version: "v0.82".to_string(),
        plan_id: plan_id.to_string(),
        plan_hash: plan_hash.clone(),
        created_at_ts,
        expires_at_ts,
        opts: opts.clone(),
        summary: Some(summary),
        would_delete_manifests: sorted_manifests,
        projected_after_total_bytes: result.projected_after_total_bytes,
        before_total_bytes: result.before_total_bytes,
        would_delete_count: result.would_delete_count,
        would_delete_total_bytes: result.would_delete_total_bytes,
        would_delete: sorted_would_delete,
        protected_count: result.protected_count,
        protected_sample: result.protected_sample.clone(),
        protected_newest_created_at_ts: result.protected_newest_created_at_ts,
        cannot_reach_target: result.cannot_reach_target,
        min_possible_total_bytes: result.min_possible_total_bytes,
        cutoff_ts: result.cutoff_ts,
        needed_to_free_bytes: result.needed_to_free_bytes,
        kept_count: result.kept_count,
        kept_newest_created_at_ts: result.kept_newest_created_at_ts,
        kept_newest_day_iso: result.kept_newest_day_iso.clone(),
        kept_total_bytes: result.kept_total_bytes,
        deleted_sample: result.deleted_sample.clone(),
        errors_sample: result.errors_sample.clone(),
        target_max_total_bytes,
        bytes_freed_needed,
        bytes_freed_estimated,
        meets_target,
        state_fingerprint: state_fingerprint.map(|s| s.to_string()),
        state_fingerprint_version,
    };

    let plans_dir = Path::new(export_dir).join(".plans");
    fs::create_dir_all(&plans_dir)?;
    let path = plans_dir.join(format!("{}.json", plan_id));
    let tmp_path = plans_dir.join(format!("{}.json.tmp", plan_id));
    let json = serde_json::to_string_pretty(&stored)?;
    fs::write(&tmp_path, json)?;
    fs::rename(&tmp_path, &path)?;
    Ok(plan_hash)
}

/// Load plan from .plans/<plan_id>.json. Verifies plan_hash.
pub fn load_plan(export_dir: &str, plan_id: &str) -> anyhow::Result<Option<StoredPlan>> {
    if !is_plan_id_safe(plan_id) {
        anyhow::bail!("invalid plan_id (path traversal or invalid)");
    }
    let path = Path::new(export_dir)
        .join(".plans")
        .join(format!("{}.json", plan_id));
    let data = match fs::read_to_string(&path) {
        Ok(d) => d,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(e.into()),
    };
    let mut stored: StoredPlan = serde_json::from_str(&data)?;
    if stored.created_at_ts == 0 {
        stored.created_at_ts = stored.expires_at_ts.saturating_sub(PLAN_TTL_SECS);
    }
    if stored.summary.is_none() {
        stored.summary = Some(PlanSummary {
            before_total_bytes: stored.before_total_bytes,
            projected_after_total_bytes: stored.projected_after_total_bytes,
            would_delete_count: stored.would_delete_count,
            would_delete_total_bytes: stored.would_delete_total_bytes,
            cannot_reach_target: stored.cannot_reach_target,
            min_possible_total_bytes: stored.min_possible_total_bytes,
        });
    }
    let canonical = would_delete_canonical_sorted(&stored.would_delete);
    let expected_hash = plan_hash_from_parts(
        &stored.plan_id,
        stored.expires_at_ts,
        &stored.opts,
        &canonical,
        stored.projected_after_total_bytes,
        stored.before_total_bytes,
    );
    let hash_ok = stored.plan_hash == expected_hash;
    if !hash_ok {
        let expected_legacy = plan_hash_from_parts_legacy(
            &stored.plan_id,
            stored.expires_at_ts,
            &stored.opts,
            &stored.would_delete_manifests,
            stored.projected_after_total_bytes,
            stored.before_total_bytes,
        );
        if stored.plan_hash != expected_legacy {
            anyhow::bail!("plan_hash mismatch (file tampered or format changed)");
        }
    }
    Ok(Some(stored))
}

fn sorted_manifests_legacy<S>(manifests: &[String], s: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    let mut sorted: Vec<&String> = manifests.iter().collect();
    sorted.sort();
    serde::Serialize::serialize(&sorted, s)
}

/// Legacy hash (pre-v0.97: sorted manifests) for loading old plans.
fn plan_hash_from_parts_legacy(
    plan_id: &str,
    expires_at_ts: u64,
    opts: &GcPlanOptsStored,
    would_delete_manifests: &[String],
    projected_after_total_bytes: u64,
    before_total_bytes: u64,
) -> String {
    #[derive(serde::Serialize)]
    struct PlanHashInputLegacy<'a> {
        plan_id: &'a str,
        expires_at_ts: u64,
        opts: &'a GcPlanOptsStored,
        #[serde(serialize_with = "sorted_manifests_legacy")]
        would_delete_manifests: &'a [String],
        projected_after_total_bytes: u64,
        before_total_bytes: u64,
    }
    let input = PlanHashInputLegacy {
        plan_id,
        expires_at_ts,
        opts,
        would_delete_manifests,
        projected_after_total_bytes,
        before_total_bytes,
    };
    let json = serde_json::to_vec(&input).expect("plan hash legacy serialization");
    hex::encode(Sha256::digest(&json))
}

/// Remove plan file after successful apply or operator delete.
pub fn remove_plan(export_dir: &str, plan_id: &str) -> anyhow::Result<()> {
    if !is_plan_id_safe(plan_id) {
        anyhow::bail!("invalid plan_id (path traversal or invalid)");
    }
    let path = Path::new(export_dir)
        .join(".plans")
        .join(format!("{}.json", plan_id));
    if path.exists() {
        fs::remove_file(&path)?;
    }
    Ok(())
}

/// Alias for operator-facing "delete plan".
pub fn delete_plan(export_dir: &str, plan_id: &str) -> anyhow::Result<()> {
    remove_plan(export_dir, plan_id)
}

/// Lightweight entry for list (opts + summary; would_delete only when include_plan).
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct PlanListEntry {
    pub plan_id: String,
    pub created_at_ts: u64,
    pub expires_at_ts: u64,
    pub plan_hash: String,
    pub opts: GcPlanOptsStored,
    pub summary: PlanSummary,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub would_delete: Option<Vec<serde_json::Value>>,
}

/// Parse cursor "ts:<created_at_ts>:id:<plan_id>". Returns (created_at_ts, plan_id) or None.
pub fn parse_plans_cursor(cursor: &str) -> Option<(u64, String)> {
    let rest = cursor.strip_prefix("ts:")?;
    let (ts_str, rest) = rest.split_once(":id:")?;
    let created_at_ts = ts_str.parse::<u64>().ok()?;
    let plan_id = rest.to_string();
    if plan_id.is_empty() {
        return None;
    }
    Some((created_at_ts, plan_id))
}

/// Build next_cursor from last entry. Format: ts:<created_at_ts>:id:<plan_id>.
pub fn plans_next_cursor(created_at_ts: u64, plan_id: &str) -> String {
    format!("ts:{}:id:{}", created_at_ts, plan_id)
}

/// List stored plans with paging. Sort: created_at_ts DESC, plan_id ASC. Cursor format: ts:<ts>:id:<plan_id>.
pub fn list_plans(
    export_dir: &str,
    page_size: usize,
    cursor: Option<&str>,
    include_plan: bool,
) -> anyhow::Result<(Vec<PlanListEntry>, Option<String>, bool, Vec<String>)> {
    let plans_dir = Path::new(export_dir).join(".plans");
    let mut entries = Vec::new();
    let mut errors = Vec::new();
    if !plans_dir.exists() {
        return Ok((entries, None, false, errors));
    }
    let rd = fs::read_dir(&plans_dir)?;
    for e in rd.flatten() {
        let name = e.file_name().to_string_lossy().to_string();
        if !name.ends_with(".json") || name.ends_with(".tmp") {
            continue;
        }
        let _plan_id = name.trim_end_matches(".json").to_string();
        let path = plans_dir.join(&name);
        let data = match fs::read_to_string(&path) {
            Ok(d) => d,
            Err(e) => {
                errors.push(format!("read {}: {}", name, e));
                continue;
            }
        };
        let mut stored: StoredPlan = match serde_json::from_str(&data) {
            Ok(s) => s,
            Err(e) => {
                errors.push(format!("parse {}: {}", name, e));
                continue;
            }
        };
        if stored.created_at_ts == 0 {
            stored.created_at_ts = stored.expires_at_ts.saturating_sub(PLAN_TTL_SECS);
        }
        let summary = stored.summary.clone().unwrap_or(PlanSummary {
            before_total_bytes: stored.before_total_bytes,
            projected_after_total_bytes: stored.projected_after_total_bytes,
            would_delete_count: stored.would_delete_count,
            would_delete_total_bytes: stored.would_delete_total_bytes,
            cannot_reach_target: stored.cannot_reach_target,
            min_possible_total_bytes: stored.min_possible_total_bytes,
        });
        entries.push(PlanListEntry {
            plan_id: stored.plan_id,
            created_at_ts: stored.created_at_ts,
            expires_at_ts: stored.expires_at_ts,
            plan_hash: stored.plan_hash,
            opts: stored.opts,
            summary,
            would_delete: if include_plan {
                Some(stored.would_delete)
            } else {
                None
            },
        });
    }
    entries.sort_by(|a, b| {
        b.created_at_ts
            .cmp(&a.created_at_ts)
            .then_with(|| a.plan_id.cmp(&b.plan_id))
    });

    let (from, has_more) = if let Some(c) = cursor {
        let (cursor_ts, cursor_id) = match parse_plans_cursor(c) {
            Some(p) => p,
            None => return Ok((entries, None, false, errors)),
        };
        let skip = entries
            .iter()
            .take_while(|e| e.created_at_ts > cursor_ts || (e.created_at_ts == cursor_ts && e.plan_id <= cursor_id))
            .count();
        (skip, entries.len() > skip + page_size)
    } else {
        (0, entries.len() > page_size)
    };

    let page: Vec<PlanListEntry> = entries
        .into_iter()
        .skip(from)
        .take(page_size)
        .collect();
    let next_cursor = if has_more {
        page.last().map(|e| plans_next_cursor(e.created_at_ts, &e.plan_id))
    } else {
        None
    };
    Ok((page, next_cursor, has_more, errors))
}

/// Expired plan entry for gc sample.
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct ExpiredPlanSample {
    pub plan_id: String,
    pub created_at_ts: u64,
    pub expires_at_ts: u64,
}

/// Remove expired plan files (expires_at_ts < now_ts). dry_run: only count and sample; !dry_run: delete up to limit.
#[allow(dead_code)]
pub fn gc_expired_plans(
    export_dir: &str,
    now_ts: u64,
    dry_run: bool,
    limit: usize,
    sample_size: usize,
) -> anyhow::Result<(usize, usize, usize, Vec<ExpiredPlanSample>)> {
    let (all_entries, _, _, _) = list_plans(export_dir, usize::MAX, None, false)?;
    let expired: Vec<PlanListEntry> = all_entries
        .into_iter()
        .filter(|e| e.expires_at_ts < now_ts)
        .collect();
    let expired_count = expired.len();
    let would_delete_count = expired_count;
    let deleted_sample: Vec<ExpiredPlanSample> = expired
        .iter()
        .take(sample_size)
        .map(|e| ExpiredPlanSample {
            plan_id: e.plan_id.clone(),
            created_at_ts: e.created_at_ts,
            expires_at_ts: e.expires_at_ts,
        })
        .collect();
    if dry_run {
        return Ok((expired_count, would_delete_count, 0, deleted_sample));
    }
    let to_remove = expired.into_iter().take(limit);
    let mut deleted_count = 0;
    for e in to_remove {
        let _ = remove_plan(export_dir, &e.plan_id);
        deleted_count += 1;
    }
    Ok((expired_count, would_delete_count, deleted_count, deleted_sample))
}

/// Default TTL for new plans (seconds).
pub fn plan_ttl_secs() -> u64 {
    PLAN_TTL_SECS
}

/// Compare stored plan with freshly computed result: same set of manifests and projected_after_total_bytes.
pub fn plan_matches(
    stored: &StoredPlan,
    current: &crate::exports::gc::GcPlanResult,
) -> bool {
    let stored_set: HashSet<&String> = stored.would_delete_manifests.iter().collect();
    let current_set: HashSet<&String> = current.would_delete_manifests.iter().collect();
    stored_set == current_set
        && stored.projected_after_total_bytes == current.projected_after_total_bytes
}
