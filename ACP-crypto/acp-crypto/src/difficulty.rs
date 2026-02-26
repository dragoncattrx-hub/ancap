//! Difficulty from compact bits (Bitcoin-like nBits). Stub for RPC/explorers.

use crate::{CryptoError, Result};

/// Difficulty computed from Bitcoin-like compact bits.
/// This is a deterministic stub useful for explorers/exchanges.
///
/// difficulty = target(ref_bits) / target(bits)
pub fn difficulty_from_bits(bits: u32, ref_bits: u32) -> Result<f64> {
    let t = target_from_compact(bits)?;
    let tref = target_from_compact(ref_bits)?;
    if t == 0.0 || tref == 0.0 {
        return Err(CryptoError::Serialization("difficulty: zero target".into()));
    }
    Ok(tref / t)
}

fn target_from_compact(bits: u32) -> Result<f64> {
    let exp = ((bits >> 24) & 0xff) as i32;
    let mant = bits & 0x007fffff;

    if mant == 0 {
        return Ok(0.0);
    }

    // target = mantissa * 256^(exp-3)
    let mant_f = mant as f64;
    let pow = exp - 3;

    let target = if pow >= 0 {
        mant_f * 256f64.powi(pow)
    } else {
        mant_f / 256f64.powi(-pow)
    };

    Ok(target)
}
