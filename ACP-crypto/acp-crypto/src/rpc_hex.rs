//! RPC hex helpers: encode/decode tx, pubkey, signature for JSON-RPC.

use crate::limits;
use crate::{
    BlockHash, CryptoError, HybridPublicKey, HybridSignature, Result, Transaction, TxId,
};

/// Generic HEX helpers for RPC payloads.
pub struct Hex;

impl Hex {
    /// Encode bytes to lowercase hex.
    pub fn encode(bytes: &[u8]) -> String {
        hex::encode(bytes)
    }

    /// Decode hex into bytes with a size cap.
    pub fn decode_with_limit(s: &str, max: usize) -> Result<Vec<u8>> {
        let s = s.strip_prefix("0x").unwrap_or(s);
        if s.len() / 2 > max {
            return Err(CryptoError::Serialization("hex: payload too large".into()));
        }
        hex::decode(s).map_err(|e| CryptoError::Serialization(format!("hex: {e}")))
    }
}

/// Convenience helpers for transaction HEX used in RPC.
pub struct TxHex;

impl TxHex {
    /// Encode transaction to hex (wire bytes).
    pub fn encode_tx(tx: &Transaction) -> Result<String> {
        let b = tx.to_wire()?;
        Ok(Hex::encode(&b))
    }

    /// Decode transaction from hex.
    pub fn decode_tx(s: &str) -> Result<Transaction> {
        let b = Hex::decode_with_limit(s, 256 * 1024)?;
        Transaction::from_wire(&b)
    }

    /// Encode public key to hex.
    pub fn encode_pubkey(pk: &HybridPublicKey) -> Result<String> {
        let b = pk.to_wire_bytes()?;
        Ok(Hex::encode(&b))
    }

    /// Decode public key from hex.
    pub fn decode_pubkey(s: &str) -> Result<HybridPublicKey> {
        let b = Hex::decode_with_limit(s, limits::MAX_WIRE_PUBKEY)?;
        HybridPublicKey::from_wire_bytes(&b)
    }

    /// Encode signature to hex.
    pub fn encode_signature(sig: &HybridSignature) -> Result<String> {
        let b = sig.to_wire_bytes()?;
        Ok(Hex::encode(&b))
    }

    /// Decode signature from hex.
    pub fn decode_signature(s: &str) -> Result<HybridSignature> {
        let b = Hex::decode_with_limit(s, limits::MAX_WIRE_SIGNATURE)?;
        HybridSignature::from_wire_bytes(&b)
    }

    /// Encode TxId (32 bytes) to hex for RPC.
    pub fn encode_txid(id: &TxId) -> String {
        Hex::encode(id)
    }

    /// Decode TxId from hex (must be 32 bytes).
    pub fn decode_txid(s: &str) -> Result<TxId> {
        let b = Hex::decode_with_limit(s, 32)?;
        if b.len() != 32 {
            return Err(CryptoError::Serialization("txid: invalid length".into()));
        }
        let mut out = [0u8; 32];
        out.copy_from_slice(&b);
        Ok(out)
    }

    /// Encode BlockHash (32 bytes) to hex for RPC.
    pub fn encode_blockhash(h: &BlockHash) -> String {
        Hex::encode(h)
    }

    /// Decode BlockHash from hex (must be 32 bytes).
    pub fn decode_blockhash(s: &str) -> Result<BlockHash> {
        let b = Hex::decode_with_limit(s, 32)?;
        if b.len() != 32 {
            return Err(CryptoError::Serialization("blockhash: invalid length".into()));
        }
        let mut out = [0u8; 32];
        out.copy_from_slice(&b);
        Ok(out)
    }

    /// Decode u64 from hex string (e.g. "0x0123abcd" or "123abcd"). Max 16 hex digits.
    pub fn decode_u64_hex(s: &str) -> Result<u64> {
        let s = s.strip_prefix("0x").unwrap_or(s);
        if s.len() > 16 {
            return Err(CryptoError::Serialization("u64 hex too long".into()));
        }
        u64::from_str_radix(s, 16)
            .map_err(|e| CryptoError::Serialization(format!("u64 hex: {e}")))
    }
}
