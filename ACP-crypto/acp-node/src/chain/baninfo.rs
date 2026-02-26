//! Ban info: pack/unpack (ts + reason) for CF_HEADER_BANINFO.

pub fn pack_baninfo(ts: u64, reason: &str) -> Vec<u8> {
    let mut r = reason.as_bytes().to_vec();
    if r.len() > 512 {
        r.truncate(512);
    }

    let mut out = Vec::with_capacity(8 + 2 + r.len());
    out.extend_from_slice(&ts.to_le_bytes());
    out.extend_from_slice(&(r.len() as u16).to_le_bytes());
    out.extend_from_slice(&r);
    out
}

pub fn unpack_baninfo(b: &[u8]) -> Option<(u64, String)> {
    if b.len() < 10 {
        return None;
    }
    let ts = u64::from_le_bytes(b[0..8].try_into().ok()?);
    let len = u16::from_le_bytes(b[8..10].try_into().ok()?) as usize;
    if b.len() < 10 + len {
        return None;
    }
    let reason = String::from_utf8_lossy(&b[10..10 + len]).to_string();
    Some((ts, reason))
}
