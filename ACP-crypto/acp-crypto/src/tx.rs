//! Transaction: wire v1/v2, Recipient (AddressV0 / PubkeyWire), signing, txid.

use crate::{
    address::{address_v0_from_pubkey_wire, AddressV0},
    bytes, limits, protocol_params, CryptoError, Domain, HybridPublicKey, HybridSecretKey,
    HybridSignature, Result,
};
use sha2::{Digest, Sha256};

pub type TxId = [u8; 32];

/// TX input (still placeholder for v0.x).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TxInput {
    pub prev_txid: TxId,
    pub vout: u32,
    pub amount: u64,
}

/// Recipient type for outputs (v2).
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Recipient {
    /// Legacy recipient: pubkey wire bytes (wire v1).
    PubkeyWire(Vec<u8>),
    /// New recipient: address v0 (20-byte pubkey_hash).
    AddressV0([u8; 20]),
}

/// Output v2: amount + recipient (address-based).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TxOutput {
    pub amount: u64,
    pub recipient: Recipient,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Transaction {
    pub version: u8,
    pub chain_id: u32,
    pub lock_time: u32,

    pub inputs: Vec<TxInput>,
    pub outputs: Vec<TxOutput>,

    pub sender_pubkey_wire: Vec<u8>,
    pub signature_wire: Vec<u8>,
}

impl TxOutput {
    /// Best-effort: return bech32 acp1... address for this output.
    pub fn recipient_address_bech32(&self) -> Result<String> {
        let a = match &self.recipient {
            Recipient::AddressV0(h20) => AddressV0 {
                pubkey_hash20: *h20,
            },
            Recipient::PubkeyWire(w) => address_v0_from_pubkey_wire(w)?,
        };
        a.encode()
    }

    /// Return 20-byte pubkey hash for this output.
    pub fn recipient_hash20(&self) -> Result<[u8; 20]> {
        Ok(match &self.recipient {
            Recipient::AddressV0(h20) => *h20,
            Recipient::PubkeyWire(w) => address_v0_from_pubkey_wire(w)?.pubkey_hash20,
        })
    }

    /// Create v2 output using AddressV0 (recommended default).
    pub fn to_address_v0(amount: u64, addr: &AddressV0) -> Self {
        Self {
            amount,
            recipient: Recipient::AddressV0(addr.pubkey_hash20),
        }
    }

    /// Create v2 output using AddressV0 derived from recipient pubkey wire bytes.
    pub fn to_address_v0_from_pubkey_wire(
        amount: u64,
        recipient_pubkey_wire: &[u8],
    ) -> Result<Self> {
        let a = address_v0_from_pubkey_wire(recipient_pubkey_wire)?;
        Ok(Self {
            amount,
            recipient: Recipient::AddressV0(a.pubkey_hash20),
        })
    }

    /// Legacy output: store recipient pubkey wire bytes directly (for old tooling).
    pub fn to_pubkey_wire(amount: u64, recipient_pubkey_wire: Vec<u8>) -> Result<Self> {
        bytes::ensure_max(
            &recipient_pubkey_wire,
            limits::MAX_WIRE_PUBKEY,
            CryptoError::InvalidKeyBytes,
        )?;
        Ok(Self {
            amount,
            recipient: Recipient::PubkeyWire(recipient_pubkey_wire),
        })
    }
}

impl Transaction {
    pub fn new_unsigned(chain_id: u32, inputs: Vec<TxInput>, outputs: Vec<TxOutput>) -> Self {
        Self {
            version: 1,
            chain_id,
            lock_time: 0,
            inputs,
            outputs,
            sender_pubkey_wire: Vec::new(),
            signature_wire: Vec::new(),
        }
    }

    pub fn fee(&self) -> Result<u64> {
        let in_sum: u128 = self.inputs.iter().map(|i| i.amount as u128).sum();
        let out_sum: u128 = self.outputs.iter().map(|o| o.amount as u128).sum();
        if out_sum > in_sum {
            return Err(CryptoError::Serialization(
                "tx: outputs exceed inputs".into(),
            ));
        }
        Ok((in_sum - out_sum) as u64)
    }

