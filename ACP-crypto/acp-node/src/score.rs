//! Fork-choice score (work) from header bits. Used for header-tree and getheaders.

pub const DIFF_SCALE: f64 = 1_000_000.0;

/// Work for one header (fixed-point from difficulty). At least 1.
pub fn header_work(bits: u32) -> u128 {
    let d = acp_crypto::difficulty_from_bits(bits, crate::config::GENESIS_BITS).unwrap_or(1.0);
    let w = (d * DIFF_SCALE) as u128;
    if w == 0 {
        1
    } else {
        w
    }
}
