//! Domain separation to prevent cross-protocol signature reuse.

use crate::{CryptoError, Result};
use serde::de::{self, Visitor};
use serde::{Deserialize, Serialize};
use std::fmt;

/// Domain separation tag (prevents cross-protocol signature reuse).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Domain(&'static [u8]);

impl Domain {
    /// Domain for transaction signatures
    pub const TX: Domain = Domain(b"ACP/tx/v1");
    /// Domain for blocks (if needed later)
    pub const BLOCK: Domain = Domain(b"ACP/block/v1");

    /// Returns the domain bytes.
    pub fn bytes(self) -> &'static [u8] {
        self.0
    }

    /// Prepend domain to message.
    pub fn apply(self, msg: &[u8]) -> Result<Vec<u8>> {
        if self.0.is_empty() {
            return Err(CryptoError::DomainError);
        }
        let mut out = Vec::with_capacity(self.0.len() + msg.len());
        out.extend_from_slice(self.0);
        out.extend_from_slice(msg);
        Ok(out)
    }
}

impl Serialize for Domain {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
        serializer.serialize_bytes(self.0)
    }
}

impl<'de> Deserialize<'de> for Domain {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> std::result::Result<Self, D::Error> {
        struct DomainVisitor;
        impl<'de> Visitor<'de> for DomainVisitor {
            type Value = Domain;
            fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
                write!(f, "bytes for domain ACP/tx/v1 or ACP/block/v1")
            }
            fn visit_bytes<E: de::Error>(self, v: &[u8]) -> std::result::Result<Domain, E> {
                if v == b"ACP/tx/v1" {
                    Ok(Domain::TX)
                } else if v == b"ACP/block/v1" {
                    Ok(Domain::BLOCK)
                } else {
                    Err(de::Error::custom("unknown domain"))
                }
            }
            fn visit_seq<A: de::SeqAccess<'de>>(self, mut seq: A) -> std::result::Result<Domain, A::Error> {
                let mut bytes: Vec<u8> = Vec::new();
                while let Some(b) = seq.next_element()? {
                    bytes.push(b);
                }
                if bytes == b"ACP/tx/v1" {
                    Ok(Domain::TX)
                } else if bytes == b"ACP/block/v1" {
                    Ok(Domain::BLOCK)
                } else {
                    Err(de::Error::custom("unknown domain"))
                }
            }
        }
        deserializer.deserialize_bytes(DomainVisitor)
    }
}
