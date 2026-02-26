//! Banlog: key/value pack for CF_BANLOG (ts||seq -> headerhash||reason).

pub fn make_banlog_key(ts: u64, seq: u32) -> [u8; 12] {
    let mut k = [0u8; 12];
    k[..8].copy_from_slice(&ts.to_le_bytes());
    k[8..12].copy_from_slice(&seq.to_le_bytes());
    k
}

pub fn pack_banlog_value(headerhash: &[u8; 32], reason: &str) -> Vec<u8> {
    let mut r = reason.as_bytes().to_vec();
    if r.len() > 512 {
        r.truncate(512);
    }
    let rh = crate::chain::reason_hash::reason_hash64(&String::from_utf8_lossy(&r));

    let mut out = Vec::with_capacity(32 + 8 + 2 + r.len());
    out.extend_from_slice(headerhash);
    out.extend_from_slice(&rh.to_le_bytes());
    out.extend_from_slice(&(r.len() as u16).to_le_bytes());
    out.extend_from_slice(&r);
    out
}

/// Returns (headerhash, reason_hash64, reason). Supports v1 (no reason_hash64) and v2.
pub fn unpack_banlog_value(v: &[u8]) -> Option<([u8; 32], u64, String)> {
    if v.len() < 34 {
        return None;
    }
    let mut hh = [0u8; 32];
    hh.copy_from_slice(&v[..32]);

    if v.len() >= 32 + 8 + 2 {
        let rh = u64::from_le_bytes(v[32..40].try_into().ok()?);
        let len = u16::from_le_bytes(v[40..42].try_into().ok()?) as usize;
        if v.len() < 42 + len {
            return None;
        }
        let reason = String::from_utf8_lossy(&v[42..42 + len]).to_string();
        return Some((hh, rh, reason));
    }

    let len = u16::from_le_bytes(v[32..34].try_into().ok()?) as usize;
    if v.len() < 34 + len {
        return None;
    }
    let reason = String::from_utf8_lossy(&v[34..34 + len]).to_string();
    let rh = crate::chain::reason_hash::reason_hash64(&reason);
    Some((hh, rh, reason))
}
