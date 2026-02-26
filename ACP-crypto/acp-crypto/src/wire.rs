//! Stable wire format (v1) for public keys and signatures (TX / network / RPC).

use crate::{bytes, limits, CryptoError, Result};

/// Encode to wire bytes.
pub trait WireEncode {
    fn to_wire(&self) -> Result<Vec<u8>>;
}

/// Decode from wire bytes.
pub trait WireDecode: Sized {
    fn from_wire(bytes: &[u8]) -> Result<Self>;
}

fn read_u16_le(input: &[u8], i: &mut usize) -> Result<u16> {
    if *i + 2 > input.len() {
        return Err(CryptoError::Serialization("wire: u16 out of bounds".into()));
    }
    let v = u16::from_le_bytes([input[*i], input[*i + 1]]);
    *i += 2;
    Ok(v)
}

fn read_bytes<'a>(input: &'a [u8], i: &mut usize, n: usize) -> Result<&'a [u8]> {
    if *i + n > input.len() {
        return Err(CryptoError::Serialization("wire: bytes out of bounds".into()));
    }
    let out = &input[*i..*i + n];
    *i += n;
    Ok(out)
}

/// Wire-encoded public key (v1: version 0x01, kind 0x01, flags, sections).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PublicKeyBytes {
    pub ed25519: Option<[u8; 32]>,
    pub dilithium: Option<Vec<u8>>,
}

/// Wire-encoded signature (v1: version 0x01, kind 0x02, flags, sections).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SignatureBytes {
    pub ed25519: Option<[u8; 64]>,
    pub dilithium: Option<Vec<u8>>,
}

impl WireEncode for PublicKeyBytes {
    fn to_wire(&self) -> Result<Vec<u8>> {
        let mut flags = 0u8;
        if self.ed25519.is_some() {
            flags |= 1;
        }
        if self.dilithium.is_some() {
            flags |= 2;
        }

        let mut out = Vec::with_capacity(128);
        out.push(0x01); // version
        out.push(0x01); // kind: pubkey
        out.push(flags);

        if let Some(pk) = self.ed25519 {
            out.extend_from_slice(&(32u16).to_le_bytes());
            out.extend_from_slice(&pk);
        }
        if let Some(ref pq) = self.dilithium {
            bytes::ensure_max(pq, limits::MAX_PUBKEY_BYTES, CryptoError::InvalidKeyBytes)?;
            let len: u16 = pq
                .len()
                .try_into()
                .map_err(|_| CryptoError::InvalidKeyBytes)?;
            out.extend_from_slice(&len.to_le_bytes());
            out.extend_from_slice(pq);
        }

        bytes::ensure_max(&out, limits::MAX_WIRE_PUBKEY, CryptoError::InvalidKeyBytes)?;
        Ok(out)
    }
}

impl WireDecode for PublicKeyBytes {
    fn from_wire(input: &[u8]) -> Result<Self> {
        bytes::ensure_max(input, limits::MAX_WIRE_PUBKEY, CryptoError::InvalidKeyBytes)?;
        if input.len() < 3 {
            return Err(CryptoError::Serialization("wire: too short".into()));
        }
        if input[0] != 0x01 || input[1] != 0x01 {
            return Err(CryptoError::Serialization("wire: bad header".into()));
        }
        let flags = input[2];
        let mut i = 3;

        let ed25519 = if (flags & 1) != 0 {
            let len = read_u16_le(input, &mut i)? as usize;
            if len != 32 {
                return Err(CryptoError::InvalidKeyBytes);
            }
            let b = read_bytes(input, &mut i, 32)?;
            let mut pk = [0u8; 32];
            pk.copy_from_slice(b);
            Some(pk)
        } else {
            None
        };

        let dilithium = if (flags & 2) != 0 {
            let len = read_u16_le(input, &mut i)? as usize;
            if len == 0 || len > limits::MAX_PUBKEY_BYTES {
                return Err(CryptoError::InvalidKeyBytes);
            }
            Some(read_bytes(input, &mut i, len)?.to_vec())
        } else {
            None
        };

        if i != input.len() {
            return Err(CryptoError::Serialization("wire: trailing bytes".into()));
        }

        Ok(Self { ed25519, dilithium })
    }
}

impl WireEncode for SignatureBytes {
    fn to_wire(&self) -> Result<Vec<u8>> {
        let mut flags = 0u8;
        if self.ed25519.is_some() {
            flags |= 1;
        }
        if self.dilithium.is_some() {
            flags |= 2;
        }

        let mut out = Vec::with_capacity(256);
        out.push(0x01); // version
        out.push(0x02); // kind: signature
        out.push(flags);

        if let Some(sig) = self.ed25519 {
            out.extend_from_slice(&(64u16).to_le_bytes());
            out.extend_from_slice(&sig);
        }
        if let Some(ref pq) = self.dilithium {
            bytes::ensure_max(
                pq,
                limits::MAX_SIGNATURE_BYTES,
                CryptoError::InvalidSignatureBytes,
            )?;
            let len: u16 = pq
                .len()
                .try_into()
                .map_err(|_| CryptoError::InvalidSignatureBytes)?;
            out.extend_from_slice(&len.to_le_bytes());
            out.extend_from_slice(pq);
        }

        bytes::ensure_max(
            &out,
            limits::MAX_WIRE_SIGNATURE,
            CryptoError::InvalidSignatureBytes,
        )?;
        Ok(out)
    }
}

impl WireDecode for SignatureBytes {
    fn from_wire(input: &[u8]) -> Result<Self> {
        bytes::ensure_max(
            input,
            limits::MAX_WIRE_SIGNATURE,
            CryptoError::InvalidSignatureBytes,
        )?;
        if input.len() < 3 {
            return Err(CryptoError::Serialization("wire: too short".into()));
        }
        if input[0] != 0x01 || input[1] != 0x02 {
            return Err(CryptoError::Serialization("wire: bad header".into()));
        }
        let flags = input[2];
        let mut i = 3;

        let ed25519 = if (flags & 1) != 0 {
            let len = read_u16_le(input, &mut i)? as usize;
            if len != 64 {
                return Err(CryptoError::InvalidSignatureBytes);
            }
            let b = read_bytes(input, &mut i, 64)?;
            let mut sig = [0u8; 64];
            sig.copy_from_slice(b);
            Some(sig)
        } else {
            None
        };

        let dilithium = if (flags & 2) != 0 {
            let len = read_u16_le(input, &mut i)? as usize;
            if len == 0 || len > limits::MAX_SIGNATURE_BYTES {
                return Err(CryptoError::InvalidSignatureBytes);
            }
            Some(read_bytes(input, &mut i, len)?.to_vec())
        } else {
            None
        };

        if i != input.len() {
            return Err(CryptoError::Serialization("wire: trailing bytes".into()));
        }

        Ok(Self { ed25519, dilithium })
    }
}
