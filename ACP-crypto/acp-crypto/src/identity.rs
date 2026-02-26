//! Wallet identity: spend / view / audit keys derived from master seed.

use crate::address::{address_v0_from_pubkey_wire, AddressV0};
use crate::hybrid::{HybridPublicKey, HybridSecretKey};
use crate::keystore::{Keystore, KeystoreV3};
use crate::kdf;
use crate::seed::Seed;
use crate::Result;
use rand_core::CryptoRngCore;
use serde::{Deserialize, Serialize};

/// Key role: spend (tx), view (scan), audit (disclosure).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum KeyRole {
    Spend,
    View,
    Audit,
}

/// Full wallet identity (spend + view + audit hybrid keys).
#[derive(Debug)]
pub struct WalletIdentity {
    pub spend: HybridSecretKey,
    pub view: HybridSecretKey,
    pub audit: HybridSecretKey,
}

/// Public identity (spend/view/audit public keys).
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct WalletPublicIdentity {
    pub spend: HybridPublicKey,
    pub view: HybridPublicKey,
    pub audit: HybridPublicKey,
}

/// Wraps 32-byte role seed for use with HybridSecretKey::from_seed.
struct SeedWrapper([u8; 32]);

impl SeedWrapper {
    fn as_seed(&self) -> Seed {
        Seed::from_bytes(self.0.to_vec())
    }
}

impl WalletIdentity {
    /// Create identity from master seed: Ed25519 per role via HKDF, Dilithium generated once.
    pub fn new_from_seed(seed: &Seed, mut rng: impl CryptoRngCore) -> Result<Self> {
        let spend_ed = kdf::hkdf_32(seed.as_bytes(), b"ACP/role/spend/ed25519/seed/v1");
        let view_ed = kdf::hkdf_32(seed.as_bytes(), b"ACP/role/view/ed25519/seed/v1");
        let audit_ed = kdf::hkdf_32(seed.as_bytes(), b"ACP/role/audit/ed25519/seed/v1");

        let spend_seed = SeedWrapper(spend_ed);
        let view_seed = SeedWrapper(view_ed);
        let audit_seed = SeedWrapper(audit_ed);

        let spend = HybridSecretKey::from_seed(&spend_seed.as_seed(), &mut rng)?;
        let view = HybridSecretKey::from_seed(&view_seed.as_seed(), &mut rng)?;
        let audit = HybridSecretKey::from_seed(&audit_seed.as_seed(), &mut rng)?;

        Ok(Self { spend, view, audit })
    }

    /// Public keys for all roles.
    pub fn public(&self) -> WalletPublicIdentity {
        WalletPublicIdentity {
            spend: self.spend.public_key(),
            view: self.view.public_key(),
            audit: self.audit.public_key(),
        }
    }

    /// Primary receive address (bech32 acp1...) derived from PUBLIC VIEW key (wire bytes).
    /// Stable across devices as long as the same seed/identity is used.
    pub fn receive_address_v0(&self) -> Result<String> {
        let view_wire = self.public().view.to_wire_bytes()?;
        let addr = address_v0_from_pubkey_wire(&view_wire)?;
        addr.encode()
    }

    /// Same as receive_address_v0, but returns raw v0 object (hash20).
    pub fn receive_address_v0_obj(&self) -> Result<AddressV0> {
        let view_wire = self.public().view.to_wire_bytes()?;
        address_v0_from_pubkey_wire(&view_wire)
    }

    /// Build keystore plaintext v3 from identity and master seed.
    /// Stores the same ed25519_seed32 that each role's to_keystore_plaintext uses (HKDF from role seed),
    /// so from_keystore_v3 restores the same Ed25519 keys.
    pub fn to_keystore_v3(&self, master_seed: &Seed) -> Result<KeystoreV3> {
        let spend_ed = kdf::hkdf_32(master_seed.as_bytes(), b"ACP/role/spend/ed25519/seed/v1");
        let view_ed = kdf::hkdf_32(master_seed.as_bytes(), b"ACP/role/view/ed25519/seed/v1");
        let audit_ed = kdf::hkdf_32(master_seed.as_bytes(), b"ACP/role/audit/ed25519/seed/v1");

        let spend_seed = SeedWrapper(spend_ed);
        let view_seed = SeedWrapper(view_ed);
        let audit_seed = SeedWrapper(audit_ed);

        let sp = self.spend.to_keystore_plaintext(&spend_seed.as_seed())?;
        let vw = self.view.to_keystore_plaintext(&view_seed.as_seed())?;
        let au = self.audit.to_keystore_plaintext(&audit_seed.as_seed())?;

        Ok(KeystoreV3 {
            v: 3,
            spend_ed25519_seed32: sp.ed25519_seed32,
            view_ed25519_seed32: vw.ed25519_seed32,
            audit_ed25519_seed32: au.ed25519_seed32,
            spend_dilithium_pk: sp.dilithium_pk,
            spend_dilithium_sk: sp.dilithium_sk,
            view_dilithium_pk: vw.dilithium_pk,
            view_dilithium_sk: vw.dilithium_sk,
            audit_dilithium_pk: au.dilithium_pk,
            audit_dilithium_sk: au.dilithium_sk,
        })
    }

    /// Restore identity from keystore plaintext v3.
    pub fn from_keystore_v3(ks: &KeystoreV3) -> Result<Self> {
        ks.validate()?;

        let sp = Keystore {
            v: 2,
            ed25519_seed32: ks.spend_ed25519_seed32,
            dilithium_pk: ks.spend_dilithium_pk.clone(),
            dilithium_sk: ks.spend_dilithium_sk.clone(),
        };
        let vw = Keystore {
            v: 2,
            ed25519_seed32: ks.view_ed25519_seed32,
            dilithium_pk: ks.view_dilithium_pk.clone(),
            dilithium_sk: ks.view_dilithium_sk.clone(),
        };
        let au = Keystore {
            v: 2,
            ed25519_seed32: ks.audit_ed25519_seed32,
            dilithium_pk: ks.audit_dilithium_pk.clone(),
            dilithium_sk: ks.audit_dilithium_sk.clone(),
        };

        let spend = HybridSecretKey::from_keystore(&sp)?;
        let view = HybridSecretKey::from_keystore(&vw)?;
        let audit = HybridSecretKey::from_keystore(&au)?;

        Ok(Self { spend, view, audit })
    }
}