    /// Bytes that are signed (signature not included).
    pub fn signing_bytes(&self) -> Result<Vec<u8>> {
        if self.inputs.len() > protocol_params::MAX_TX_INPUTS_OUTPUTS as usize
            || self.outputs.len() > protocol_params::MAX_TX_INPUTS_OUTPUTS as usize
        {
            return Err(CryptoError::Serialization(
                "tx: too many inputs/outputs".into(),
            ));
        }
        let _fee = self.fee()?;

        let mut out = Vec::with_capacity(256);

        out.push(self.version);
        out.extend_from_slice(&self.chain_id.to_le_bytes());
        out.extend_from_slice(&self.lock_time.to_le_bytes());

        if self.inputs.len() > u16::MAX as usize {
            return Err(CryptoError::Serialization("tx: inputs overflow".into()));
        }
        out.extend_from_slice(&(self.inputs.len() as u16).to_le_bytes());
        for inp in &self.inputs {
            out.extend_from_slice(&inp.prev_txid);
            out.extend_from_slice(&inp.vout.to_le_bytes());
            out.extend_from_slice(&inp.amount.to_le_bytes());
        }

        if self.outputs.len() > u16::MAX as usize {
            return Err(CryptoError::Serialization("tx: outputs overflow".into()));
        }
        out.extend_from_slice(&(self.outputs.len() as u16).to_le_bytes());

        for o in &self.outputs {
            out.extend_from_slice(&o.amount.to_le_bytes());

            match &o.recipient {
                Recipient::AddressV0(h20) => {
                    out.push(0x02);
                    out.extend_from_slice(h20);
                }
                Recipient::PubkeyWire(w) => {
                    out.push(0x01);
                    bytes::ensure_max(w, limits::MAX_WIRE_PUBKEY, CryptoError::InvalidKeyBytes)?;
                    let len: u16 = w
                        .len()
                        .try_into()
                        .map_err(|_| CryptoError::InvalidKeyBytes)?;
                    out.extend_from_slice(&len.to_le_bytes());
                    out.extend_from_slice(w);
                }
            }
        }

        bytes::ensure_max(
            &self.sender_pubkey_wire,
            limits::MAX_WIRE_PUBKEY,
            CryptoError::InvalidKeyBytes,
        )?;
        let pk_len: u16 = self
            .sender_pubkey_wire
            .len()
            .try_into()
            .map_err(|_| CryptoError::InvalidKeyBytes)?;
        out.extend_from_slice(&pk_len.to_le_bytes());
        out.extend_from_slice(&self.sender_pubkey_wire);

        Ok(out)
    }

    pub fn txid(&self) -> Result<TxId> {
        bytes::ensure_max(
            &self.signature_wire,
            limits::MAX_WIRE_SIGNATURE,
            CryptoError::InvalidSignatureBytes,
        )?;
        let mut h = Sha256::new();
        h.update(self.signing_bytes()?);
        h.update(&self.signature_wire);
        let digest = h.finalize();
        let mut id = [0u8; 32];
        id.copy_from_slice(&digest);
        Ok(id)
    }

    pub fn sign(&mut self, sk: &HybridSecretKey) -> Result<()> {
        let pk = sk.public_key();
        self.sender_pubkey_wire = pk.to_wire_bytes()?;

        let msg = self.signing_bytes()?;
        let sig: HybridSignature = sk.sign(Domain::TX, &msg)?;
        self.signature_wire = sig.to_wire_bytes()?;
        Ok(())
    }

    pub fn verify(&self) -> Result<()> {
        if self.sender_pubkey_wire.is_empty() || self.signature_wire.is_empty() {
            return Err(CryptoError::VerifyFailed);
        }
        let _fee = self.fee()?;

        let pk = HybridPublicKey::from_wire_bytes(&self.sender_pubkey_wire)?;
        let sig = HybridSignature::from_wire_bytes(&self.signature_wire)?;
        let msg = self.signing_bytes()?;
        pk.verify(Domain::TX, &msg, &sig)
    }

    /// TX wire:
    /// - v0.30 legacy: tx-wire version = 0x01 (body = old outputs layout)
    /// - v0.31 new:    tx-wire version = 0x02 (body = v2 outputs layout with recipient kind)
    pub fn to_wire(&self) -> Result<Vec<u8>> {
        let mut out = Vec::with_capacity(512);

        out.push(0x02);

        out.push(self.version);
        out.extend_from_slice(&self.chain_id.to_le_bytes());
        out.extend_from_slice(&self.lock_time.to_le_bytes());

        let sb = self.signing_bytes()?;
        let body = sb
            .get(1 + 4 + 4..)
            .ok_or_else(|| CryptoError::Serialization("tx: body slice".into()))?;

        let body_len: u32 = body
            .len()
            .try_into()
            .map_err(|_| CryptoError::Serialization("tx: body too large".into()))?;
        out.extend_from_slice(&body_len.to_le_bytes());
        out.extend_from_slice(body);

        bytes::ensure_max(
            &self.signature_wire,
            limits::MAX_WIRE_SIGNATURE,
            CryptoError::InvalidSignatureBytes,
        )?;
        let sig_len: u32 = self
            .signature_wire
            .len()
            .try_into()
            .map_err(|_| CryptoError::Serialization("tx: sig too large".into()))?;
        out.extend_from_slice(&sig_len.to_le_bytes());
        out.extend_from_slice(&self.signature_wire);

        Ok(out)
    }

