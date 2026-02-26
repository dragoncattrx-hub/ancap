//! Sanitize paths for exports RPC: must be under /var/lib/acp-node/exports/.

const EXPORTS_ROOT: &str = "/var/lib/acp-node/exports";

/// Returns normalized path if it is under EXPORTS_ROOT and contains no "..". Else None.
pub fn sanitize_exports_path(path: &str) -> Option<String> {
    let s = path.trim().replace('\\', "/");
    if s.is_empty() || s.contains("..") {
        return None;
    }
    let normalized = if s.starts_with('/') {
        s
    } else {
        format!("{}/{}", EXPORTS_ROOT, s.trim_start_matches('/'))
    };
    if normalized == EXPORTS_ROOT || normalized.starts_with(&format!("{}/", EXPORTS_ROOT)) {
        Some(normalized)
    } else {
        None
    }
}
