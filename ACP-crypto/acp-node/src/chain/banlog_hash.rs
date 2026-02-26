//! Banlog secondary index by headerhash (CF_BANLOG_BY_HASH). v0.54.

/// Key: headerhash(32) || ts_u64_le || seq_u32_le = 44 bytes.
pub fn make_key(hash: &[u8; 32], ts: u64, seq: u32) -> [u8; 44] {
    let mut k = [0u8; 44];
    k[0..32].copy_from_slice(hash);
    k[32..40].copy_from_slice(&ts.to_le_bytes());
    k[40..44].copy_from_slice(&seq.to_le_bytes());
    k
}

/// Value v2: reason_hash64(8) || reason_len(u16) || reason_bytes (max 512).
pub fn pack_val(reason: &str) -> Vec<u8> {
    let mut r = reason.as_bytes().to_vec();
    if r.len() > 512 {
        r.truncate(512);
    }
    let rh = crate::chain::reason_hash::reason_hash64(&String::from_utf8_lossy(&r));

    let mut out = Vec::with_capacity(8 + 2 + r.len());
    out.extend_from_slice(&rh.to_le_bytes());
    out.extend_from_slice(&(r.len() as u16).to_le_bytes());
    out.extend_from_slice(&r);
    out
}

/// Returns (reason_hash64, reason). Supports v1 (no reason_hash64) and v2.
pub fn unpack_val(v: &[u8]) -> Option<(u64, String)> {
    if v.len() >= 8 + 2 {
        let rh = u64::from_le_bytes(v[0..8].try_into().ok()?);
        let len = u16::from_le_bytes(v[8..10].try_into().ok()?) as usize;
        if v.len() < 10 + len {
            return None;
        }
        let reason = String::from_utf8_lossy(&v[10..10 + len]).to_string();
        return Some((rh, reason));
    }
    if v.len() < 2 {
        return None;
    }
    let len = u16::from_le_bytes(v[0..2].try_into().ok()?) as usize;
    if v.len() < 2 + len {
        return None;
    }
    let reason = String::from_utf8_lossy(&v[2..2 + len]).to_string();
    let rh = crate::chain::reason_hash::reason_hash64(&reason);
    Some((rh, reason))
}

/// Exclusive upper bound for keys with this hash prefix (hash || 0xFF..). 44 bytes.
pub fn make_hash_upper_exclusive(hash: &[u8; 32]) -> [u8; 44] {
    let mut k = [0xFFu8; 44];
    k[0..32].copy_from_slice(hash);
    k
}
