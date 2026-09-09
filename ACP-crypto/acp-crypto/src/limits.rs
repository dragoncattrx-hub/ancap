//! Hard limits to reduce parser / mempool DoS risks.

/// Maximum allowed public key bytes (serialized).
pub const MAX_PUBKEY_BYTES: usize = 8 * 1024;
/// Maximum allowed signature bytes (serialized).
pub const MAX_SIGNATURE_BYTES: usize = 8 * 1024;
/// Maximum allowed keystore JSON length.
pub const MAX_KEYSTORE_JSON_BYTES: usize = 64 * 1024;
/// Maximum allowed ciphertext bytes for keystore (must fit plaintext + auth tag).
pub const MAX_KEYSTORE_CIPHERTEXT_BYTES: usize = 64 * 1024;
/// Maximum allowed plaintext bytes stored inside keystore (V3 with PQC ~25-40KB).
pub const MAX_KEYSTORE_PLAINTEXT_BYTES: usize = 48 * 1024;

/// Argon2 memory cost (KiB). Tune later.
pub const ARGON2_MEM_KIB: u32 = 64 * 1024; // 64 MiB
/// Argon2 iterations.
pub const ARGON2_TIME: u32 = 3;
/// Argon2 parallelism.
pub const ARGON2_PARALLELISM: u32 = 1;

/// Max size for wire-encoded public key.
pub const MAX_WIRE_PUBKEY: usize = 4096;
/// Max size for wire-encoded signature.
pub const MAX_WIRE_SIGNATURE: usize = 4096;

/// Maximum plaintext accepted by one hybrid envelope (1 MiB).
pub const MAX_HYBRID_PLAINTEXT_BYTES: usize = 1024 * 1024;
/// Maximum caller-provided authenticated context (4 KiB).
pub const MAX_HYBRID_CONTEXT_BYTES: usize = 4 * 1024;
/// Maximum AEAD ciphertext including the 16-byte authentication tag.
pub const MAX_HYBRID_CIPHERTEXT_BYTES: usize = MAX_HYBRID_PLAINTEXT_BYTES + 16;
/// Maximum JSON encoding accepted for a hybrid recipient public key.
pub const MAX_HYBRID_PUBLIC_KEY_JSON_BYTES: usize = 64 * 1024;
/// Maximum JSON encoding accepted for a hybrid envelope.
///
/// Serde's human-readable byte-array representation can require almost four
/// bytes per ciphertext byte, so this is larger than the binary payload cap.
pub const MAX_HYBRID_ENVELOPE_JSON_BYTES: usize = 5 * 1024 * 1024;
