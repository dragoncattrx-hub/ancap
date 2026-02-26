# acp-crypto v0.2 — ANCAP token (ACP)

- **BIP39 mnemonic** → master seed (64 bytes).
- **Ed25519** derived deterministically from seed (HKDF, domain `ACP/ed25519/seed/v1`).
- **Dilithium** (PQC) generated once at random and stored in keystore (pqcrypto has no seed-based API).
- **Keystore**: encrypted JSON (Argon2id + XChaCha20-Poly1305), versioned format, size limits (anti-DoS).

## Features

- **`pqc`** (default): enable Dilithium. Turn off for faster builds: `cargo build --no-default-features`.

## Usage

**New wallet (mnemonic + keystore):**

```rust
use acp_crypto::{KeystoreJson, Mnemonic, HybridSecretKey};
use rand_core::OsRng;

let m = Mnemonic::generate_12()?;
let seed = m.to_seed("");
let sk = HybridSecretKey::from_seed(&seed, OsRng)?;
let ks_plain = sk.to_keystore_plaintext(&seed)?;
let enc = KeystoreJson::encrypt(password, &ks_plain, OsRng)?;
let json = enc.to_string_pretty()?;  // save to file
// Show user: m.words() (12 words) + keystore file path
```

**Restore from keystore:**

```rust
let enc = KeystoreJson::from_str(&std::fs::read_to_string("keystore.json")?)?;
let ks = enc.decrypt(password)?;
let sk = HybridSecretKey::from_keystore(&ks)?;
```

**Sign / verify:**

```rust
use acp_crypto::{Domain, Signer, Verifier};
let sig = sk.sign(Domain::TX, msg)?;
pk.verify(Domain::TX, msg, &sig)?;
```

## Layout

- **Domain**: `Domain::TX`, `Domain::BLOCK` — domain separation.
- **Limits**: `limits::MAX_KEYSTORE_JSON_BYTES`, `MAX_KEYSTORE_CIPHERTEXT_BYTES`, etc.
- **Keystore**: `v: 2`, KDF argon2id, ciphertext base64; plaintext has `ed25519_seed32`, `dilithium_pk`/`dilithium_sk`, optional `created_at`.

## Next steps

- KAT test vectors.
- Wire format for keys/signatures (binary schema).