    pub fn from_wire(b: &[u8]) -> Result<Self> {
        if b.len() < 1 + 1 + 4 + 4 + 4 + 4 {
            return Err(CryptoError::Serialization("tx: too short".into()));
        }
        let mut i = 0usize;

        let wire_v = b[i];
        i += 1;
        if wire_v != 0x01 && wire_v != 0x02 {
            return Err(CryptoError::Serialization(
                "tx: unsupported wire version".into(),
            ));
        }

        let version = b[i];
        i += 1;
        let chain_id = u32::from_le_bytes(b[i..i + 4].try_into().unwrap());
        i += 4;
        let lock_time = u32::from_le_bytes(b[i..i + 4].try_into().unwrap());
        i += 4;

        let body_len = u32::from_le_bytes(b[i..i + 4].try_into().unwrap()) as usize;
        i += 4;
        if i + body_len > b.len() {
            return Err(CryptoError::Serialization("tx: body oob".into()));
        }
        let body = &b[i..i + body_len];
        i += body_len;

        let sig_len = u32::from_le_bytes(b[i..i + 4].try_into().unwrap()) as usize;
        i += 4;
        if i + sig_len != b.len() {
            return Err(CryptoError::Serialization("tx: sig oob".into()));
        }
        let sig = &b[i..i + sig_len];
        bytes::ensure_max(
            sig,
            limits::MAX_WIRE_SIGNATURE,
            CryptoError::InvalidSignatureBytes,
        )?;

        let mut sb = Vec::with_capacity(1 + 4 + 4 + body.len());
        sb.push(version);
        sb.extend_from_slice(&chain_id.to_le_bytes());
        sb.extend_from_slice(&lock_time.to_le_bytes());
        sb.extend_from_slice(body);

        let mut p = 0usize;
        let _v = sb[p];
        p += 1;
        let _cid = u32::from_le_bytes(sb[p..p + 4].try_into().unwrap());
        p += 4;
        let _lt = u32::from_le_bytes(sb[p..p + 4].try_into().unwrap());
        p += 4;

        let inputs_n = u16::from_le_bytes(sb[p..p + 2].try_into().unwrap()) as usize;
        p += 2;
        let mut inputs = Vec::with_capacity(inputs_n);
        for _ in 0..inputs_n {
            let prev: TxId = sb[p..p + 32]
                .try_into()
                .map_err(|_| CryptoError::Serialization("tx: prev".into()))?;
            p += 32;
            let vout = u32::from_le_bytes(sb[p..p + 4].try_into().unwrap());
            p += 4;
            let amount = u64::from_le_bytes(sb[p..p + 8].try_into().unwrap());
            p += 8;
            inputs.push(TxInput {
                prev_txid: prev,
                vout,
                amount,
            });
        }

        let outputs_n = u16::from_le_bytes(sb[p..p + 2].try_into().unwrap()) as usize;
        p += 2;
        let mut outputs = Vec::with_capacity(outputs_n);

        for _ in 0..outputs_n {
            let amount = u64::from_le_bytes(sb[p..p + 8].try_into().unwrap());
            p += 8;

            if wire_v == 0x01 {
                let pk_len =
                    u16::from_le_bytes(sb[p..p + 2].try_into().unwrap()) as usize;
                p += 2;
                if pk_len > limits::MAX_WIRE_PUBKEY {
                    return Err(CryptoError::InvalidKeyBytes);
                }
                let pk = sb[p..p + pk_len].to_vec();
                p += pk_len;
                outputs.push(TxOutput {
                    amount,
                    recipient: Recipient::PubkeyWire(pk),
                });
            } else {
                let kind = sb[p];
                p += 1;
                match kind {
                    0x02 => {
                        let mut h20 = [0u8; 20];
                        h20.copy_from_slice(&sb[p..p + 20]);
                        p += 20;
                        outputs.push(TxOutput {
                            amount,
                            recipient: Recipient::AddressV0(h20),
                        });
                    }
                    0x01 => {
                        let pk_len =
                            u16::from_le_bytes(sb[p..p + 2].try_into().unwrap()) as usize;
                        p += 2;
                        if pk_len > limits::MAX_WIRE_PUBKEY {
                            return Err(CryptoError::InvalidKeyBytes);
                        }
                        let pk = sb[p..p + pk_len].to_vec();
                        p += pk_len;
                        outputs.push(TxOutput {
                            amount,
                            recipient: Recipient::PubkeyWire(pk),
                        });
                    }
                    _ => {
                        return Err(CryptoError::Serialization(
                            "tx: unknown recipient kind".into(),
                        ))
                    }
                }
            }
        }

        let sender_pk_len =
            u16::from_le_bytes(sb[p..p + 2].try_into().unwrap()) as usize;
        p += 2;
        if sender_pk_len > limits::MAX_WIRE_PUBKEY {
            return Err(CryptoError::InvalidKeyBytes);
        }
        let sender_pk = sb[p..p + sender_pk_len].to_vec();
        p += sender_pk_len;

        if p != sb.len() {
            return Err(CryptoError::Serialization("tx: trailing bytes".into()));
        }

        let tx = Transaction {
            version,
            chain_id,
            lock_time,
            inputs,
            outputs,
            sender_pubkey_wire: sender_pk,
            signature_wire: sig.to_vec(),
        };

        let _ = tx.fee()?;
        Ok(tx)
    }
}
