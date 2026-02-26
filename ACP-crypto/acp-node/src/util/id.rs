//! Id helpers (uuid for plan_id etc.).

/// Returns a new v4 UUID string (e.g. for exports_gc_plan plan_id).
pub fn new_uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}
