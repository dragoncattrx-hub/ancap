# ACP Post-Quantum Envelope Encryption

> Status: experimental application primitive | 2026-09-09  
> Scope: off-chain payload encryption; no consensus or transaction-format change

## What shipped

`acp-crypto` now exposes a versioned hybrid recipient envelope:

`X-Wing draft-10 / HKDF-SHA256 / XChaCha20-Poly1305`

- **ML-KEM-768** is the FIPS 203 post-quantum key-encapsulation component.
- **X25519** preserves a well-understood classical security component.
- **X-Wing draft-10** combines both shared secrets, the ephemeral X25519 key,
  and the recipient X25519 key with its specified **SHA3-256** combiner.
- **HKDF-SHA256** derives an application-specific content key from the X-Wing
  shared secret and authenticated envelope transcript.
- **XChaCha20-Poly1305** encrypts and authenticates the payload.
- Version, exact suite id, recipient key id, both encapsulations, nonce, and
  caller context are authenticated to prevent silent downgrade or header
  substitution.

Implementation: `ACP-crypto/acp-crypto/src/hybrid_kem.rs`

Pinned construction:
[draft-connolly-cfrg-xwing-kem-10](https://datatracker.ietf.org/doc/html/draft-connolly-cfrg-xwing-kem-10).

## Key lifecycle

`HybridKemSecretKey::from_seed` derives a domain-separated 32-byte X-Wing
decapsulation seed from the wallet seed. X-Wing expands that value with
SHAKE-256 into the X25519 and ML-KEM key material. The public recipient key is
stable after mnemonic recovery; no second recovery phrase is introduced.

Use `Mnemonic::generate_24()` (256 bits of mnemonic entropy) for newly
provisioned PQC recipients. A 12-word BIP39 phrase remains compatible, but its
128 bits of entropy cap the derived keys' seed-search security and should not
be marketed as ML-KEM-768's full category-3 strength.

Applications publish `HybridKemPublicKey` and retain only the wallet seed or
an approved encrypted key container. The `key_id` is a SHA-256 digest over the
versioned public-key bundle and can be used for rotation and directory lookup.

## API sketch

```rust
use acp_crypto::HybridKemSecretKey;

let recipient = HybridKemSecretKey::from_seed(&wallet_seed)?;
let public = recipient.public_key();

let envelope = public.seal(payload, b"ACP/aeterna/dna-vault/v1")?;
let plaintext = recipient.open(&envelope, b"ACP/aeterna/dna-vault/v1")?;
```

Use a stable, protocol-specific context. A context mismatch fails
authentication.

## Enforced controls

- Exact suite/version matching; unknown or downgraded suites are rejected.
- Exact X-Wing draft-10 and FIPS 203 component sizes.
- Uniform AEAD failure for fixed-length cryptographic mistakes; callers do
  not learn which header or KEM component failed.
- Size-bounded JSON parsers for public keys and envelopes (reject before
  unbounded Serde allocation).
- 1 MiB plaintext / 4 KiB context / capped JSON transport sizes.
- Secret-bearing Rust types use zeroization where the dependencies support it.
- Published X-Wing draft-10 key-generation + encapsulation vectors plus
  round-trip, recovery, wrong-recipient/context, tamper, downgrade,
  malformed-size, and size-limit tests.
- Dedicated CI verifies the locked Rust 1.88 production toolchain, default
  PQC and classical-only builds, node integration, and a weekly RustSec scan.
- Context authenticates protocol binding only; applications must bind object
  IDs / counters themselves if replay resistance is required.

## Honest security boundary

- This primitive is **experimental** until independent cryptographic review
  and interoperability/KAT coverage are complete. The RustCrypto `ml-kem`
  implementation itself documents that it has not yet had an independent
  audit.
- X-Wing is pinned to `draft-connolly-cfrg-xwing-kem-10`, which remains a
  work in progress rather than an RFC. A future draft requires a new ACP suite
  id/version; existing ciphertexts must never be silently reinterpreted.
- It does not replace TLS, authenticate the sender, hide metadata, rotate
  keys, or erase application plaintext copies. Pair it with an authenticated
  sender identity and an application key-rotation policy.
- Existing chain signatures remain Ed25519 + Dilithium2 for wire/address
  compatibility. Dilithium2 is the predecessor of standardized ML-DSA; this
  release does not relabel the existing signature wire format as FIPS 204.
- HQC remains a future backup candidate, not a deployed dependency: NIST
  selected it for standardization, but the final standard is expected later.

## Next gates

1. Independent design and implementation review.
2. FIPS 203 known-answer and cross-language interoperability vectors.
3. Versioned encrypted-key storage and rotation for AETERNA/orbital payloads.
4. Sender authentication using the existing hybrid signature layer.
5. A separately versioned ML-DSA migration; never reinterpret Dilithium2
   bytes as standardized ML-DSA.
