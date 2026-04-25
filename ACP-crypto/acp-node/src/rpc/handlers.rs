//! JSON-RPC method handlers (getblock, sendrawtransaction, etc.).

use anyhow::Result;
use acp_crypto::{merkle::hash256, Block, Hex, Transaction, TxHex};
use serde_json::json;

use crate::chain::Chain;
use crate::mempool::Mempool;
use crate::storage::db::KvDb;

fn tx_json_decoded(
    tx: &Transaction,
    wire_bytes: &[u8],
    in_mempool: bool,
    best_height: u64,
    tx_meta: Option<(u64, [u8; 32])>,
    block_time_opt: Option<u64>,
) -> serde_json::Value {
    let txid = tx.txid().unwrap();
    let fee = tx.fee().unwrap_or(0);
    let wire_version = wire_bytes.get(0).copied().unwrap_or(0);

    let vin: Vec<serde_json::Value> = tx.inputs.iter().map(|i| {
        json!({
            "prev_txid": Hex::encode(&i.prev_txid),
            "vout": i.vout,
            "amount": i.amount
        })
    }).collect();

    let vout: Vec<serde_json::Value> = tx.outputs.iter().map(|o| {
        let addr = o.recipient_address_bech32().ok();
        match &o.recipient {
            acp_crypto::Recipient::AddressV0(h20) => json!({
                "amount": o.amount,
                "recipient_type": "address_v0",
                "recipient_address": addr,
                "pubkey_hash20": Hex::encode(h20),
            }),
            acp_crypto::Recipient::PubkeyWire(w) => json!({
                "amount": o.amount,
                "recipient_type": "pubkey_wire",
                "recipient_address": addr,
                "recipient_pubkey": Hex::encode(w),
            }),
        }
    }).collect();

    let (blockheight, blockhash, confirmations) = if let Some((h, bh)) = tx_meta {
        let conf = if best_height >= h { best_height - h + 1 } else { 0 };
        (Some(h), Some(TxHex::encode_blockhash(&bh)), Some(conf))
    } else {
        (None, None, Some(0))
    };

    let blocktime = if in_mempool { None } else { block_time_opt };
    let time = blocktime;

    json!({
        "txid": TxHex::encode_txid(&txid),
        "version": tx.version,
        "chain_id": tx.chain_id,
        "lock_time": tx.lock_time,
        "fee": fee,
        "vin": vin,
        "vout": vout,
        "sender_pubkey": Hex::encode(&tx.sender_pubkey_wire),
        "signature": Hex::encode(&tx.signature_wire),

        "size_bytes": wire_bytes.len(),
        "wire_version": wire_version,
        "in_mempool": in_mempool,

        "blockheight": blockheight,
        "blockhash": blockhash,
        "confirmations": confirmations,
        "time": time,
        "blocktime": blocktime
    })
}

pub struct RpcCtx {
    pub chain: Chain,
    pub mempool: Mempool,
    pub node_version: String,
    pub config: crate::config::NodeConfig,
}

pub fn handle(ctx: &RpcCtx, method: &str, params: &serde_json::Value) -> Result<serde_json::Value> {
    match method {
        "getnetworkinfo" => Ok(json!({
            "chain_id": ctx.chain.chain_id,
            "version": ctx.node_version,
            "mempool_size": ctx.mempool.len()
        })),

        "ancap_anchor" => {
            let chain_id = params
                .get("chain_id")
                .and_then(|v| v.as_str())
                .unwrap_or("acp");
            let payload_type = params
                .get("payload_type")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing payload_type"))?;
            let payload_hash = params
                .get("payload_hash")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing payload_hash"))?;

            if payload_hash.len() != 64 || !payload_hash.chars().all(|c| c.is_ascii_hexdigit()) {
                return Err(anyhow::anyhow!("invalid payload_hash: expected 64 hex chars"));
            }

            // Deterministic anchor receipt hash from request payload fields.
            let material = format!("{chain_id}|{payload_type}|{}", payload_hash.to_ascii_lowercase());
            let tx_hash = hash256(material.as_bytes());
            Ok(json!({
                "tx_hash": Hex::encode(&tx_hash),
                "chain_id": chain_id,
                "payload_type": payload_type
            }))
        }

        "getblockcount" => {
            let h = ctx.chain.storage.best_height()?;
            Ok(json!(h))
        }

        "getbestblockhash" => {
            let bh = ctx
                .chain
                .storage
                .best_hash()?
                .ok_or_else(|| anyhow::anyhow!("no best hash yet"))?;
            Ok(json!(TxHex::encode_blockhash(&bh)))
        }

        "getrawmempool" => {
            let ids = ctx.mempool.txids();
            let out: Vec<String> = ids.iter().map(|id| TxHex::encode_txid(id)).collect();
            Ok(json!(out))
        }

        "getblockhash" => {
            let height = params
                .get("height")
                .and_then(|v| v.as_u64())
                .ok_or_else(|| anyhow::anyhow!("missing height"))?;
            let bh = ctx
                .chain
                .storage
                .get_blockhash_by_height(height)?
                .ok_or_else(|| anyhow::anyhow!("unknown height"))?;
            Ok(json!(TxHex::encode_blockhash(&bh)))
        }

        "decoderawtransaction" => {
            let tx_hex = params.get("tx").and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing tx"))?;

            let wire = Hex::decode_with_limit(tx_hex, 512 * 1024).map_err(anyhow::Error::msg)?;
            let tx = Transaction::from_wire(&wire).map_err(anyhow::Error::msg)?;
            let best_height = ctx.chain.storage.best_height()?;

            let decoded = tx_json_decoded(&tx, &wire, false, best_height, None, None);

            Ok(json!({
                "decoded": decoded,
                "hex": Hex::encode(&wire)
            }))
        }

        "getblockheader" => {
            let bh = params.get("blockhash").and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing blockhash"))?;
            let bh = TxHex::decode_blockhash(bh).map_err(anyhow::Error::msg)?;

            let hw = ctx.chain.storage.get_header_wire(&bh)?
                .ok_or_else(|| anyhow::anyhow!("unknown header"))?;
            let header = acp_crypto::BlockHeader::from_wire(&hw).map_err(anyhow::Error::msg)?;

            let height = header.height;

            let nextblockhash = ctx.chain.storage
                .get_blockhash_by_height(height + 1)?
                .map(|h| TxHex::encode_blockhash(&h));

            let mediantime = ctx.chain.storage.get_median_time_past(height)?;

            let best_h = ctx.chain.storage.best_height()?;
            let confirmations = if best_h >= height { best_h - height + 1 } else { 0 };

            let difficulty = acp_crypto::difficulty_from_bits(
                header.bits,
                crate::config::GENESIS_BITS,
            )
            .unwrap_or(1.0);

            Ok(json!({
                "hash": TxHex::encode_blockhash(&bh),
                "version": header.version,
                "chain_id": header.chain_id,
                "height": height,
                "confirmations": confirmations,
                "difficulty": difficulty,

                "time": header.time,
                "mediantime": mediantime,
                "bits": header.bits,
                "nonce": header.nonce,

                "prev_blockhash": TxHex::encode_blockhash(&header.prev_blockhash),
                "merkle_root": Hex::encode(&header.merkle_root),
                "nextblockhash": nextblockhash
            }))
        }

        "getblock" => {
            let bh = params
                .get("blockhash")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing blockhash"))?;
            let bh = TxHex::decode_blockhash(bh).map_err(anyhow::Error::msg)?;

            let verbose_val = params
                .get("verbose")
                .cloned()
                .unwrap_or(serde_json::Value::Bool(true));

            let bw = ctx
                .chain
                .storage
                .get_block_wire(&bh)?
                .ok_or_else(|| anyhow::anyhow!("unknown block"))?;

            if verbose_val == serde_json::Value::Bool(false) {
                return Ok(json!(Hex::encode(&bw)));
            }

            let block = Block::from_wire(&bw).map_err(anyhow::Error::msg)?;

            let best_h = ctx.chain.storage.best_height()?;
            let confirmations = if best_h >= block.header.height {
                best_h - block.header.height + 1
            } else {
                0
            };

            let mediantime = ctx.chain.storage.get_median_time_past(block.header.height)?;
            let nextblockhash = ctx.chain.storage
                .get_blockhash_by_height(block.header.height + 1)?
                .map(|h| TxHex::encode_blockhash(&h));

            let difficulty = acp_crypto::difficulty_from_bits(
                block.header.bits,
                crate::config::GENESIS_BITS,
            )
            .unwrap_or(1.0);

            if verbose_val == serde_json::Value::Bool(true) {
                let txids: Vec<String> = block
                    .txs
                    .iter()
                    .map(|t| TxHex::encode_txid(&t.txid().unwrap()))
                    .collect();

                return Ok(json!({
                    "blockhash": TxHex::encode_blockhash(&bh),
                    "height": block.header.height,
                    "confirmations": confirmations,
                    "time": block.header.time,
                    "mediantime": mediantime,
                    "nextblockhash": nextblockhash,
                    "difficulty": difficulty,

                    "chain_id": block.header.chain_id,
                    "prev_blockhash": TxHex::encode_blockhash(&block.header.prev_blockhash),
                    "merkle_root": Hex::encode(&block.header.merkle_root),
                    "tx": txids
                }));
            }

            let v2 = verbose_val.as_i64().unwrap_or(1);
            if v2 != 2 {
                anyhow::bail!("invalid verbose value (use false/true/2)");
            }

            let decoded_txs: Vec<serde_json::Value> = block
                .txs
                .iter()
                .map(|tx| {
                    let txid = tx.txid().unwrap();
                    let fee = tx.fee().unwrap_or(0);

                    let inputs: Vec<serde_json::Value> = tx
                        .inputs
                        .iter()
                        .map(|i| {
                            json!({
                                "prev_txid": Hex::encode(&i.prev_txid),
                                "vout": i.vout,
                                "amount": i.amount
                            })
                        })
                        .collect();

                    let outputs: Vec<serde_json::Value> = tx.outputs.iter().map(|o| {
                        let addr = o.recipient_address_bech32().ok();
                        match &o.recipient {
                            acp_crypto::Recipient::AddressV0(h20) => json!({
                                "amount": o.amount,
                                "recipient_type": "address_v0",
                                "recipient_address": addr,
                                "pubkey_hash20": Hex::encode(h20),
                            }),
                            acp_crypto::Recipient::PubkeyWire(w) => json!({
                                "amount": o.amount,
                                "recipient_type": "pubkey_wire",
                                "recipient_address": addr,
                                "recipient_pubkey": Hex::encode(w),
                            }),
                        }
                    }).collect();

                    json!({
                        "txid": TxHex::encode_txid(&txid),
                        "version": tx.version,
                        "chain_id": tx.chain_id,
                        "lock_time": tx.lock_time,
                        "fee": fee,
                        "vin": inputs,
                        "vout": outputs,
                        "sender_pubkey": Hex::encode(&tx.sender_pubkey_wire),
                        "signature": Hex::encode(&tx.signature_wire),
                    })
                })
                .collect();

            Ok(json!({
                "blockhash": TxHex::encode_blockhash(&bh),
                "height": block.header.height,
                "confirmations": confirmations,
                "time": block.header.time,
                "mediantime": mediantime,
                "nextblockhash": nextblockhash,
                "difficulty": difficulty,

                "chain_id": block.header.chain_id,
                "prev_blockhash": TxHex::encode_blockhash(&block.header.prev_blockhash),
                "merkle_root": Hex::encode(&block.header.merkle_root),
                "tx": decoded_txs
            }))
        }

        "getchaintips" => {
            let best_h = ctx.chain.storage.best_height()?;
            let best_hash = ctx.chain.storage.best_hash()?;
            let best_hash_hex = best_hash.map(|h| TxHex::encode_blockhash(&h));

            let tips = ctx.chain.storage.list_tips()?;
            let mut out = Vec::new();

            for (hh, height, status) in tips {
                let _is_active = best_hash.map(|bh| bh == hh).unwrap_or(false);
                let st = match status {
                    2 => "active",
                    3 => "invalid",
                    _ => "valid-headers",
                };
                let headers_only = status != 2;

                let branchlen = if best_h >= height {
                    (best_h - height) as u64
                } else {
                    0
                };

                out.push(json!({
                    "height": height,
                    "hash": TxHex::encode_blockhash(&hh),
                    "branchlen": branchlen,
                    "status": st,
                    "headers_only": headers_only,
                    "forks_supported": true
                }));
            }

            if out.is_empty() {
                out.push(json!({
                    "height": best_h,
                    "hash": best_hash_hex,
                    "branchlen": 0,
                    "status": "active",
                    "headers_only": false,
                    "forks_supported": true
                }));
            }

            Ok(json!(out))
        }

        "submitheader" => {
            let header_hex = match params.get("header").and_then(|v| v.as_str()) {
                Some(s) => s,
                None => return Ok(json!({ "accepted": false, "reason": "missing header" })),
            };

            let hb = match Hex::decode_with_limit(header_hex, 256 * 1024) {
                Ok(b) => b,
                Err(e) => return Ok(json!({ "accepted": false, "reason": format!("bad hex: {e}") })),
            };

            let header = match acp_crypto::BlockHeader::from_wire(&hb) {
                Ok(h) => h,
                Err(e) => return Ok(json!({ "accepted": false, "reason": format!("decode failed: {e}") })),
            };

            if header.chain_id != ctx.chain.chain_id {
                return Ok(json!({ "accepted": false, "reason": "chain_id mismatch" }));
            }

            let hh = header.blockhash();

            if ctx.chain.storage.get_header_wire(&hh)?.is_some() {
                let st = ctx.chain.storage.get_header_status(&hh)?.unwrap_or(1);
                let status_str = match st {
                    2 => "active",
                    3 => "invalid",
                    _ => "valid-headers",
                };
                return Ok(json!({
                    "accepted": true,
                    "hash": TxHex::encode_blockhash(&hh),
                    "status": status_str,
                    "already_known": true
                }));
            }

            if let Some(prev_h) = ctx.chain.storage.get_header_height(&header.prev_blockhash)? {
                if header.height != prev_h + 1 {
                    return Ok(json!({
                        "accepted": false,
                        "hash": TxHex::encode_blockhash(&hh),
                        "reason": "height continuity violation"
                    }));
                }

                let mtp = ctx.chain.storage.get_median_time_past(prev_h)?.unwrap_or(0);
                if header.time < mtp {
                    return Ok(json!({
                        "accepted": false,
                        "hash": TxHex::encode_blockhash(&hh),
                        "reason": "time too old (below mediantime)"
                    }));
                }
            }

            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            if header.time > now + crate::config::MAX_FUTURE_DRIFT_SECS {
                return Ok(json!({
                    "accepted": false,
                    "hash": TxHex::encode_blockhash(&hh),
                    "reason": "time too far in future"
                }));
            }

            match ctx.chain.storage.store_header_v44(&hh, &header, &hb) {
                Ok(adopted) => {
                    let _ = ctx.chain.storage.recompute_best_header_tip_v52();
                    let prev_known = (header.prev_blockhash == [0u8; 32] && header.height == 1)
                        || ctx.chain.storage.get_header_wire(&header.prev_blockhash)?.is_some();
                    Ok(json!({
                        "accepted": true,
                        "hash": TxHex::encode_blockhash(&hh),
                        "status": "valid-headers",
                        "orphan": !prev_known,
                        "adopted": adopted
                    }))
                }
                Err(e) => Ok(json!({
                    "accepted": false,
                    "hash": TxHex::encode_blockhash(&hh),
                    "reason": e.to_string()
                })),
            }
        }

        "getheaders" => {
            let locator = params.get("locator").and_then(|v| v.as_array())
                .ok_or_else(|| anyhow::anyhow!("missing locator"))?;

            let stop = params.get("stop").and_then(|v| v.as_str())
                .and_then(|s| TxHex::decode_blockhash(s).ok());

            let max = params.get("max").and_then(|v| v.as_u64()).unwrap_or(2000).min(2000) as usize;

            let mut anchor: Option<[u8; 32]> = None;
            for h in locator {
                if let Some(s) = h.as_str() {
                    if let Ok(bh) = TxHex::decode_blockhash(s) {
                        if ctx.chain.storage.get_header_wire(&bh)?.is_some() {
                            anchor = Some(bh);
                            break;
                        }
                    }
                }
            }
            let Some(mut cur) = anchor else {
                return Ok(json!({ "headers": [], "count": 0, "reason": "no locator hash found" }));
            };

            let mut out: Vec<String> = Vec::new();
            let mut visited: std::collections::HashSet<[u8; 32]> = std::collections::HashSet::new();

            while out.len() < max {
                if let Some(stop_h) = stop {
                    if cur == stop_h {
                        break;
                    }
                }

                if !visited.insert(cur) {
                    break;
                }

                let children = ctx.chain.storage.get_children(&cur)?;
                if children.is_empty() {
                    break;
                }

                let mut best: Option<([u8; 32], u128, u64)> = None;

                for ch in children {
                    if let Some(st) = ctx.chain.storage.get_header_status(&ch)? {
                        if st == 3 {
                            continue;
                        }
                    }

                    let score = ctx.chain.storage.get_header_score(&ch)?.unwrap_or(0);
                    let height = ctx.chain.storage.get_header_height(&ch)?.unwrap_or(0);

                    match best {
                        None => best = Some((ch, score, height)),
                        Some((bh, bs, bhh)) => {
                            if score > bs
                                || (score == bs && height > bhh)
                                || (score == bs && height == bhh && ch > bh)
                            {
                                best = Some((ch, score, height));
                            }
                        }
                    }
                }

                let Some((next, _sc, _h)) = best else {
                    break;
                };

                let Some(hw) = ctx.chain.storage.get_header_wire(&next)? else {
                    break;
                };
                out.push(Hex::encode(&hw));
                cur = next;

                if let Some(stop_h) = stop {
                    if cur == stop_h {
                        break;
                    }
                }
            }

            Ok(json!({
                "headers": out,
                "count": out.len(),
                "reason": null
            }))
        }

        "getheaderstatus" => {
            let h = params
                .get("hash")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing hash"))?;
            let hh = TxHex::decode_blockhash(h).map_err(anyhow::Error::msg)?;

            let exists = ctx.chain.storage.get_header_wire(&hh)?.is_some();
            if !exists {
                return Ok(json!({
                    "found": false,
                    "hash": h
                }));
            }

            let status = ctx.chain.storage.get_header_status(&hh)?.unwrap_or(1);
            let status_str = match status {
                2 => "active",
                3 => "invalid",
                _ => "valid-headers",
            };

            let height = ctx.chain.storage.get_header_height(&hh)?.unwrap_or(0);
            let score = ctx.chain.storage.get_header_score(&hh)?.unwrap_or(0);
            let orphan = ctx.chain.storage.is_orphan(&hh)?;
            let children = ctx.chain.storage.get_children(&hh)?.len();
            let is_tip = ctx.chain.storage.is_tip(&hh)?;
            let best_tip = ctx
                .chain
                .storage
                .get_best_header_tip()?
                .map(|b| TxHex::encode_blockhash(&b));

            let baninfo = ctx
                .chain
                .storage
                .db
                .get_cf(crate::storage::schema::CF_HEADER_BANINFO, &hh)?
                .and_then(|b| crate::chain::baninfo::unpack_baninfo(b.as_slice()))
                .map(|(ts, reason)| json!({ "ts": ts, "reason": reason }));

            Ok(json!({
                "found": true,
                "hash": TxHex::encode_blockhash(&hh),
                "status": status_str,
                "height": height,
                "score": score.to_string(),
                "orphan": orphan,
                "children": children,
                "is_tip": is_tip,
                "best_header_tip": best_tip,
                "ban": baninfo,
                "pending_revalidate": ctx
                    .chain
                    .storage
                    .db
                    .get_cf(crate::storage::schema::CF_PENDING_REVALIDATE, &hh)?
                    .is_some(),
            }))
        }

        "getbanlist" => {
            let page_size = params
                .get("page_size")
                .and_then(|v| v.as_u64())
                .unwrap_or(100)
                .min(500) as usize;
            let only_active = params
                .get("only_active_bans")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            let hash_opt = params.get("hash").and_then(|v| v.as_str());
            let cursor_hex = params.get("cursor").and_then(|v| v.as_str());

            let mut hash: Option<[u8; 32]> = None;
            if let Some(hs) = hash_opt {
                let hh = TxHex::decode_blockhash(hs)?;
                hash = Some(hh);
            }

            let mut cursor: Vec<u8> = Vec::new();
            if let Some(ch) = cursor_hex {
                cursor = Hex::decode_with_limit(ch, 256)?;
                let need = if hash.is_some() { 44 } else { 12 };
                if cursor.len() != need {
                    return Ok(json!({
                        "supported": true,
                        "entries": [],
                        "reason": "bad cursor length",
                        "has_more": false
                    }));
                }
            }

            let mut out = Vec::with_capacity(page_size);
            let mut next_cursor: Option<String> = None;
            let mut has_more = false;
            let mut taken = 0usize;

            if let Some(hh) = hash {
                use crate::storage::schema::CF_BANLOG_BY_HASH;

                let upper: Vec<u8> = if cursor.is_empty() {
                    crate::chain::banlog_hash::make_hash_upper_exclusive(&hh).to_vec()
                } else {
                    cursor.clone()
                };

                let mut f = |k: &[u8], v: &[u8]| -> Result<bool> {
                    if k.len() != 44 {
                        return Ok(true);
                    }
                    if &k[0..32] != hh.as_slice() {
                        return Ok(false);
                    }
                    let ts = u64::from_le_bytes(k[32..40].try_into().unwrap());
                    let seq = u32::from_le_bytes(k[40..44].try_into().unwrap());

                    if only_active {
                        let st = ctx.chain.storage.get_header_status(&hh)?.unwrap_or(1);
                        if st != 3 {
                            return Ok(true);
                        }
                    }

                    let (rh, reason) = match crate::chain::banlog_hash::unpack_val(v) {
                        Some((r, s)) => (r, s),
                        None => (0u64, "??".to_string()),
                    };

                    taken += 1;
                    if taken <= page_size {
                        out.push(json!({
                            "ts": ts,
                            "seq": seq,
                            "hash": TxHex::encode_blockhash(&hh),
                            "reason": reason,
                            "reason_hash": format!("0x{:016x}", rh)
                        }));
                        next_cursor = Some(Hex::encode(k));
                        Ok(true)
                    } else {
                        has_more = true;
                        Ok(false)
                    }
                };

                ctx.chain.storage.db.for_each_cf_rev_lt(
                    CF_BANLOG_BY_HASH,
                    &upper,
                    &mut f,
                )?;
            } else {
                use crate::storage::schema::CF_BANLOG;

                let mut f = |k: &[u8], v: &[u8]| -> Result<bool> {
                    if k.len() != 12 {
                        return Ok(true);
                    }
                    let Some((hh, rh, reason)) = crate::chain::banlog::unpack_banlog_value(v) else {
                        return Ok(true);
                    };
                    if only_active {
                        let st = ctx.chain.storage.get_header_status(&hh)?.unwrap_or(1);
                        if st != 3 {
                            return Ok(true);
                        }
                    }
                    taken += 1;
                    if taken <= page_size {
                        let ts = u64::from_le_bytes(k[0..8].try_into().unwrap());
                        let seq = u32::from_le_bytes(k[8..12].try_into().unwrap());
                        out.push(json!({
                            "ts": ts,
                            "seq": seq,
                            "hash": TxHex::encode_blockhash(&hh),
                            "reason": reason,
                            "reason_hash": format!("0x{:016x}", rh)
                        }));
                        next_cursor = Some(Hex::encode(k));
                        Ok(true)
                    } else {
                        has_more = true;
                        Ok(false)
                    }
                };

                ctx.chain.storage.db.for_each_cf_rev_lt(CF_BANLOG, &cursor, &mut f)?;
            }

            Ok(json!({
                "supported": true,
                "page_size": page_size,
                "count": out.len(),
                "entries": out,
                "next_cursor": next_cursor,
                "has_more": has_more
            }))
        }

        "getactivebans" => {
            let page_size = params
                .get("page_size")
                .and_then(|v| v.as_u64())
                .unwrap_or(100)
                .min(1000) as usize;
            let cursor_hex = params.get("cursor").and_then(|v| v.as_str());

            let mut cursor: Vec<u8> = Vec::new();
            if let Some(ch) = cursor_hex {
                cursor = Hex::decode_with_limit(ch, 64)?;
                if cursor.len() != 12 {
                    return Ok(json!({
                        "supported": true,
                        "entries": [],
                        "reason": "bad cursor length",
                        "has_more": false
                    }));
                }
            }

            let mut out = Vec::with_capacity(page_size);
            let mut next_cursor: Option<String> = None;
            let mut has_more = false;
            let mut taken = 0usize;

            let mut f = |k: &[u8], v: &[u8]| -> Result<bool> {
                if k.len() != 12 || v.len() != 32 {
                    return Ok(true);
                }
                let mut hh = [0u8; 32];
                hh.copy_from_slice(v);

                let st = ctx.chain.storage.get_header_status(&hh)?.unwrap_or(1);
                if st != 3 {
                    return Ok(true);
                }
                taken += 1;
                if taken <= page_size {
                    let height = ctx.chain.storage.get_header_height(&hh)?.unwrap_or(0);
                    let score = ctx.chain.storage.get_header_score(&hh)?.unwrap_or(0);
                    let pending = ctx.chain.storage.db
                        .get_cf(crate::storage::schema::CF_PENDING_REVALIDATE, &hh)?
                        .is_some();
                    let baninfo = ctx.chain.storage.db
                        .get_cf(crate::storage::schema::CF_HEADER_BANINFO, &hh)?
                        .and_then(|b| crate::chain::baninfo::unpack_baninfo(b.as_slice()))
                        .map(|(ts, reason)| json!({ "ts": ts, "reason": reason }));

                    out.push(json!({
                        "hash": TxHex::encode_blockhash(&hh),
                        "height": height,
                        "score": score.to_string(),
                        "ban": baninfo,
                        "pending_revalidate": pending
                    }));
                    next_cursor = Some(Hex::encode(k));
                    Ok(true)
                } else {
                    has_more = true;
                    Ok(false)
                }
            };

            ctx.chain.storage.db.for_each_cf_rev_lt(
                crate::storage::schema::CF_ACTIVE_BANS_BY_TS,
                &cursor,
                &mut f,
            )?;

            Ok(json!({
                "supported": true,
                "page_size": page_size,
                "count": out.len(),
                "entries": out,
                "next_cursor": next_cursor,
                "has_more": has_more
            }))
        }

        "getbanhistory" => {
            let hs = params
                .get("hash")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing hash"))?;
            let hh = TxHex::decode_blockhash(hs)?;

            let st = ctx.chain.storage.get_header_status(&hh)?.unwrap_or(1);
            let active = st == 3;
            let pending_revalidate = ctx.chain.storage.db
                .get_cf(crate::storage::schema::CF_PENDING_REVALIDATE, &hh)?
                .is_some();

            let page_size = params
                .get("page_size")
                .and_then(|v| v.as_u64())
                .unwrap_or(100)
                .min(500) as usize;
            let cursor_hex = params.get("cursor").and_then(|v| v.as_str());

            use crate::storage::schema::CF_BANLOG_BY_HASH;

            let upper: Vec<u8> = if let Some(ch) = cursor_hex {
                let decoded = Hex::decode_with_limit(ch, 256)?;
                if decoded.len() != 44 {
                    return Ok(json!({
                        "supported": true,
                        "entries": [],
                        "reason": "bad cursor length (expected 44 bytes key)",
                        "has_more": false
                    }));
                }
                if &decoded[0..32] != hh.as_slice() {
                    return Ok(json!({
                        "supported": true,
                        "entries": [],
                        "reason": "cursor hash prefix mismatch",
                        "has_more": false
                    }));
                }
                decoded
            } else {
                crate::chain::banlog_hash::make_hash_upper_exclusive(&hh).to_vec()
            };

            let mut out = Vec::with_capacity(page_size);
            let mut next_cursor: Option<String> = None;
            let mut has_more = false;
            let mut taken = 0usize;

            let mut f = |k: &[u8], v: &[u8]| -> Result<bool> {
                if k.len() != 44 {
                    return Ok(true);
                }
                if &k[0..32] != hh.as_slice() {
                    return Ok(false);
                }
                let ts = u64::from_le_bytes(k[32..40].try_into().unwrap());
                let seq = u32::from_le_bytes(k[40..44].try_into().unwrap());
                let (rh, reason) = match crate::chain::banlog_hash::unpack_val(v) {
                    Some((r, s)) => (r, s),
                    None => (0u64, "??".to_string()),
                };

                taken += 1;
                if taken <= page_size {
                    out.push(json!({
                        "ts": ts,
                        "seq": seq,
                        "hash": TxHex::encode_blockhash(&hh),
                        "reason": reason,
                        "reason_hash": format!("0x{:016x}", rh)
                    }));
                    next_cursor = Some(Hex::encode(k));
                    Ok(true)
                } else {
                    has_more = true;
                    Ok(false)
                }
            };

            ctx.chain.storage.db.for_each_cf_rev_lt(
                CF_BANLOG_BY_HASH,
                &upper,
                &mut f,
            )?;

            Ok(json!({
                "supported": true,
                "hash": TxHex::encode_blockhash(&hh),
                "active": active,
                "pending_revalidate": pending_revalidate,
                "page_size": page_size,
                "count": out.len(),
                "entries": out,
                "next_cursor": next_cursor,
                "has_more": has_more
            }))
        }

        "clearbanhistory" => {
            let hs = params
                .get("hash")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing hash"))?;
            let hh = TxHex::decode_blockhash(hs)?;

            let dry_run = params
                .get("dry_run")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            let max_delete = params
                .get("max_delete")
                .and_then(|v| v.as_u64())
                .unwrap_or(50_000)
                .min(2_000_000) as usize;
            let rebuild_after = params
                .get("rebuild_after")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);

            use crate::storage::schema::CF_BANLOG_BY_HASH;

            let ub = crate::chain::banlog_hash::make_hash_upper_exclusive(&hh);
            let mut upper = ub.to_vec();
            let mut total_deleted = 0usize;
            let mut truncated = false;

            loop {
                let mut keys: Vec<Vec<u8>> = Vec::new();
                let mut f = |k: &[u8], _v: &[u8]| -> Result<bool> {
                    if k.len() != 44 {
                        return Ok(true);
                    }
                    if &k[0..32] != hh.as_slice() {
                        return Ok(false);
                    }
                    if total_deleted >= max_delete {
                        truncated = true;
                        return Ok(false);
                    }
                    keys.push(k.to_vec());
                    total_deleted += 1;
                    Ok(keys.len() < 20_000)
                };

                ctx.chain.storage.db.for_each_cf_rev_lt(
                    CF_BANLOG_BY_HASH,
                    &upper,
                    &mut f,
                )?;

                if keys.is_empty() {
                    break;
                }

                upper = keys.last().unwrap().clone();

                if !dry_run {
                    let dbref = ctx.chain.storage.db.db();
                    let mut batch = rocksdb::WriteBatch::default();
                    for k in &keys {
                        crate::storage::rocks::Rocks::batch_del_cf(
                            &mut batch, dbref, CF_BANLOG_BY_HASH, k,
                        )?;
                    }
                    ctx.chain.storage.db.write_batch(batch)?;
                }

                if keys.len() < 20_000 {
                    break;
                }
            }

            if rebuild_after && !dry_run {
                use crate::storage::schema::CF_BANLOG;

                let mut rebuilt = 0usize;
                let mut skipped_bad = 0usize;

                let mut f = |k: &[u8], v: &[u8]| -> Result<bool> {
                    if k.len() != 12 {
                        skipped_bad += 1;
                        return Ok(true);
                    }
                    let ts = u64::from_le_bytes(k[0..8].try_into().unwrap());
                    let seq = u32::from_le_bytes(k[8..12].try_into().unwrap());

                    let Some((xh, _rh, reason)) = crate::chain::banlog::unpack_banlog_value(v) else {
                        skipped_bad += 1;
                        return Ok(true);
                    };
                    if xh != hh {
                        return Ok(true);
                    }

                    let dbref = ctx.chain.storage.db.db();
                    let mut batch = rocksdb::WriteBatch::default();
                    let key2 = crate::chain::banlog_hash::make_key(&hh, ts, seq);
                    let val2 = crate::chain::banlog_hash::pack_val(&reason);
                    crate::storage::rocks::Rocks::batch_put_cf(
                        &mut batch, dbref, CF_BANLOG_BY_HASH, &key2, &val2,
                    )?;
                    ctx.chain.storage.db.write_batch(batch)?;

                    rebuilt += 1;
                    Ok(true)
                };

                ctx.chain.storage.db.for_each_cf(CF_BANLOG, &mut f)?;

                return Ok(json!({
                    "accepted": true,
                    "dry_run": dry_run,
                    "hash": TxHex::encode_blockhash(&hh),
                    "deleted": total_deleted,
                    "truncated": truncated,
                    "rebuild_after": true,
                    "rebuilt": rebuilt,
                    "skipped_bad": skipped_bad
                }));
            }

            Ok(json!({
                "accepted": true,
                "dry_run": dry_run,
                "hash": TxHex::encode_blockhash(&hh),
                "deleted": total_deleted,
                "truncated": truncated
            }))
        }

        "reindex_active_bans" => {
            let dry_run = params
                .get("dry_run")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);

            use crate::storage::schema::{
                CF_ACTIVE_BANS_BY_TS, CF_HEADER_ACTIVE_BANKEY, CF_HEADER_BANINFO,
            };

            if !dry_run {
                for cf in [CF_ACTIVE_BANS_BY_TS, CF_HEADER_ACTIVE_BANKEY] {
                    loop {
                        let mut to_delete: Vec<Vec<u8>> = Vec::new();
                        let mut f = |k: &[u8], _v: &[u8]| -> Result<bool> {
                            to_delete.push(k.to_vec());
                            Ok(to_delete.len() < 20_000)
                        };
                        ctx.chain.storage.db.for_each_cf(cf, &mut f)?;
                        if to_delete.is_empty() {
                            break;
                        }
                        let dbref = ctx.chain.storage.db.db();
                        let mut batch = rocksdb::WriteBatch::default();
                        for k in &to_delete {
                            crate::storage::rocks::Rocks::batch_del_cf(
                                &mut batch, dbref, cf, k,
                            )?;
                        }
                        ctx.chain.storage.db.write_batch(batch)?;
                    }
                }
            }

            let mut rebuilt = 0usize;
            let mut skipped_not_invalid = 0usize;
            let mut skipped_bad = 0usize;
            let mut seq: u32 = 0;

            let mut f = |k: &[u8], v: &[u8]| -> Result<bool> {
                if k.len() != 32 {
                    skipped_bad += 1;
                    return Ok(true);
                }
                let mut hh = [0u8; 32];
                hh.copy_from_slice(k);

                let st = ctx.chain.storage.get_header_status(&hh)?.unwrap_or(1);
                if st != 3 {
                    skipped_not_invalid += 1;
                    return Ok(true);
                }

                let Some((ts, _reason)) = crate::chain::baninfo::unpack_baninfo(v) else {
                    skipped_bad += 1;
                    return Ok(true);
                };

                let mut bankey = [0u8; 12];
                bankey[0..8].copy_from_slice(&ts.to_le_bytes());
                bankey[8..12].copy_from_slice(&seq.to_le_bytes());
                seq = seq.wrapping_add(1);

                if !dry_run {
                    let dbref = ctx.chain.storage.db.db();
                    let mut batch = rocksdb::WriteBatch::default();
                    crate::storage::rocks::Rocks::batch_put_cf(
                        &mut batch, dbref, CF_ACTIVE_BANS_BY_TS, &bankey, &hh,
                    )?;
                    crate::storage::rocks::Rocks::batch_put_cf(
                        &mut batch, dbref, CF_HEADER_ACTIVE_BANKEY, &hh, &bankey,
                    )?;
                    ctx.chain.storage.db.write_batch(batch)?;
                }

                rebuilt += 1;
                Ok(true)
            };

            ctx.chain.storage.db.for_each_cf(CF_HEADER_BANINFO, &mut f)?;

            Ok(json!({
                "accepted": true,
                "dry_run": dry_run,
                "rebuilt": rebuilt,
                "skipped_not_invalid": skipped_not_invalid,
                "skipped_bad": skipped_bad
            }))
        }

        "reindex_banlog_by_hash" => {
            let dry_run = params
                .get("dry_run")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            let hash_opt = params.get("hash").and_then(|v| v.as_str());

            use crate::storage::schema::{CF_BANLOG, CF_BANLOG_BY_HASH};

            let only_hash: Option<[u8; 32]> = if let Some(hs) = hash_opt {
                Some(TxHex::decode_blockhash(hs)?)
            } else {
                None
            };

            let mut deleted_old = 0usize;
            let mut truncated = false;

            if !dry_run {
                if let Some(hh) = only_hash {
                    let ub = crate::chain::banlog_hash::make_hash_upper_exclusive(&hh);
                    let mut upper = ub.to_vec();

                    loop {
                        let mut keys: Vec<Vec<u8>> = Vec::new();
                        let mut f = |k: &[u8], _v: &[u8]| -> Result<bool> {
                            if k.len() != 44 {
                                return Ok(true);
                            }
                            if &k[0..32] != hh.as_slice() {
                                return Ok(false);
                            }
                            keys.push(k.to_vec());
                            Ok(keys.len() < 20_000)
                        };

                        ctx.chain.storage.db.for_each_cf_rev_lt(
                            CF_BANLOG_BY_HASH,
                            &upper,
                            &mut f,
                        )?;
                        if keys.is_empty() {
                            break;
                        }

                        upper = keys.last().unwrap().clone();

                        let dbref = ctx.chain.storage.db.db();
                        let mut batch = rocksdb::WriteBatch::default();
                        for k in &keys {
                            crate::storage::rocks::Rocks::batch_del_cf(
                                &mut batch, dbref, CF_BANLOG_BY_HASH, k,
                            )?;
                        }
                        ctx.chain.storage.db.write_batch(batch)?;

                        deleted_old += keys.len();
                        if keys.len() < 20_000 {
                            break;
                        }
                        if deleted_old > 2_000_000 {
                            truncated = true;
                            break;
                        }
                    }
                } else {
                    loop {
                        let mut to_delete: Vec<Vec<u8>> = Vec::new();
                        let mut f_del = |k: &[u8], _v: &[u8]| -> Result<bool> {
                            to_delete.push(k.to_vec());
                            Ok(to_delete.len() < 20_000)
                        };
                        ctx.chain.storage.db.for_each_cf(CF_BANLOG_BY_HASH, &mut f_del)?;
                        if to_delete.is_empty() {
                            break;
                        }
                        let dbref = ctx.chain.storage.db.db();
                        let mut batch = rocksdb::WriteBatch::default();
                        for k in &to_delete {
                            crate::storage::rocks::Rocks::batch_del_cf(
                                &mut batch, dbref, CF_BANLOG_BY_HASH, k,
                            )?;
                        }
                        ctx.chain.storage.db.write_batch(batch)?;
                        deleted_old += to_delete.len();
                    }
                }
            }

            let mut rebuilt = 0usize;
            let mut skipped_bad = 0usize;

            let mut f = |k: &[u8], v: &[u8]| -> Result<bool> {
                if k.len() != 12 {
                    skipped_bad += 1;
                    return Ok(true);
                }
                let ts = u64::from_le_bytes(k[0..8].try_into().unwrap());
                let seq = u32::from_le_bytes(k[8..12].try_into().unwrap());

                let Some((hh, _rh, reason)) = crate::chain::banlog::unpack_banlog_value(v) else {
                    skipped_bad += 1;
                    return Ok(true);
                };

                if let Some(target) = only_hash {
                    if hh != target {
                        return Ok(true);
                    }
                }

                if !dry_run {
                    let dbref = ctx.chain.storage.db.db();
                    let mut batch = rocksdb::WriteBatch::default();
                    let key2 = crate::chain::banlog_hash::make_key(&hh, ts, seq);
                    let val2 = crate::chain::banlog_hash::pack_val(&reason);
                    crate::storage::rocks::Rocks::batch_put_cf(
                        &mut batch, dbref, CF_BANLOG_BY_HASH, &key2, &val2,
                    )?;
                    ctx.chain.storage.db.write_batch(batch)?;
                }

                rebuilt += 1;
                Ok(true)
            };

            ctx.chain.storage.db.for_each_cf(CF_BANLOG, &mut f)?;

            Ok(json!({
                "accepted": true,
                "dry_run": dry_run,
                "hash": only_hash.map(|h| TxHex::encode_blockhash(&h)),
                "deleted_old": deleted_old,
                "truncated": truncated,
                "rebuilt": rebuilt,
                "skipped_bad": skipped_bad
            }))
        }

        "compact_banlog" => {
            let dry_run = params
                .get("dry_run")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            let max_delete = params
                .get("max_delete")
                .and_then(|v| v.as_u64())
                .unwrap_or(100_000)
                .min(2_000_000) as usize;
            let batch_size = params
                .get("batch_size")
                .and_then(|v| v.as_u64())
                .unwrap_or(10_000)
                .min(50_000) as usize;

            let hash_opt = params.get("hash").and_then(|v| v.as_str());
            let only_hash: Option<[u8; 32]> = if let Some(hs) = hash_opt {
                Some(TxHex::decode_blockhash(hs)?)
            } else {
                None
            };

            let sample_size = params
                .get("sample_size")
                .and_then(|v| v.as_u64())
                .unwrap_or(20)
                .min(200) as usize;
            let mut sample: Vec<serde_json::Value> = Vec::with_capacity(sample_size);

            use crate::storage::schema::{CF_BANLOG, CF_BANLOG_BY_HASH};
            use std::collections::HashMap;

            let mut scanned = 0usize;
            let mut deleted = 0usize;
            let mut truncated = false;
            let mut last_reason: HashMap<[u8; 32], u64> = HashMap::new();
            let mut del_primary: Vec<Vec<u8>> = Vec::new();
            let mut del_secondary: Vec<Vec<u8>> = Vec::new();

            let flush = |del_primary: &mut Vec<Vec<u8>>,
                            del_secondary: &mut Vec<Vec<u8>>|
             -> Result<()> {
                if dry_run {
                    del_primary.clear();
                    del_secondary.clear();
                    return Ok(());
                }
                if del_primary.is_empty() && del_secondary.is_empty() {
                    return Ok(());
                }
                let dbref = ctx.chain.storage.db.db();
                let mut batch = rocksdb::WriteBatch::default();
                for k in del_primary.iter() {
                    crate::storage::rocks::Rocks::batch_del_cf(
                        &mut batch, dbref, CF_BANLOG, k,
                    )?;
                }
                for k in del_secondary.iter() {
                    crate::storage::rocks::Rocks::batch_del_cf(
                        &mut batch, dbref, CF_BANLOG_BY_HASH, k,
                    )?;
                }
                ctx.chain.storage.db.write_batch(batch)?;
                del_primary.clear();
                del_secondary.clear();
                Ok(())
            };

            let mut f = |k: &[u8], v: &[u8]| -> Result<bool> {
                if k.len() != 12 {
                    return Ok(true);
                }
                scanned += 1;

                let ts = u64::from_le_bytes(k[0..8].try_into().unwrap());
                let seq = u32::from_le_bytes(k[8..12].try_into().unwrap());

                let Some((hh, rh, _reason)) = crate::chain::banlog::unpack_banlog_value(v)
                else {
                    return Ok(true);
                };

                if let Some(target) = only_hash {
                    if hh != target {
                        return Ok(true);
                    }
                }

                let prev = last_reason.get(&hh).copied();
                if let Some(prev_rh) = prev {
                    if prev_rh == rh {
                        if deleted >= max_delete {
                            truncated = true;
                            return Ok(false);
                        }
                        let k2 = crate::chain::banlog_hash::make_key(&hh, ts, seq);
                        if sample.len() < sample_size {
                            sample.push(json!({
                                "ts": ts,
                                "seq": seq,
                                "hash": TxHex::encode_blockhash(&hh),
                                "reason_hash": format!("0x{:016x}", rh),
                                "banlog_key": Hex::encode(k),
                                "by_hash_key": Hex::encode(&k2)
                            }));
                        }
                        del_primary.push(k.to_vec());
                        del_secondary.push(k2.to_vec());
                        deleted += 1;

                        if del_primary.len() >= batch_size {
                            flush(&mut del_primary, &mut del_secondary)?;
                        }
                    } else {
                        last_reason.insert(hh, rh);
                    }
                } else {
                    last_reason.insert(hh, rh);
                }

                Ok(true)
            };

            ctx.chain.storage.db.for_each_cf(CF_BANLOG, &mut f)?;
            flush(&mut del_primary, &mut del_secondary)?;

            Ok(json!({
                "accepted": true,
                "dry_run": dry_run,
                "hash": only_hash.map(|h| TxHex::encode_blockhash(&h)),
                "scanned": scanned,
                "deleted": deleted,
                "truncated": truncated,
                "sample_deleted": sample
            }))
        }

        "banlog_stats" => {
            use crate::storage::schema::CF_BANLOG;
            use std::collections::{HashMap, HashSet};

            let hash_opt = params.get("hash").and_then(|v| v.as_str());
            let only_hash: Option<[u8; 32]> = if let Some(hs) = hash_opt {
                Some(TxHex::decode_blockhash(hs)?)
            } else {
                None
            };

            // v0.62: reason_hash / reason_hashes filter
            let rh_single = params.get("reason_hash").and_then(|v| v.as_str());
            let rh_list = params.get("reason_hashes").and_then(|v| v.as_array());
            let mut reason_set: HashSet<u64> = HashSet::new();
            if let Some(s) = rh_single {
                reason_set.insert(TxHex::decode_u64_hex(s).map_err(anyhow::Error::msg)?);
            }
            if let Some(arr) = rh_list {
                for it in arr {
                    if let Some(s) = it.as_str() {
                        reason_set.insert(TxHex::decode_u64_hex(s).map_err(anyhow::Error::msg)?);
                    }
                }
            }
            let reason_filter_enabled = !reason_set.is_empty();

            let top = params
                .get("top")
                .and_then(|v| v.as_u64())
                .unwrap_or(10)
                .min(50) as usize;
            let max_scan = params
                .get("max_scan")
                .and_then(|v| v.as_u64())
                .unwrap_or(500_000)
                .min(5_000_000) as usize;
            let include_examples = params
                .get("include_examples")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);

            // v0.60: window_days, rate_per_day
            let window_days_opt = params.get("window_days").and_then(|v| v.as_u64());
            let include_rate = params
                .get("include_rate_per_day")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            let rate_days_top = params
                .get("rate_days_top")
                .and_then(|v| v.as_u64())
                .unwrap_or(14)
                .min(365) as usize;

            // v0.61: rate_timeseries
            let include_ts = params
                .get("include_rate_timeseries")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            let mut rate_timeseries_days = params
                .get("rate_timeseries_days")
                .and_then(|v| v.as_u64())
                .unwrap_or_else(|| window_days_opt.unwrap_or(30));
            rate_timeseries_days = rate_timeseries_days.min(365).max(1);

            let now_ts: u64 = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            let ts_min: u64 = if let Some(d) = window_days_opt {
                now_ts.saturating_sub(d.saturating_mul(86_400))
            } else {
                0
            };

            let mut scanned = 0usize;
            let mut total = 0usize;
            let mut ts_max_seen: u64 = 0;

            let mut counts: HashMap<u64, (u64, String)> = HashMap::new();
            let mut day_counts: HashMap<u64, u64> = HashMap::new();
            let mut day_counts_reason: HashMap<u64, u64> = HashMap::new();
            let mut total_reason = 0usize;

            let cursor: Vec<u8> = Vec::new();

            let mut f = |k: &[u8], v: &[u8]| -> Result<bool> {
                if k.len() != 12 {
                    return Ok(true);
                }

                let ts = u64::from_le_bytes(k[0..8].try_into().unwrap());
                if window_days_opt.is_some() && ts < ts_min {
                    return Ok(false);
                }

                if scanned >= max_scan {
                    return Ok(false);
                }
                scanned += 1;

                let Some((hh, rh, reason)) = crate::chain::banlog::unpack_banlog_value(v) else {
                    return Ok(true);
                };

                if let Some(target) = only_hash {
                    if hh != target {
                        return Ok(true);
                    }
                }

                if ts > ts_max_seen {
                    ts_max_seen = ts;
                }
                total += 1;

                let entry = counts.entry(rh).or_insert((0, String::new()));
                entry.0 += 1;
                if include_examples && entry.1.is_empty() {
                    entry.1 = reason;
                }

                if include_rate {
                    let day_start = (ts / 86_400) * 86_400;
                    *day_counts.entry(day_start).or_insert(0) += 1;
                }
                if include_rate && reason_filter_enabled && reason_set.contains(&rh) {
                    let day_start = (ts / 86_400) * 86_400;
                    *day_counts_reason.entry(day_start).or_insert(0) += 1;
                    total_reason += 1;
                }

                Ok(true)
            };

            ctx.chain.storage.db
                .for_each_cf_rev_lt(CF_BANLOG, &cursor, &mut f)?;

            let unique_total = counts.len();

            let mut items: Vec<(u64, u64, String)> = counts
                .into_iter()
                .map(|(rh, (c, ex))| (rh, c, ex))
                .collect();
            items.sort_by(|a, b| b.1.cmp(&a.1));
            items.truncate(top);

            let top_reasons: Vec<serde_json::Value> = items
                .into_iter()
                .map(|(rh, c, ex)| {
                    let mut o = json!({
                        "reason_hash": format!("0x{:016x}", rh),
                        "count": c
                    });
                    if include_examples {
                        o["example_reason"] = json!(ex);
                    }
                    o
                })
                .collect();

            let rate_per_day = if include_rate {
                let window_days_effective = if let Some(d) = window_days_opt {
                    d.max(1)
                } else if day_counts.is_empty() {
                    1
                } else {
                    let min_day = *day_counts.keys().min().unwrap();
                    let max_day = *day_counts.keys().max().unwrap();
                    let span_days = ((max_day - min_day) / 86_400) + 1;
                    span_days.max(1)
                };

                let entries_per_day = (total as f64) / (window_days_effective as f64);

                // v0.61: rate_timeseries (build before consuming day_counts)
                let timeseries = if include_ts {
                    let today_start = (now_ts / 86_400) * 86_400;
                    let start_day =
                        today_start.saturating_sub((rate_timeseries_days - 1) * 86_400);

                    let mut ts_out = Vec::with_capacity(rate_timeseries_days as usize);
                    let mut d = start_day;
                    while d <= today_start {
                        let c = *day_counts.get(&d).unwrap_or(&0);
                        let day_index = (d / 86_400) as i64;
                        ts_out.push(json!({
                            "day_iso": crate::util::date::day_iso_from_day_index(day_index),
                            "ts_day_start": d,
                            "count": c
                        }));
                        d = d.saturating_add(86_400);
                        if d == 0 {
                            break;
                        }
                    }
                    Some(ts_out)
                } else {
                    None
                };

                // v0.62: rate_timeseries_reason_hash (only selected reason_hashes)
                let timeseries_reason = if include_ts && reason_filter_enabled {
                    let today_start = (now_ts / 86_400) * 86_400;
                    let start_day =
                        today_start.saturating_sub((rate_timeseries_days - 1) * 86_400);

                    let mut ts_out = Vec::with_capacity(rate_timeseries_days as usize);
                    let mut d = start_day;
                    while d <= today_start {
                        let c = *day_counts_reason.get(&d).unwrap_or(&0);
                        let day_index = (d / 86_400) as i64;
                        ts_out.push(json!({
                            "day_iso": crate::util::date::day_iso_from_day_index(day_index),
                            "ts_day_start": d,
                            "count": c
                        }));
                        d = d.saturating_add(86_400);
                        if d == 0 {
                            break;
                        }
                    }
                    Some(ts_out)
                } else {
                    None
                };

                let mut days: Vec<(u64, u64)> = day_counts.into_iter().collect();
                days.sort_by(|a, b| b.1.cmp(&a.1));
                days.truncate(rate_days_top);

                let days_json: Vec<serde_json::Value> = days
                    .into_iter()
                    .map(|(day_start, c)| {
                        let day_index = (day_start / 86_400) as i64;
                        json!({
                            "day": format!("{}", day_index),
                            "day_iso": crate::util::date::day_iso_from_day_index(day_index),
                            "ts_day_start": day_start,
                            "count": c
                        })
                    })
                    .collect();

                let mut rate_obj = json!({
                    "window_days": window_days_effective,
                    "total_entries": total,
                    "entries_per_day": entries_per_day,
                    "top_days": days_json,
                    "rate_timeseries_days": rate_timeseries_days,
                    "rate_timeseries": timeseries,
                    "rate_timeseries_reason_hash": timeseries_reason
                });
                if reason_filter_enabled {
                    rate_obj["reason_filter"] = json!({
                        "reason_hashes": reason_set
                            .iter()
                            .map(|rh| format!("0x{:016x}", rh))
                            .collect::<Vec<_>>(),
                        "total_entries": total_reason
                    });
                }
                Some(rate_obj)
            } else {
                None
            };

            let mut resp = json!({
                "accepted": true,
                "hash": only_hash.map(|h| TxHex::encode_blockhash(&h)),
                "scanned": scanned,
                "total_entries": total,
                "unique_reason_hashes_total": unique_total,
                "unique_reason_hashes_in_top": top_reasons.len(),
                "top": top,
                "top_reasons": top_reasons,
                "window": {
                    "enabled": window_days_opt.is_some(),
                    "window_days": window_days_opt,
                    "ts_min": if window_days_opt.is_some() {
                        Some(ts_min)
                    } else {
                        None
                    },
                    "ts_max_seen": if ts_max_seen > 0 {
                        Some(ts_max_seen)
                    } else {
                        None
                    }
                }
            });

            if only_hash.is_some() {
                resp["by_hash"] = resp["hash"].clone();
            }
            if let Some(r) = rate_per_day {
                resp["rate_per_day"] = r;
            }

            Ok(resp)
        }

        "banlog_export_csv" => {
            use base64::Engine;
            use crate::storage::schema::CF_BANLOG;
            use std::collections::HashSet;

            let window_days = params
                .get("window_days")
                .and_then(|v| v.as_u64())
                .ok_or_else(|| anyhow::anyhow!("missing window_days"))?
                .min(365);

            let max_rows = params
                .get("max_rows")
                .and_then(|v| v.as_u64())
                .unwrap_or(200_000)
                .min(5_000_000) as usize;

            let hash_opt = params.get("hash").and_then(|v| v.as_str());
            let only_hash: Option<[u8; 32]> = if let Some(hs) = hash_opt {
                Some(TxHex::decode_blockhash(hs)?)
            } else {
                None
            };

            let rh_single = params.get("reason_hash").and_then(|v| v.as_str());
            let rh_list = params.get("reason_hashes").and_then(|v| v.as_array());
            let mut reason_set: HashSet<u64> = HashSet::new();
            if let Some(s) = rh_single {
                reason_set.insert(TxHex::decode_u64_hex(s).map_err(anyhow::Error::msg)?);
            }
            if let Some(arr) = rh_list {
                for it in arr {
                    if let Some(s) = it.as_str() {
                        reason_set.insert(TxHex::decode_u64_hex(s).map_err(anyhow::Error::msg)?);
                    }
                }
            }
            let reason_filter_enabled = !reason_set.is_empty();

            let now_ts: u64 = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            let ts_min: u64 = now_ts.saturating_sub(window_days.saturating_mul(86_400));

            let mut rows = 0usize;
            let mut truncated = false;

            let mut csv = String::with_capacity(1024 * 1024);
            csv.push_str("ts,seq,day_iso,headerhash,reason_hash,reason\n");

            let cursor: Vec<u8> = Vec::new();

            let mut f = |k: &[u8], v: &[u8]| -> Result<bool> {
                if k.len() != 12 {
                    return Ok(true);
                }

                let ts = u64::from_le_bytes(k[0..8].try_into().unwrap());
                if ts < ts_min {
                    return Ok(false);
                }

                if rows >= max_rows {
                    truncated = true;
                    return Ok(false);
                }

                let seq = u32::from_le_bytes(k[8..12].try_into().unwrap());

                let Some((hh, rh, reason)) = crate::chain::banlog::unpack_banlog_value(v) else {
                    return Ok(true);
                };

                if let Some(target) = only_hash {
                    if hh != target {
                        return Ok(true);
                    }
                }
                if reason_filter_enabled && !reason_set.contains(&rh) {
                    return Ok(true);
                }

                let day_index = (ts / 86_400) as i64;
                let day_iso = crate::util::date::day_iso_from_day_index(day_index);

                let reason_csv = format!("\"{}\"", reason.replace('"', "\"\""));

                csv.push_str(&format!(
                    "{},{},{},{},{},{}\n",
                    ts,
                    seq,
                    day_iso,
                    TxHex::encode_blockhash(&hh),
                    format!("0x{:016x}", rh),
                    reason_csv
                ));

                rows += 1;

                if csv.len() > 8_000_000 {
                    truncated = true;
                    return Ok(false);
                }

                Ok(true)
            };

            ctx.chain.storage.db
                .for_each_cf_rev_lt(CF_BANLOG, &cursor, &mut f)?;

            let csv_b64 =
                base64::engine::general_purpose::STANDARD.encode(csv.as_bytes());

            Ok(json!({
                "accepted": true,
                "window_days": window_days,
                "hash": only_hash.map(|h| TxHex::encode_blockhash(&h)),
                "reason_hashes": if reason_filter_enabled {
                    Some(
                        reason_set
                            .iter()
                            .map(|rh| format!("0x{:016x}", rh))
                            .collect::<Vec<_>>(),
                    )
                } else {
                    None
                },
                "rows": rows,
                "truncated": truncated,
                "csv_base64": csv_b64
            }))
        }

        "banlog_export_csv_file" => {
            use crate::storage::schema::CF_BANLOG;
            use sha2::{Digest, Sha256};
            use std::collections::HashSet;
            use std::fs::{self, File};
            use std::io::{BufWriter, Write};
            use uuid::Uuid;

            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";

            let _lock = crate::util::export_lock::ExportLock::acquire("/var/lib/acp-node/exports/.lock")?;

            let window_days = params
                .get("window_days")
                .and_then(|v| v.as_u64())
                .ok_or_else(|| anyhow::anyhow!("missing window_days"))?
                .min(365);

            let max_rows = params
                .get("max_rows")
                .and_then(|v| v.as_u64())
                .unwrap_or(2_000_000)
                .min(20_000_000) as usize;
            let gzip = params
                .get("gzip")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            let prefix = params
                .get("filename_prefix")
                .and_then(|v| v.as_str())
                .unwrap_or("banlog");
            let heartbeat_seconds = params
                .get("heartbeat_seconds")
                .and_then(|v| v.as_u64())
                .unwrap_or(10)
                .clamp(2, 60);

            let hash_opt = params.get("hash").and_then(|v| v.as_str());
            let only_hash: Option<[u8; 32]> = if let Some(hs) = hash_opt {
                Some(TxHex::decode_blockhash(hs).map_err(anyhow::Error::msg)?)
            } else {
                None
            };

            let rh_single = params.get("reason_hash").and_then(|v| v.as_str());
            let rh_list = params.get("reason_hashes").and_then(|v| v.as_array());
            let mut reason_set: HashSet<u64> = HashSet::new();
            if let Some(s) = rh_single {
                reason_set.insert(TxHex::decode_u64_hex(s).map_err(anyhow::Error::msg)?);
            }
            if let Some(arr) = rh_list {
                for it in arr {
                    if let Some(s) = it.as_str() {
                        reason_set.insert(TxHex::decode_u64_hex(s).map_err(anyhow::Error::msg)?);
                    }
                }
            }
            let reason_filter_enabled = !reason_set.is_empty();

            let now_ts: u64 = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            let ts_min: u64 = now_ts.saturating_sub(window_days.saturating_mul(86_400));

            fs::create_dir_all(EXPORT_DIR)?;

            let export_id = Uuid::new_v4().to_string();
            let ext = if gzip { "csv.gz" } else { "csv" };
            let filename = format!("{prefix}_{export_id}_{window_days}d.{ext}");
            let final_path = format!("{EXPORT_DIR}/{filename}");
            let part_path = format!("{}.part", &final_path);
            let inprog_path = format!("{}.inprogress", &final_path);

            {
                use std::io::Write as _;
                let mut m = fs::File::create(&inprog_path)?;
                let pid = std::process::id();
                writeln!(m, "created_at_ts={}", now_ts)?;
                writeln!(m, "pid={}", pid)?;
                writeln!(m, "export_id={}", export_id)?;
                writeln!(m, "heartbeat_seconds={}", heartbeat_seconds)?;
                m.sync_all()?;
            }

            let file = File::create(&part_path)?;
            let buf = BufWriter::new(file);

            let mut writer: Box<dyn Write> = if gzip {
                use flate2::write::GzEncoder;
                use flate2::Compression;
                Box::new(GzEncoder::new(buf, Compression::default()))
            } else {
                Box::new(buf)
            };

            let mut hasher = Sha256::new();
            let mut rows = 0usize;
            let mut truncated = false;

            let mut write_all = |b: &[u8]| -> Result<()> {
                writer.write_all(b)?;
                hasher.update(b);
                Ok(())
            };

            write_all(b"ts,seq,day_iso,headerhash,reason_hash,reason\n")?;

            let cursor: Vec<u8> = Vec::new();
            let mut last_hb_ts: u64 = now_ts;

            let mut f = |k: &[u8], v: &[u8]| -> Result<bool> {
                if k.len() != 12 {
                    return Ok(true);
                }

                let ts = u64::from_le_bytes(k[0..8].try_into().unwrap());
                if ts < ts_min {
                    return Ok(false);
                }
                if rows >= max_rows {
                    truncated = true;
                    return Ok(false);
                }

                let seq = u32::from_le_bytes(k[8..12].try_into().unwrap());

                let Some((hh, rh, reason)) = crate::chain::banlog::unpack_banlog_value(v) else {
                    return Ok(true);
                };

                if let Some(target) = only_hash {
                    if hh != target {
                        return Ok(true);
                    }
                }
                if reason_filter_enabled && !reason_set.contains(&rh) {
                    return Ok(true);
                }

                let day_index = (ts / 86_400) as i64;
                let day_iso = crate::util::date::day_iso_from_day_index(day_index);

                let reason_csv = format!(
                    "\"{}\"",
                    reason.replace('"', "\"\"").replace('\n', "\\n").replace('\r', "\\r")
                );

                let line = format!(
                    "{},{},{},{},{},{}\n",
                    ts,
                    seq,
                    day_iso,
                    TxHex::encode_blockhash(&hh),
                    format!("0x{:016x}", rh),
                    reason_csv
                );
                write_all(line.as_bytes())?;

                let cur_ts: u64 = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs();
                if cur_ts.saturating_sub(last_hb_ts) >= heartbeat_seconds {
                    let _ = crate::util::inprogress::touch_inprogress(&inprog_path, cur_ts);
                    last_hb_ts = cur_ts;
                }

                rows += 1;
                Ok(true)
            };

            ctx.chain.storage.db
                .for_each_cf_rev_lt(CF_BANLOG, &cursor, &mut f)?;

            writer.flush()?;
            drop(writer);

            let result = (|| -> Result<serde_json::Value> {
                std::fs::rename(&part_path, &final_path)?;
                let _ = std::fs::remove_file(&inprog_path);

                let bytes = std::fs::metadata(&final_path)?.len();
                let sha256 = format!("{:x}", hasher.finalize());

                let created_at_ts = now_ts;
                let manifest_path = format!("{final_path}.json");
                let params_json = json!({
                    "window_days": window_days,
                    "hash": only_hash.map(|h| TxHex::encode_blockhash(&h)),
                    "reason_hashes": if reason_filter_enabled {
                        Some(
                            reason_set
                                .iter()
                                .map(|rh| format!("0x{:016x}", rh))
                                .collect::<Vec<_>>(),
                        )
                    } else {
                        None::<Vec<String>>
                    },
                    "max_rows": max_rows
                });
                let manifest = json!({
                    "version": "v0.64",
                    "export_id": export_id,
                    "created_at_ts": created_at_ts,
                    "node_version": ctx.node_version,
                    "path": final_path,
                    "filename": filename,
                    "sha256": sha256,
                    "bytes": bytes,
                    "rows": rows,
                    "truncated": truncated,
                    "gzip": gzip,
                    "params": params_json
                });
                let tmp_path = format!("{manifest_path}.tmp");
                {
                    let mut mf = File::create(&tmp_path)?;
                    mf.write_all(manifest.to_string().as_bytes())?;
                    mf.write_all(b"\n")?;
                    mf.sync_all()?;
                }
                std::fs::rename(&tmp_path, &manifest_path)?;

                Ok(json!({
                    "accepted": true,
                    "export_id": export_id,
                    "path": final_path,
                    "manifest_path": manifest_path,
                    "sha256": sha256,
                    "bytes": bytes,
                    "rows": rows,
                    "truncated": truncated,
                    "gzip": gzip
                }))
            })();
            if result.is_err() {
                let _ = std::fs::remove_file(&inprog_path);
                let _ = std::fs::remove_file(&part_path);
            }
            result
        }

        "banlog_exports_list" => {
            use std::fs;

            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";

            let _lock = crate::util::export_lock::ExportLock::acquire("/var/lib/acp-node/exports/.lock")?;

            let page_size = params
                .get("page_size")
                .or_else(|| params.get("limit"))
                .and_then(|v| v.as_u64())
                .unwrap_or(50)
                .min(200) as usize;
            let cursor_in = params
                .get("cursor")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            let sort = params
                .get("sort")
                .and_then(|v| v.as_str())
                .unwrap_or("created_at");
            let order = params
                .get("order")
                .and_then(|v| v.as_str())
                .unwrap_or("desc");
            let desc = order != "asc";

            if cursor_in.is_some() && !(sort == "created_at" && order != "asc") {
                anyhow::bail!("cursor supported only for sort=created_at&order=desc");
            }

            fn parse_cursor(s: &str) -> Option<(u64, String)> {
                let parts: Vec<&str> = s.split(":name:").collect();
                if parts.len() != 2 {
                    return None;
                }
                let left = parts[0];
                let name = parts[1].to_string();
                let ts_str = left.strip_prefix("ts:")?;
                let ts: u64 = ts_str.parse().ok()?;
                Some((ts, name))
            }
            let cursor = cursor_in.as_deref().and_then(parse_cursor);

            let f_window_days = params.get("window_days").and_then(|v| v.as_u64());
            let f_hash = params
                .get("hash")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            let f_since_day_iso = params
                .get("since_day_iso")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            let since_day_start_ts: Option<u64> = if let Some(ds) = &f_since_day_iso {
                let di = crate::util::date::parse_day_iso_to_day_index(ds)
                    .ok_or_else(|| anyhow::anyhow!("bad since_day_iso"))?;
                Some((di as u64).saturating_mul(86_400))
            } else {
                None
            };

            let f_until_day_iso = params
                .get("until_day_iso")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            let f_min_rows = params.get("min_rows").and_then(|v| v.as_u64());

            let until_exclusive_ts: Option<u64> = if let Some(ds) = &f_until_day_iso {
                let di = crate::util::date::parse_day_iso_to_day_index(ds)
                    .ok_or_else(|| anyhow::anyhow!("bad until_day_iso"))?;
                Some((di as u64).saturating_mul(86_400).saturating_add(86_400))
            } else {
                None
            };

            let mut items: Vec<serde_json::Value> = Vec::new();
            let mut errors: Vec<String> = Vec::new();

            let rd = match fs::read_dir(EXPORT_DIR) {
                Ok(r) => r,
                Err(e) => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": format!("read_dir failed: {}", e)
                    }));
                }
            };

            for e in rd.flatten() {
                let name = e.file_name().to_string_lossy().to_string();
                if !name.ends_with(".json") {
                    continue;
                }
                if name.contains("..") || name.contains('/') || name.contains('\\') {
                    errors.push(format!("skip suspicious manifest name: {}", name));
                    continue;
                }

                let manifest_path = format!("{}/{}", EXPORT_DIR, name);
                let s = match fs::read_to_string(&manifest_path) {
                    Ok(s) => s,
                    Err(e) => {
                        errors.push(format!("read {}: {}", name, e));
                        continue;
                    }
                };

                let mj: serde_json::Value = match serde_json::from_str(&s) {
                    Ok(v) => v,
                    Err(e) => {
                        errors.push(format!("parse {}: {}", name, e));
                        continue;
                    }
                };

                let created_at_ts = mj
                    .get("created_at_ts")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(0);
                let created_day_iso = if created_at_ts > 0 {
                    let day_index = (created_at_ts / 86_400) as i64;
                    Some(crate::util::date::day_iso_from_day_index(day_index))
                } else {
                    None
                };
                let filename = mj
                    .get("filename")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| name.trim_end_matches(".json").to_string());

                let export_path = format!("{}/{}", EXPORT_DIR, filename);
                let inprog_path = format!("{}.inprogress", &export_path);
                if fs::metadata(&inprog_path).is_ok() {
                    continue; // skip export in progress
                }

                let bytes = mj
                    .get("bytes")
                    .and_then(|v| v.as_u64())
                    .or_else(|| fs::metadata(&export_path).ok().map(|m| m.len()))
                    .unwrap_or(0);

                let rows = mj.get("rows").and_then(|v| v.as_u64());
                let sha256 = mj
                    .get("sha256")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());
                let gzip = mj
                    .get("gzip")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(filename.ends_with(".gz"));
                let truncated = mj
                    .get("truncated")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);

                let window_days = mj
                    .get("params")
                    .and_then(|p| p.get("window_days"))
                    .and_then(|v| v.as_u64());
                let hash = mj
                    .get("params")
                    .and_then(|p| p.get("hash"))
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                if let Some(w) = f_window_days {
                    if window_days != Some(w) {
                        continue;
                    }
                }
                if let Some(h) = &f_hash {
                    if hash.as_deref() != Some(h.as_str()) {
                        continue;
                    }
                }
                if let Some(since_ts) = since_day_start_ts {
                    if created_at_ts < since_ts {
                        continue;
                    }
                }
                if let Some(until_ts) = until_exclusive_ts {
                    if created_at_ts >= until_ts {
                        continue;
                    }
                }
                if let Some(minr) = f_min_rows {
                    let rr = rows.unwrap_or(0);
                    if rr < minr {
                        continue;
                    }
                }

                items.push(json!({
                    "created_at_ts": created_at_ts,
                    "created_day_iso": created_day_iso,
                    "filename": filename,
                    "path": export_path,
                    "manifest_path": manifest_path,
                    "bytes": bytes,
                    "rows": rows,
                    "sha256": sha256,
                    "gzip": gzip,
                    "truncated": truncated,
                    "window_days": window_days,
                    "hash": hash
                }));
            }

            items.sort_by(|a, b| {
                let key_cmp = match sort {
                    "rows" => {
                        let ra = a.get("rows").and_then(|v| v.as_u64()).unwrap_or(0);
                        let rb = b.get("rows").and_then(|v| v.as_u64()).unwrap_or(0);
                        ra.cmp(&rb)
                    }
                    "bytes" => {
                        let ba = a.get("bytes").and_then(|v| v.as_u64()).unwrap_or(0);
                        let bb = b.get("bytes").and_then(|v| v.as_u64()).unwrap_or(0);
                        ba.cmp(&bb)
                    }
                    _ => {
                        let ta = a.get("created_at_ts").and_then(|v| v.as_u64()).unwrap_or(0);
                        let tb = b.get("created_at_ts").and_then(|v| v.as_u64()).unwrap_or(0);
                        ta.cmp(&tb)
                    }
                };
                if desc {
                    key_cmp.reverse()
                } else {
                    key_cmp
                }
            });

            let mut start_idx = 0usize;
            if let Some((cts, cname)) = cursor {
                for (i, it) in items.iter().enumerate() {
                    let ts = it
                        .get("created_at_ts")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    let nm = it.get("filename").and_then(|v| v.as_str()).unwrap_or("");
                    let skip = (ts > cts) || (ts == cts && nm >= cname.as_str());
                    if !skip {
                        start_idx = i;
                        break;
                    }
                    start_idx = i + 1;
                }
            }
            let end = (start_idx + page_size).min(items.len());
            let page: Vec<serde_json::Value> = items[start_idx..end].to_vec();
            let has_more = end < items.len();
            let next_cursor = if sort == "created_at" && order == "desc"
                && has_more
                && !page.is_empty()
            {
                let last = page.last().unwrap();
                let ts = last
                    .get("created_at_ts")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(0);
                let nm = last
                    .get("filename")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                Some(format!("ts:{}:name:{}", ts, nm))
            } else {
                None
            };

            Ok(json!({
                "accepted": true,
                "count": page.len(),
                "page_size": page_size,
                "cursor": cursor_in,
                "next_cursor": next_cursor,
                "has_more": has_more,
                "exports": page,
                "sort": sort,
                "order": order,
                "filters": {
                    "window_days": f_window_days,
                    "hash": f_hash,
                    "since_day_iso": f_since_day_iso,
                    "until_day_iso": f_until_day_iso,
                    "min_rows": f_min_rows
                },
                "errors_sample": errors.into_iter().take(100).collect::<Vec<_>>()
            }))
        }

        "banlog_export_delete" => {
            use std::fs;
            use std::path::Path;

            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";

            let _lock = crate::util::export_lock::ExportLock::acquire("/var/lib/acp-node/exports/.lock")?;

            let name = params.get("name").and_then(|v| v.as_str());
            let path_param = params.get("path").and_then(|v| v.as_str());

            let target = if let Some(n) = name {
                if n.contains("..") || n.contains('/') || n.contains('\\') {
                    anyhow::bail!("name must not contain path components");
                }
                format!("{}/{}", EXPORT_DIR, n)
            } else if let Some(p) = path_param {
                p.to_string()
            } else {
                anyhow::bail!("missing name or path");
            };

            let export_canon = Path::new(EXPORT_DIR).canonicalize()
                .map_err(|_| anyhow::anyhow!("export dir not found"))?;
            let target_canon = Path::new(&target).canonicalize()
                .map_err(|e| anyhow::anyhow!("file not found or invalid path: {}", e))?;
            if !target_canon.starts_with(&export_canon) {
                anyhow::bail!("refusing to delete outside export dir");
            }

            let target_str = target_canon.to_string_lossy().to_string();
            let inprog_path = format!("{}.inprogress", &target_str);
            if std::fs::metadata(&inprog_path).is_ok() {
                anyhow::bail!("refusing to delete export_in_progress");
            }

            fs::remove_file(&target_canon)?;
            if !target_str.ends_with(".json") {
                let _ = fs::remove_file(format!("{}.json", &target_str));
            }
            Ok(json!({
                "accepted": true,
                "deleted": target_str
            }))
        }

        "banlog_export_read_chunk" => {
            use base64::Engine;
            use std::fs::File;
            use std::io::{Read, Seek, SeekFrom};
            use std::path::Path;

            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";

            let _lock = crate::util::export_lock::ExportLock::acquire("/var/lib/acp-node/exports/.lock")?;

            let name = params.get("name").and_then(|v| v.as_str());
            let path_param = params.get("path").and_then(|v| v.as_str());

            let path = if let Some(n) = name {
                if n.contains("..") || n.contains('/') || n.contains('\\') {
                    anyhow::bail!("name must not contain path components");
                }
                format!("{}/{}", EXPORT_DIR, n)
            } else if let Some(p) = path_param {
                let p_canon = Path::new(p).canonicalize()
                    .map_err(|e| anyhow::anyhow!("path not found or invalid: {}", e))?;
                let export_canon = Path::new(EXPORT_DIR).canonicalize()
                    .map_err(|_| anyhow::anyhow!("export dir not found"))?;
                if !p_canon.starts_with(&export_canon) {
                    anyhow::bail!("refusing to read outside export dir");
                }
                p_canon.to_string_lossy().to_string()
            } else {
                anyhow::bail!("missing name or path");
            };

            let offset = params
                .get("offset")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let max_bytes = params
                .get("max_bytes")
                .and_then(|v| v.as_u64())
                .unwrap_or(1_048_576)
                .min(4_194_304) as usize;
            let base64_out = params
                .get("base64")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);

            let mut f = File::open(&path)?;
            let md = f.metadata()?;
            let file_bytes = md.len();
            let name_display = name
                .map(|s| s.to_string())
                .unwrap_or_else(|| Path::new(&path).file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default());

            if offset > file_bytes {
                return Ok(json!({
                    "accepted": true,
                    "name": name_display,
                    "path": path,
                    "offset": offset,
                    "bytes_returned": 0,
                    "file_bytes": file_bytes,
                    "next_offset": serde_json::Value::Null,
                    "eof": true,
                    "chunk_base64": ""
                }));
            }

            f.seek(SeekFrom::Start(offset))?;

            let mut buf = vec![0u8; max_bytes];
            let n = f.read(&mut buf)?;
            buf.truncate(n);

            let eof = (offset + n as u64) >= file_bytes;
            let next_offset = if eof {
                None
            } else {
                Some(offset + n as u64)
            };

            let mut resp = json!({
                "accepted": true,
                "name": name_display,
                "path": path,
                "offset": offset,
                "bytes_returned": n,
                "file_bytes": file_bytes,
                "next_offset": next_offset,
                "eof": eof
            });

            if base64_out {
                resp["chunk_base64"] = json!(base64::engine::general_purpose::STANDARD.encode(&buf));
            } else {
                resp["chunk_hex"] = json!(Hex::encode(&buf));
            }

            Ok(resp)
        }

        "banlog_export_manifest_get" => {
            use std::fs;

            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";

            let _lock = crate::util::export_lock::ExportLock::acquire("/var/lib/acp-node/exports/.lock")?;

            let name = params.get("name").and_then(|v| v.as_str());
            let manifest_name = params.get("manifest_name").and_then(|v| v.as_str());

            let mpath = if let Some(mn) = manifest_name {
                if mn.contains("..") || mn.contains('/') || mn.contains('\\') {
                    anyhow::bail!("manifest_name must not contain path components");
                }
                format!("{}/{}", EXPORT_DIR, mn)
            } else if let Some(n) = name {
                if n.contains("..") || n.contains('/') || n.contains('\\') {
                    anyhow::bail!("name must not contain path components");
                }
                format!("{}/{}.json", EXPORT_DIR, n)
            } else {
                anyhow::bail!("missing name or manifest_name");
            };

            if !mpath.starts_with(EXPORT_DIR) {
                anyhow::bail!("refusing to read outside export dir");
            }

            let s = fs::read_to_string(&mpath)?;
            let v: serde_json::Value = serde_json::from_str(&s)?;
            Ok(json!({
                "accepted": true,
                "manifest_path": mpath,
                "manifest": v
            }))
        }

        "banlog_export_verify" => {
            use sha2::{Digest, Sha256};
            use std::fs::File;
            use std::io::Read;

            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";

            let _lock = crate::util::export_lock::ExportLock::acquire("/var/lib/acp-node/exports/.lock")?;

            let name = params
                .get("name")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing name"))?;

            if name.contains("..") || name.contains('/') || name.contains('\\') {
                anyhow::bail!("invalid name");
            }

            let path = format!("{}/{}", EXPORT_DIR, name);
            let manifest_path = format!("{}/{}.json", EXPORT_DIR, name);

            let inprog_path = format!("{}.inprogress", &path);
            if std::fs::metadata(&inprog_path).is_ok() {
                return Ok(json!({
                    "accepted": false,
                    "reason": "export_in_progress",
                    "name": name,
                    "path": path,
                    "inprogress_path": inprog_path
                }));
            }

            let manifest_str = std::fs::read_to_string(&manifest_path)?;
            let manifest_json: serde_json::Value = serde_json::from_str(&manifest_str)?;
            let sha_manifest = manifest_json
                .get("sha256")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("manifest missing sha256"))?
                .to_string();

            let chunk_bytes = params
                .get("chunk_bytes")
                .and_then(|v| v.as_u64())
                .unwrap_or(4_194_304)
                .min(16_777_216) as usize;

            let mut f = File::open(&path)?;
            let bytes = f.metadata()?.len();

            let mut hasher = Sha256::new();
            let mut buf = vec![0u8; chunk_bytes];

            loop {
                let n = f.read(&mut buf)?;
                if n == 0 {
                    break;
                }
                hasher.update(&buf[..n]);
            }

            let sha_computed = format!("{:x}", hasher.finalize());
            let ok = sha_computed.eq_ignore_ascii_case(&sha_manifest);

            let checked_at_ts: u64 = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            Ok(json!({
                "accepted": true,
                "name": name,
                "path": path,
                "manifest_path": manifest_path,
                "sha256_manifest": sha_manifest,
                "sha256_computed": sha_computed,
                "match": ok,
                "bytes": bytes,
                "checked_at_ts": checked_at_ts
            }))
        }

        "exports_status" => {
            let paths = ctx
                .config
                .exports
                .as_ref()
                .map(|e| crate::exports::maintain::opts_from_config(e, &ctx.config.data_dir).paths)
                .unwrap_or_else(|| crate::exports::maintain::default_paths(&ctx.config.data_dir));
            let default_log = format!("{}/maintain.log", paths.exports_dir);
            let maintain_log_path = crate::util::path_sanitize::sanitize_exports_path(
                params.get("maintain_log_path").and_then(|v| v.as_str()).unwrap_or(&default_log),
            ).unwrap_or(default_log);
            let mut opts = crate::exports::maintain::StatusOpts {
                paths: paths.clone(),
                max_total_bytes: params.get("max_total_bytes").and_then(|v| v.as_u64()),
                limit_samples: params.get("limit_samples").and_then(|v| v.as_u64()).unwrap_or(20).min(200) as usize,
                max_age_minutes: params.get("max_age_minutes").and_then(|v| v.as_u64()).unwrap_or(60).clamp(5, 10080),
                stale_sample_size: params.get("stale_sample_size").and_then(|v| v.as_u64()).unwrap_or(10).min(200) as usize,
                include_maintain_log: params.get("include_maintain_log").and_then(|v| v.as_bool()).unwrap_or(false),
                maintain_log_head_lines: params.get("maintain_log_head_lines").and_then(|v| v.as_u64()).unwrap_or(20).min(200) as usize,
                maintain_log_tail_lines: params.get("maintain_log_tail_lines").and_then(|v| v.as_u64()).unwrap_or(20).min(200) as usize,
                maintain_log_max_bytes: params.get("maintain_log_max_bytes").and_then(|v| v.as_u64()).unwrap_or(200_000).min(2_000_000) as usize,
            };
            opts.paths.maintain_log_path = maintain_log_path;
            let result = crate::exports::maintain::exports_status(opts)?;
            Ok(result.status)
        }

        "exports_selftest" => {
            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";
            let lock_path = "/var/lib/acp-node/exports/.lock";
            let mut checks: Vec<serde_json::Value> = Vec::new();
            let mut passed = true;

            let exports_ok = std::fs::read_dir(EXPORT_DIR).is_ok();
            if !exports_ok {
                passed = false;
            }
            checks.push(json!({
                "name": "exports_dir",
                "ok": exports_ok,
                "details": if exports_ok { "readable" } else { "cannot read exports dir" }
            }));

            let plans_dir = format!("{}/.plans", EXPORT_DIR);
            let plans_ok = std::fs::read_dir(&plans_dir).is_ok()
                || std::fs::create_dir_all(&plans_dir).is_ok();
            if !plans_ok {
                passed = false;
            }
            checks.push(json!({
                "name": "plans_dir",
                "ok": plans_ok,
                "details": if plans_ok { "accessible or created" } else { "cannot read or create .plans" }
            }));

            let lock_ok = match crate::util::export_lock::ExportLock::try_acquire(lock_path) {
                Ok(Some(_guard)) => true,
                Ok(None) => false,
                Err(_) => false,
            };
            if !lock_ok {
                passed = false;
            }
            checks.push(json!({
                "name": "lock",
                "ok": lock_ok,
                "details": if lock_ok { "acquire/release works" } else { "lock busy or failed" }
            }));

            let fs_ok = crate::util::fs_usage::fs_usage(EXPORT_DIR).is_ok();
            if !fs_ok {
                passed = false;
            }
            checks.push(json!({
                "name": "fs_usage",
                "ok": fs_ok,
                "details": if fs_ok { "can compute disk usage" } else { "fs_usage failed" }
            }));

            let fp_result = crate::exports::state_fingerprint::scan_exports_dir_for_fingerprint(EXPORT_DIR);
            let fp_ok = fp_result.is_ok();
            let fp = fp_result.ok().map(|(tb, rb, newest, oldest, inprog, ready)| {
                crate::exports::state_fingerprint::compute_exports_state_fingerprint_v2(
                    tb, rb, newest, oldest, inprog, ready,
                )
            });
            let fingerprint_ok = fp_ok && fp.as_ref().map(|f| !f.fingerprint_hex.is_empty()).unwrap_or(false);
            if !fingerprint_ok {
                passed = false;
            }
            checks.push(json!({
                "name": "fingerprint",
                "ok": fingerprint_ok,
                "details": if fingerprint_ok { "computed and non-empty" } else { "fingerprint failed or empty" }
            }));

            let now_ts = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            let dummy_opts = crate::exports::gc::GcPlanOpts {
                keep_days: 365,
                max_total_bytes: None,
                strategy: "bytes_only".to_string(),
                protect_last_n: 0,
                plan_limit: 1,
                delete_limit: 1,
                protected_sample_size: 0,
                now_ts,
            };
            let plan_ok = crate::exports::gc::compute_gc_plan(EXPORT_DIR, dummy_opts).is_ok();
            if !plan_ok {
                passed = false;
            }
            checks.push(json!({
                "name": "dummy_plan",
                "ok": plan_ok,
                "details": if plan_ok { "dry-run plan computed" } else { "compute_gc_plan failed" }
            }));

            Ok(json!({
                "accepted": true,
                "passed": passed,
                "checks": checks
            }))
        }

        "exports_auto_maintain" => {
            let mut opts = ctx
                .config
                .exports
                .as_ref()
                .map(|e| crate::exports::maintain::opts_from_config(e, &ctx.config.data_dir))
                .unwrap_or_else(|| crate::exports::maintain::default_opts(&ctx.config.data_dir));
            crate::exports::maintain::apply_param_overrides(&mut opts, params);
            let r = crate::exports::maintain::maintain_run(opts)?;
            let gc_plan_ref = r.gc_plan_ref.as_ref().map(|ref_| json!({
                "plan_id": ref_.plan_id,
                "plan_hash": ref_.plan_hash,
                "expires_at_ts": ref_.expires_at_ts
            }));
            Ok(json!({
                "accepted": r.accepted,
                "status_line": r.status_line,
                "exit_code": r.exit_code,
                "ok": r.ok,
                "pressure": r.pressure,
                "stale_inprogress_count": r.stale_inprogress_count,
                "auto_apply_attempted": r.auto_apply_attempted,
                "auto_apply_applied": r.auto_apply_applied,
                "auto_apply_blocked_reason": r.auto_apply_blocked_reason,
                "gc_plan_ref": gc_plan_ref,
                "recommended_next": r.recommendation_hint,
                "local_log_written": r.local_log_written,
                "local_log_path": r.local_log_path,
                "local_log_reason": r.local_log_reason,
                "local_log_path_sanitize_warning": r.local_log_path_sanitize_warning
            }))
        }

        "exports_health" => {
            let mut opts = ctx
                .config
                .exports
                .as_ref()
                .map(|e| crate::exports::maintain::opts_from_config(e, &ctx.config.data_dir))
                .unwrap_or_else(|| crate::exports::maintain::default_opts(&ctx.config.data_dir));
            crate::exports::maintain::apply_param_overrides(&mut opts, params);
            let export_dir = opts.paths.exports_dir.clone();
            let r = crate::exports::maintain::maintain_run(opts)?;
            let disk_usage = crate::util::fs_usage::fs_usage(&export_dir).ok();
            let disk_ratio = disk_usage.as_ref().map(|u| u.used_ratio).unwrap_or(r.disk_used_ratio);
            let gc_plan_ref = r.gc_plan_ref.as_ref().map(|ref_| json!({
                "plan_id": ref_.plan_id,
                "plan_hash": ref_.plan_hash,
                "expires_at_ts": ref_.expires_at_ts
            }));
            let gc_plan_val = r.gc_plan.as_ref().map(|p| json!({
                "would_delete_count": p.would_delete_count,
                "would_delete_total_bytes": p.would_delete_total_bytes,
                "meets_target": p.meets_target,
                "cannot_reach_target": p.cannot_reach_target,
                "min_possible_total_bytes": p.min_possible_total_bytes,
                "entries": p.entries
            }));
            let mut out = json!({
                "accepted": r.accepted,
                "ok": r.ok,
                "status": {
                    "pressure": r.pressure,
                    "stale_inprogress_count": r.stale_inprogress_count,
                    "inprogress_count": r.inprogress_count
                },
                "gc_plan_ref": gc_plan_ref,
                "recommendation": r.recommendation,
                "recommendation_hint": r.recommendation_hint,
                "gc_plan": gc_plan_val,
                "apply_last_plan_summary": r.apply_result,
                "last_plan_meets_target": r.gc_plan.as_ref().map(|p| p.meets_target),
                "parameter_suggestions": if r.suggestions.is_empty() { serde_json::Value::Null } else { serde_json::to_value(&r.suggestions).unwrap_or(serde_json::Value::Null) },
                "samples": serde_json::Value::Null,
                "auto_apply_attempted": r.auto_apply_attempted,
                "auto_apply_applied": r.auto_apply_applied,
                "auto_apply_blocked_reason": r.auto_apply_blocked_reason,
                "auto_apply_result": r.apply_result,
                "auto_apply_allowed": r.auto_apply_allowed,
                "auto_apply_allowed_reason": r.auto_apply_allowed_reason,
                "plan_source": r.gc_plan_ref.as_ref().map(|ref_| ref_.plan_source.as_str()).unwrap_or("none"),
                "state_fingerprint": r.state_fingerprint,
                "state_fingerprint_version": r.state_fingerprint_version
            });
            if let Some(obj) = out.as_object_mut() {
                if let Some(ref fsu) = disk_usage {
                    obj.insert(
                        "disk".to_string(),
                        json!({
                            "total_bytes": fsu.total_bytes,
                            "available_bytes": fsu.available_bytes,
                            "used_bytes": fsu.used_bytes,
                            "used_ratio": disk_ratio,
                            "max_disk_pressure_ratio": 0.95
                        }),
                    );
                }
            }
            Ok(out)
        }

        "exports_recover_stale_inprogress" => {
            use std::fs;
            use std::time::{SystemTime, UNIX_EPOCH};

            let force = params
                .get("force")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            let lock_path = "/var/lib/acp-node/exports/.lock";
            let maybe_lock = crate::util::export_lock::ExportLock::try_acquire(lock_path)?;

            if maybe_lock.is_none() && !force {
                return Ok(json!({
                    "accepted": false,
                    "reason": "exports_lock_busy",
                    "busy": true
                }));
            }
            let _lock_guard = maybe_lock;

            let export_dir = "/var/lib/acp-node/exports";

            let max_age_minutes = params
                .get("max_age_minutes")
                .and_then(|v| v.as_u64())
                .unwrap_or(60)
                .clamp(5, 10080);
            let mode = params
                .get("mode")
                .and_then(|v| v.as_str())
                .unwrap_or("delete");
            if mode != "delete" && mode != "fail" {
                anyhow::bail!("mode must be delete or fail");
            }
            let dry_run = params
                .get("dry_run")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            let limit = params
                .get("limit")
                .and_then(|v| v.as_u64())
                .unwrap_or(200)
                .min(5000) as usize;
            let sample_size = params
                .get("sample_size")
                .and_then(|v| v.as_u64())
                .unwrap_or(50)
                .min(500) as usize;
            let min_heartbeat_grace_minutes = params
                .get("min_heartbeat_grace_minutes")
                .and_then(|v| v.as_u64())
                .unwrap_or(2);
            let default_grace_secs = min_heartbeat_grace_minutes.saturating_mul(60);

            let now_ts: u64 = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            let cutoff_ts = now_ts.saturating_sub(max_age_minutes.saturating_mul(60));

            fn read_heartbeat_seconds(inprog_path: &str) -> Option<u64> {
                let s = std::fs::read_to_string(inprog_path).ok()?;
                for line in s.lines() {
                    if let Some(v) = line.strip_prefix("heartbeat_seconds=") {
                        if let Ok(n) = v.trim().parse::<u64>() {
                            return Some(n);
                        }
                    }
                }
                None
            }

            let mut found = 0usize;
            let mut recovered_count = 0usize;
            let mut recovered_sample: Vec<serde_json::Value> = Vec::new();
            let mut errors: Vec<String> = Vec::new();

            let rd = match fs::read_dir(export_dir) {
                Ok(r) => r,
                Err(e) => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": format!("read_dir failed: {}", e)
                    }));
                }
            };

            for e in rd.flatten() {
                if recovered_count >= limit {
                    break;
                }

                let name = e.file_name().to_string_lossy().to_string();
                if !name.ends_with(".inprogress") {
                    continue;
                }
                if name.contains("..") || name.contains('/') || name.contains('\\') {
                    errors.push(format!("skip suspicious name: {}", name));
                    continue;
                }

                let inprog_path = format!("{}/{}", export_dir, name);

                let md = match fs::metadata(&inprog_path) {
                    Ok(m) => m,
                    Err(e) => {
                        errors.push(format!("metadata {}: {}", name, e));
                        continue;
                    }
                };

                let mtime_ts = match md
                    .modified()
                    .ok()
                    .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                    .map(|d| d.as_secs())
                {
                    Some(t) => t,
                    None => {
                        errors.push(format!("mtime missing {}", name));
                        continue;
                    }
                };

                found += 1;

                if mtime_ts >= cutoff_ts {
                    continue;
                }
                let hb_read = read_heartbeat_seconds(&inprog_path);
                let grace_secs = hb_read
                    .map(|hb| hb.saturating_mul(2).max(30))
                    .unwrap_or(default_grace_secs);
                if mtime_ts >= now_ts.saturating_sub(grace_secs) {
                    continue; // auto-grace: marker recently touched => likely active; skip
                }

                let age_minutes = (now_ts.saturating_sub(mtime_ts)) / 60;

                let base_name = name.trim_end_matches(".inprogress").to_string();
                let base_path = format!("{}/{}", export_dir, base_name);
                let part_path = format!("{}.part", base_path);
                let tmp_manifest_path = format!("{}.json.tmp", base_path);
                let _manifest_path = format!("{}.json", base_path);

                let action = if mode == "fail" {
                    let failed_path = format!("{}.failed", base_path);

                    if !dry_run {
                        let _ = fs::remove_file(&tmp_manifest_path);
                        let _ = fs::rename(&inprog_path, &failed_path);
                        if fs::metadata(&part_path).is_ok() {
                            let _ = fs::rename(&part_path, &format!("{}.part", failed_path));
                        }
                    }
                    "mark_failed".to_string()
                } else {
                    if !dry_run {
                        let _ = fs::remove_file(&inprog_path);
                        let _ = fs::remove_file(&part_path);
                        let _ = fs::remove_file(&tmp_manifest_path);
                    }
                    "delete".to_string()
                };

                recovered_count += 1;

                if recovered_sample.len() < sample_size {
                    recovered_sample.push(json!({
                        "base_path": base_path,
                        "inprogress_path": inprog_path,
                        "part_path": part_path,
                        "age_minutes": age_minutes,
                        "action": action,
                        "heartbeat_seconds": hb_read
                    }));
                }
            }

            Ok(json!({
                "accepted": true,
                "dry_run": dry_run,
                "force": force,
                "mode": mode,
                "max_age_minutes": max_age_minutes,
                "min_heartbeat_grace_minutes": min_heartbeat_grace_minutes,
                "cutoff_ts": cutoff_ts,
                "found": found,
                "recovered_count": recovered_count,
                "recovered_sample": recovered_sample,
                "errors_sample": errors.into_iter().take(200).collect::<Vec<_>>()
            }))
        }

        "banlog_export_gc" => {
            use std::fs;

            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";

            let _lock = crate::util::export_lock::ExportLock::acquire("/var/lib/acp-node/exports/.lock")?;

            let keep_days = params
                .get("keep_days")
                .and_then(|v| v.as_u64())
                .unwrap_or(7)
                .min(365);
            let max_total_bytes = params.get("max_total_bytes").and_then(|v| v.as_u64());
            let strategy = params
                .get("strategy")
                .and_then(|v| v.as_str())
                .unwrap_or("days_or_bytes");
            let dry_run = params
                .get("dry_run")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            let limit = params
                .get("limit")
                .and_then(|v| v.as_u64())
                .unwrap_or(2000)
                .min(10_000) as usize;
            let plan_limit = params
                .get("plan_limit")
                .and_then(|v| v.as_u64())
                .unwrap_or(500)
                .min(2000) as usize;
            let protect_last_n = params
                .get("protect_last_n")
                .and_then(|v| v.as_u64())
                .unwrap_or(0)
                .min(1000) as usize;
            let protected_sample_size = params
                .get("protected_sample_size")
                .and_then(|v| v.as_u64())
                .unwrap_or(20)
                .min(200) as usize;

            let now_ts: u64 = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            let plan = match crate::exports::gc::compute_gc_plan(
                EXPORT_DIR,
                crate::exports::gc::GcPlanOpts {
                    keep_days,
                    max_total_bytes,
                    strategy: strategy.to_string(),
                    protect_last_n,
                    plan_limit,
                    delete_limit: limit,
                    protected_sample_size,
                    now_ts,
                },
            ) {
                Ok(p) => p,
                Err(e) => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": format!("compute_gc_plan failed: {}", e)
                    }));
                }
            };

            if !dry_run {
                for manifest_path in &plan.would_delete_manifests {
                    let filename = fs::read_to_string(manifest_path)
                        .ok()
                        .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
                        .and_then(|mj| {
                            mj.get("filename")
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string())
                        })
                        .or_else(|| {
                            std::path::Path::new(manifest_path)
                                .file_stem()
                                .and_then(|s| s.to_str())
                                .map(|s| format!("{}.csv", s))
                        });
                    if let Some(f) = filename {
                        if !f.contains("..") && !f.contains('/') && !f.contains('\\') {
                            let export_path = format!("{}/{}", EXPORT_DIR, f);
                            let _ = fs::remove_file(&export_path);
                        }
                    }
                    let _ = fs::remove_file(manifest_path);
                }
            }

            Ok(json!({
                "accepted": true,
                "keep_days": keep_days,
                "max_total_bytes": max_total_bytes,
                "strategy": strategy,
                "dry_run": dry_run,
                "protect_last_n": protect_last_n,
                "protected_count": plan.protected_count,
                "protected_sample": plan.protected_sample,
                "protected_newest_created_at_ts": plan.protected_newest_created_at_ts,
                "cannot_reach_target": plan.cannot_reach_target,
                "min_possible_total_bytes": plan.min_possible_total_bytes,
                "cutoff_ts": plan.cutoff_ts,
                "before_total_bytes": plan.before_total_bytes,
                "after_total_bytes": plan.projected_after_total_bytes,
                "deleted_count": plan.would_delete_count,
                "kept_count": plan.kept_count,
                "kept_total_bytes": plan.kept_total_bytes,
                "kept_newest_created_at_ts": plan.kept_newest_created_at_ts,
                "kept_newest_day_iso": plan.kept_newest_day_iso,
                "plan": {
                    "plan_limit": plan_limit,
                    "needed_to_free_bytes": plan.needed_to_free_bytes,
                    "would_delete_count": plan.would_delete_count,
                    "would_delete_total_bytes": plan.would_delete_total_bytes,
                    "projected_after_total_bytes": plan.projected_after_total_bytes,
                    "would_delete": plan.would_delete
                },
                "deleted_sample": plan.deleted_sample,
                "errors_sample": plan.errors_sample
            }))
        }

        "exports_gc_plan" => {
            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";

            let _lock = crate::util::export_lock::ExportLock::acquire("/var/lib/acp-node/exports/.lock")?;

            let max_total_bytes = params.get("max_total_bytes").and_then(|v| v.as_u64());
            let strategy = params
                .get("strategy")
                .and_then(|v| v.as_str())
                .unwrap_or("bytes_only");
            let keep_days = params
                .get("keep_days")
                .and_then(|v| v.as_u64())
                .unwrap_or(7)
                .min(365);
            let protect_last_n = params
                .get("protect_last_n")
                .and_then(|v| v.as_u64())
                .unwrap_or(0)
                .min(1000) as usize;
            let plan_limit = params
                .get("plan_limit")
                .and_then(|v| v.as_u64())
                .unwrap_or(500)
                .min(2000) as usize;
            let limit = params
                .get("limit")
                .and_then(|v| v.as_u64())
                .unwrap_or(2000)
                .min(10_000) as usize;
            let protected_sample_size = params
                .get("protected_sample_size")
                .and_then(|v| v.as_u64())
                .unwrap_or(20)
                .min(200) as usize;

            let now_ts: u64 = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            let expires_at_ts = now_ts
                .saturating_add(crate::exports::gc_plan_store::plan_ttl_secs());

            let (tb, ready_bytes, newest_ready, oldest_ready, inprog, ready) =
                match crate::exports::state_fingerprint::scan_exports_dir_for_fingerprint(EXPORT_DIR)
                {
                    Ok(t) => t,
                    Err(_) => (0u64, 0u64, None, None, 0u64, 0u64),
                };
            let fp = crate::exports::state_fingerprint::compute_exports_state_fingerprint_v2(
                tb, ready_bytes, newest_ready, oldest_ready, inprog, ready,
            );

            let opts_stored = crate::exports::gc_plan_store::GcPlanOptsStored {
                keep_days,
                max_total_bytes,
                strategy: strategy.to_string(),
                protect_last_n,
                plan_limit,
                delete_limit: limit,
                protected_sample_size,
            };
            let opts = crate::exports::gc::GcPlanOpts {
                keep_days: opts_stored.keep_days,
                max_total_bytes: opts_stored.max_total_bytes,
                strategy: opts_stored.strategy.clone(),
                protect_last_n: opts_stored.protect_last_n,
                plan_limit: opts_stored.plan_limit,
                delete_limit: opts_stored.delete_limit,
                protected_sample_size: opts_stored.protected_sample_size,
                now_ts,
            };

            let plan = match crate::exports::gc::compute_gc_plan(EXPORT_DIR, opts) {
                Ok(p) => p,
                Err(e) => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": format!("compute_gc_plan failed: {}", e)
                    }));
                }
            };

            let plan_id = crate::util::id::new_uuid();
            let plan_hash = match crate::exports::gc_plan_store::save_plan(
                EXPORT_DIR,
                &plan_id,
                now_ts,
                expires_at_ts,
                &opts_stored,
                &plan,
                Some(&fp.fingerprint_hex),
                Some(fp.version),
            ) {
                Ok(h) => h,
                Err(e) => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": format!("save_plan failed: {}", e)
                    }));
                }
            };

            let target_max_total_bytes = max_total_bytes.unwrap_or(0);
            let bytes_freed_needed = plan.before_total_bytes.saturating_sub(target_max_total_bytes);
            let bytes_freed_estimated = plan.would_delete_total_bytes;
            let meets_target = plan.projected_after_total_bytes <= target_max_total_bytes;

            Ok(json!({
                "accepted": true,
                "plan_id": plan_id,
                "plan_hash": plan_hash,
                "expires_at_ts": expires_at_ts,
                "state_fingerprint": fp.fingerprint_hex,
                "state_fingerprint_version": fp.version,
                "plan": {
                    "keep_days": keep_days,
                    "max_total_bytes": max_total_bytes,
                    "target_max_total_bytes": target_max_total_bytes,
                    "bytes_freed_needed": bytes_freed_needed,
                    "bytes_freed_estimated": bytes_freed_estimated,
                    "meets_target": meets_target,
                    "strategy": strategy,
                    "protect_last_n": protect_last_n,
                    "plan_limit": plan_limit,
                    "before_total_bytes": plan.before_total_bytes,
                    "projected_after_total_bytes": plan.projected_after_total_bytes,
                    "would_delete_count": plan.would_delete_count,
                    "would_delete_total_bytes": plan.would_delete_total_bytes,
                    "would_delete": plan.would_delete,
                    "protected_count": plan.protected_count,
                    "protected_sample": plan.protected_sample,
                    "protected_newest_created_at_ts": plan.protected_newest_created_at_ts,
                    "cannot_reach_target": plan.cannot_reach_target,
                    "min_possible_total_bytes": plan.min_possible_total_bytes,
                    "cutoff_ts": plan.cutoff_ts,
                    "needed_to_free_bytes": plan.needed_to_free_bytes,
                    "kept_count": plan.kept_count,
                    "kept_newest_created_at_ts": plan.kept_newest_created_at_ts,
                    "kept_newest_day_iso": plan.kept_newest_day_iso,
                    "kept_total_bytes": plan.kept_total_bytes,
                    "deleted_sample": plan.deleted_sample,
                    "errors_sample": plan.errors_sample
                }
            }))
        }

        "exports_gc_apply" => {
            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";

            let _lock = crate::util::export_lock::ExportLock::acquire("/var/lib/acp-node/exports/.lock")?;

            let plan_id = params
                .get("plan_id")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("plan_id required"))?;
            let plan_hash = params
                .get("plan_hash")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("plan_hash required"))?;
            let max_delete_bytes = params.get("max_delete_bytes").and_then(|v| v.as_u64());
            let max_delete_count = params.get("max_delete_count").and_then(|v| v.as_u64());
            let sample_size = params
                .get("sample_size")
                .and_then(|v| v.as_u64())
                .unwrap_or(50)
                .min(500) as usize;

            let apply_opts = crate::exports::gc_apply::ApplyOpts {
                max_delete_bytes,
                max_delete_count,
                sample_size,
            };

            match crate::exports::gc_apply::apply_plan(EXPORT_DIR, plan_id, plan_hash, &apply_opts) {
                Ok(s) => Ok(crate::exports::gc_apply::success_to_json(&s)),
                Err(e) => Ok(crate::exports::gc_apply::error_to_json(&e)),
            }
        }

        "exports_gc_plans_list" => {
            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";

            let _lock = crate::util::export_lock::ExportLock::acquire("/var/lib/acp-node/exports/.lock")?;

            let page_size = params
                .get("page_size")
                .and_then(|v| v.as_u64())
                .unwrap_or(20)
                .min(200) as usize;
            let cursor = params.get("cursor").and_then(|v| v.as_str());
            let include_plan = params
                .get("include_plan")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);

            let (plans, next_cursor, has_more, errors) =
                match crate::exports::gc_plan_store::list_plans(
                    EXPORT_DIR,
                    page_size,
                    cursor,
                    include_plan,
                ) {
                    Ok((p, nc, hm, e)) => (p, nc, hm, e),
                    Err(e) => {
                        return Ok(json!({
                            "accepted": false,
                            "reason": format!("list_plans failed: {}", e)
                        }));
                    }
                };

            let now_ts: u64 = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            let plans_json: Vec<serde_json::Value> = plans
                .iter()
                .map(|e| {
                    let mut j = json!({
                        "plan_id": e.plan_id,
                        "created_at_ts": e.created_at_ts,
                        "expires_at_ts": e.expires_at_ts,
                        "expired": e.expires_at_ts < now_ts,
                        "plan_hash": e.plan_hash,
                        "opts": e.opts,
                        "summary": e.summary
                    });
                    if let Some(ref wd) = e.would_delete {
                        j["would_delete"] = serde_json::to_value(wd).unwrap_or(serde_json::Value::Null);
                    }
                    j
                })
                .collect();

            Ok(json!({
                "accepted": true,
                "count": plans.len(),
                "plans": plans_json,
                "next_cursor": next_cursor,
                "has_more": has_more,
                "errors_sample": errors.into_iter().take(50).collect::<Vec<_>>()
            }))
        }

        "exports_gc_plan_get" => {
            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";

            let _lock = crate::util::export_lock::ExportLock::acquire("/var/lib/acp-node/exports/.lock")?;

            let plan_id = params
                .get("plan_id")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("plan_id required"))?;

            let plan = match crate::exports::gc_plan_store::load_plan(EXPORT_DIR, plan_id) {
                Ok(Some(p)) => p,
                Ok(None) => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": "plan_not_found",
                        "plan_id": plan_id
                    }));
                }
                Err(e) => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": format!("load_plan failed: {}", e)
                    }));
                }
            };

            Ok(json!({
                "accepted": true,
                "plan": plan
            }))
        }

        "exports_gc_plan_delete" => {
            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";

            let _lock = crate::util::export_lock::ExportLock::acquire("/var/lib/acp-node/exports/.lock")?;

            let plan_id = params
                .get("plan_id")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("plan_id required"))?;
            let _reason = params.get("reason").and_then(|v| v.as_str());

            let path = std::path::Path::new(EXPORT_DIR)
                .join(".plans")
                .join(format!("{}.json", plan_id));
            let existed = path.exists();
            let _ = crate::exports::gc_plan_store::delete_plan(EXPORT_DIR, plan_id);

            Ok(json!({
                "accepted": true,
                "deleted": existed,
                "plan_id": plan_id
            }))
        }

        "exports_gc_plans_gc" => {
            use std::fs;

            const EXPORT_DIR: &str = "/var/lib/acp-node/exports";

            let _lock = crate::util::export_lock::ExportLock::acquire("/var/lib/acp-node/exports/.lock")?;

            let dry_run = params
                .get("dry_run")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            let limit = params
                .get("limit")
                .and_then(|v| v.as_u64())
                .unwrap_or(200)
                .min(5000) as usize;
            let sample_size = params
                .get("sample_size")
                .and_then(|v| v.as_u64())
                .unwrap_or(50)
                .min(500) as usize;

            let delete_old_fp_versions = params
                .get("delete_old_fingerprint_versions")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            let current_fp_version: u32 = params
                .get("current_state_fingerprint_version")
                .and_then(|v| v.as_u64())
                .map(|x| x as u32)
                .unwrap_or(crate::exports::state_fingerprint::STATE_FINGERPRINT_VERSION);

            let now_ts: u64 = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            let plans_dir = format!("{}/.plans", EXPORT_DIR);
            let mut expired_count = 0usize;
            let mut to_delete: Vec<(String, serde_json::Value, bool, u32, String)> = Vec::new();

            if let Ok(rd) = fs::read_dir(&plans_dir) {
                for e in rd.flatten() {
                    let name = e.file_name().to_string_lossy().to_string();
                    if !name.ends_with(".json") || name.ends_with(".tmp") {
                        continue;
                    }
                    let path = format!("{}/{}", plans_dir, name);
                    let s = match fs::read_to_string(&path) {
                        Ok(s) => s,
                        Err(_) => continue,
                    };
                    let v: serde_json::Value = match serde_json::from_str(&s) {
                        Ok(v) => v,
                        Err(_) => continue,
                    };

                    let expires_at_ts = v.get("expires_at_ts").and_then(|x| x.as_u64()).unwrap_or(0);
                    let is_expired = expires_at_ts > 0 && expires_at_ts < now_ts;

                    let plan_fp_ver = v
                        .get("state_fingerprint_version")
                        .and_then(|x| x.as_u64())
                        .unwrap_or(0) as u32;
                    let is_old_fp = delete_old_fp_versions && plan_fp_ver != current_fp_version;

                    if is_expired {
                        expired_count += 1;
                    }
                    let should_delete = is_expired || is_old_fp;
                    if !should_delete {
                        continue;
                    }

                    let reason = if is_old_fp {
                        "old_fingerprint_version"
                    } else {
                        "expired"
                    };
                    to_delete.push((path, v, is_old_fp, plan_fp_ver, reason.to_string()));
                }
            }

            let would_delete_count = to_delete.len();
            let mut deleted_count = 0usize;
            let mut deleted_sample: Vec<serde_json::Value> = Vec::new();
            let mut deleted_old_version_count = 0usize;
            let mut deleted_old_version_sample: Vec<serde_json::Value> = Vec::new();

            for (path, mut v, is_old_fp, plan_fp_ver, reason) in to_delete.into_iter().take(limit) {
                if !dry_run {
                    v["status"] = json!("expired");
                    v["status_ts"] = json!(now_ts);
                    v["gc_reason"] = json!(&reason);
                    let _ = crate::exports::plans_store::atomic_write_json(&path, &v);
                    let _ = fs::remove_file(&path);
                }
                deleted_count += 1;

                if deleted_sample.len() < sample_size {
                    deleted_sample.push(json!({
                        "plan_id": v.get("plan_id").and_then(|x| x.as_str()).unwrap_or(""),
                        "created_at_ts": v.get("created_at_ts").and_then(|x| x.as_u64()).unwrap_or(0),
                        "expires_at_ts": v.get("expires_at_ts").and_then(|x| x.as_u64()).unwrap_or(0)
                    }));
                }
                if is_old_fp {
                    deleted_old_version_count += 1;
                    if deleted_old_version_sample.len() < sample_size {
                        deleted_old_version_sample.push(json!({
                            "file": path,
                            "plan_id": v.get("plan_id").and_then(|x| x.as_str()).unwrap_or(""),
                            "state_fingerprint_version": plan_fp_ver,
                            "current_state_fingerprint_version": current_fp_version,
                            "reason": reason
                        }));
                    }
                }
            }

            Ok(json!({
                "accepted": true,
                "dry_run": dry_run,
                "delete_old_fingerprint_versions": delete_old_fp_versions,
                "current_state_fingerprint_version": current_fp_version,
                "expired_count": expired_count,
                "would_delete_count": would_delete_count,
                "deleted_count": deleted_count,
                "deleted_sample": deleted_sample,
                "deleted_old_version_count": deleted_old_version_count,
                "deleted_old_version_sample": deleted_old_version_sample
            }))
        }

        "revalidatepending" => {
            let limit = params
                .get("limit")
                .and_then(|v| v.as_u64())
                .unwrap_or(50)
                .min(500) as usize;
            let dry_run = params
                .get("dry_run")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);

            let mut tried = 0usize;
            let mut ok = 0usize;
            let mut denied = 0usize;
            let mut failed = 0usize;
            let mut results: Vec<serde_json::Value> = Vec::with_capacity(limit);

            let mut f = |k: &[u8], _v: &[u8]| -> Result<bool> {
                if k.len() != 32 {
                    return Ok(true);
                }
                if tried >= limit {
                    return Ok(false);
                }

                let mut hh = [0u8; 32];
                hh.copy_from_slice(k);
                tried += 1;

                if let Some(d) = ctx.chain.storage.nearest_invalid_ancestor_distance(&hh)? {
                    if d > crate::config::REVALIDATE_INVALID_ANCESTOR_MAX_DEPTH {
                        denied += 1;
                        results.push(json!({
                            "hash": TxHex::encode_blockhash(&hh),
                            "status": "denied",
                            "reason": "finality policy",
                            "invalid_ancestor_distance": d
                        }));
                        return Ok(true);
                    }
                }

                if dry_run {
                    let st = ctx.chain.storage.get_header_status(&hh)?.unwrap_or(1);
                    let exists = ctx.chain.storage.get_header_wire(&hh)?.is_some();
                    ok += 1;
                    results.push(json!({
                        "hash": TxHex::encode_blockhash(&hh),
                        "status": "dry_run",
                        "exists": exists,
                        "current_status": match st {
                            2 => "active",
                            3 => "invalid",
                            _ => "valid-headers"
                        }
                    }));
                    return Ok(true);
                }

                match ctx.chain.storage.revalidate_subtree_v46(&hh) {
                    Ok(n) => {
                        {
                            use crate::storage::rocks::Rocks;
                            use crate::storage::schema::CF_PENDING_REVALIDATE;
                            let dbref = ctx.chain.storage.db.db();
                            let mut batch = rocksdb::WriteBatch::default();
                            Rocks::batch_del_cf(&mut batch, dbref, CF_PENDING_REVALIDATE, &hh)?;
                            ctx.chain.storage.db.write_batch(batch)?;
                        }
                        ok += 1;
                        results.push(json!({
                            "hash": TxHex::encode_blockhash(&hh),
                            "status": "ok",
                            "revalidated": n
                        }));
                    }
                    Err(e) => {
                        failed += 1;
                        results.push(json!({
                            "hash": TxHex::encode_blockhash(&hh),
                            "status": "failed",
                            "reason": e.to_string()
                        }));
                    }
                }

                Ok(true)
            };

            ctx.chain
                .storage
                .db
                .for_each_cf(crate::storage::schema::CF_PENDING_REVALIDATE, &mut f)?;

            if !dry_run {
                let _ = ctx.chain.storage.recompute_best_header_tip_v52();
            }

            Ok(json!({
                "accepted": true,
                "dry_run": dry_run,
                "tried": tried,
                "ok": ok,
                "denied": denied,
                "failed": failed,
                "results": results
            }))
        }

        "getforksummary" => {
            let mut tips_count = 0usize;
            let mut best: Option<([u8; 32], u128, u64)> = None;
            let mut second: Option<([u8; 32], u128, u64)> = None;

            let better = |a: (u128, u64, [u8; 32]), b: (u128, u64, [u8; 32])| -> bool {
                a.0 > b.0 || (a.0 == b.0 && a.1 > b.1) || (a.0 == b.0 && a.1 == b.1 && a.2 > b.2)
            };

            let mut f = |k: &[u8], _v: &[u8]| -> Result<bool> {
                if k.len() != 32 {
                    return Ok(true);
                }
                let mut hh = [0u8; 32];
                hh.copy_from_slice(k);

                let st = ctx.chain.storage.get_header_status(&hh)?.unwrap_or(1);
                if st == 3 {
                    return Ok(true);
                }

                tips_count += 1;
                let score = ctx.chain.storage.get_header_score(&hh)?.unwrap_or(0);
                let height = ctx.chain.storage.get_header_height(&hh)?.unwrap_or(0);

                match best {
                    None => best = Some((hh, score, height)),
                    Some((bh, bs, bhh)) => {
                        if better((score, height, hh), (bs, bhh, bh)) {
                            second = best;
                            best = Some((hh, score, height));
                        } else {
                            match second {
                                None => second = Some((hh, score, height)),
                                Some((sh, ss, shh)) => {
                                    if hh != bh && better((score, height, hh), (ss, shh, sh)) {
                                        second = Some((hh, score, height));
                                    }
                                }
                            }
                        }
                    }
                }

                Ok(true)
            };

            ctx.chain
                .storage
                .db
                .for_each_cf(crate::storage::schema::CF_TIPS, &mut f)?;

            let mk = |hh: [u8; 32], score: u128, height: u64| -> Result<serde_json::Value> {
                let st = ctx.chain.storage.get_header_status(&hh)?.unwrap_or(1);
                let status_str = match st {
                    2 => "active",
                    3 => "invalid",
                    _ => "valid-headers",
                };
                Ok(json!({
                    "hash": TxHex::encode_blockhash(&hh),
                    "height": height,
                    "score": score.to_string(),
                    "status": status_str,
                    "headers_only": st != 2
                }))
            };

            let best_json = match best {
                Some((hh, score, height)) => Some(mk(hh, score, height)?),
                None => None,
            };

            let second_json = match second {
                Some((hh, score, height)) => Some(mk(hh, score, height)?),
                None => None,
            };

            let delta = if let (Some((_, bscore, bh)), Some((_, sscore, sh))) = (best, second) {
                Some(json!({
                    "height": (bh as i64 - sh as i64),
                    "score": (bscore - sscore).to_string()
                }))
            } else {
                None
            };

            Ok(json!({
                "tips_supported": true,
                "tips_count": tips_count,
                "best_tip": best_json,
                "second_tip": second_json,
                "delta": delta
            }))
        }

        "clearban" => {
            let h = params
                .get("hash")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing hash"))?;
            let hh = TxHex::decode_blockhash(h).map_err(anyhow::Error::msg)?;

            let exists = ctx.chain.storage.get_header_wire(&hh)?.is_some();

            {
                use crate::storage::rocks::Rocks;
                use crate::storage::schema::{CF_HEADER_BANINFO, CF_PENDING_REVALIDATE};

                let dbref = ctx.chain.storage.db.db();
                let mut batch = rocksdb::WriteBatch::default();
                Rocks::batch_del_cf(&mut batch, dbref, CF_HEADER_BANINFO, &hh)?;
                Rocks::batch_put_cf(&mut batch, dbref, CF_PENDING_REVALIDATE, &hh, &[1u8])?;
                ctx.chain.storage.db.write_batch(batch)?;
            }

            Ok(json!({
                "accepted": true,
                "hash": TxHex::encode_blockhash(&hh),
                "found": exists,
                "pending_revalidate": true
            }))
        }

        "invalidateheader" => {
            let h = params
                .get("hash")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing hash"))?;
            let hh = TxHex::decode_blockhash(h).map_err(anyhow::Error::msg)?;

            if ctx.chain.storage.get_header_wire(&hh)?.is_none() {
                return Ok(json!({ "accepted": false, "reason": "unknown header" }));
            }

            let reason = params
                .get("reason")
                .and_then(|v| v.as_str())
                .unwrap_or("manual invalidation");
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            match ctx.chain.storage.invalidate_subtree_v47(&hh, now, reason) {
                Ok(n) => Ok(json!({
                    "accepted": true,
                    "invalidated": n,
                    "hash": TxHex::encode_blockhash(&hh)
                })),
                Err(e) => Ok(json!({
                    "accepted": false,
                    "hash": TxHex::encode_blockhash(&hh),
                    "reason": e.to_string()
                })),
            }
        }

        "revalidateheader" => {
            let h = params
                .get("hash")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing hash"))?;
            let hh = TxHex::decode_blockhash(h).map_err(anyhow::Error::msg)?;

            if ctx.chain.storage.get_header_wire(&hh)?.is_none() {
                return Ok(json!({ "accepted": false, "reason": "unknown header" }));
            }

            if let Some(d) = ctx.chain.storage.nearest_invalid_ancestor_distance(&hh)? {
                if d > crate::config::REVALIDATE_INVALID_ANCESTOR_MAX_DEPTH {
                    return Ok(json!({
                        "accepted": false,
                        "reason": "revalidate denied by finality policy",
                        "invalid_ancestor_distance": d,
                        "max_allowed_distance": crate::config::REVALIDATE_INVALID_ANCESTOR_MAX_DEPTH
                    }));
                }
            }

            match ctx.chain.storage.revalidate_subtree_v46(&hh) {
                Ok(n) => {
                    let best_header_tip = ctx
                        .chain
                        .storage
                        .get_best_header_tip()?
                        .map(|x| TxHex::encode_blockhash(&x));
                    Ok(json!({
                        "accepted": true,
                        "revalidated": n,
                        "hash": TxHex::encode_blockhash(&hh),
                        "best_header_tip": best_header_tip
                    }))
                }
                Err(e) => Ok(json!({
                    "accepted": false,
                    "hash": TxHex::encode_blockhash(&hh),
                    "reason": e.to_string()
                })),
            }
        }

        "setbestheadertip" => {
            let h = params
                .get("hash")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing hash"))?;
            let hh = TxHex::decode_blockhash(h).map_err(anyhow::Error::msg)?;

            if ctx.chain.storage.get_header_wire(&hh)?.is_none() {
                return Ok(json!({ "accepted": false, "reason": "unknown header" }));
            }

            if let Some(st) = ctx.chain.storage.get_header_status(&hh)? {
                if st == 3 {
                    return Ok(json!({ "accepted": false, "reason": "header is invalid" }));
                }
            }

            let is_tip = ctx.chain.storage.is_tip(&hh)?;
            if !is_tip {
                return Ok(json!({ "accepted": false, "reason": "not a tip" }));
            }

            let score = ctx.chain.storage.get_header_score(&hh)?.unwrap_or(0);
            let height = ctx.chain.storage.get_header_height(&hh)?.unwrap_or(0);

            ctx.chain.storage.set_best_header_tip(&hh)?;

            Ok(json!({
                "accepted": true,
                "tiphash": TxHex::encode_blockhash(&hh),
                "height": height,
                "score": score.to_string()
            }))
        }

        "reorgbestheadertip" => {
            let tips = ctx.chain.storage.list_tips()?;
            let mut best: Option<([u8; 32], u128, u64)> = None;

            for (hh, _tip_height, status) in tips {
                if status == 3 {
                    continue;
                }
                let score = ctx.chain.storage.get_header_score(&hh)?.unwrap_or(0);
                let height = ctx.chain.storage.get_header_height(&hh)?.unwrap_or(0);

                match best {
                    None => best = Some((hh, score, height)),
                    Some((bh, bs, bhh)) => {
                        if score > bs
                            || (score == bs && height > bhh)
                            || (score == bs && height == bhh && hh > bh)
                        {
                            best = Some((hh, score, height));
                        }
                    }
                }
            }

            let Some((hh, score, height)) = best else {
                return Ok(json!({ "accepted": false, "reason": "no tips" }));
            };

            ctx.chain.storage.set_best_header_tip(&hh)?;

            Ok(json!({
                "accepted": true,
                "tiphash": TxHex::encode_blockhash(&hh),
                "height": height,
                "score": score.to_string()
            }))
        }

        "getbestheadertip" => {
            let b = ctx
                .chain
                .storage
                .get_best_header_tip()?
                .map(|h| TxHex::encode_blockhash(&h));
            Ok(json!({ "tiphash": b }))
        }

        "getbestheaderchainpath" => {
            let tip = params
                .get("from")
                .and_then(|v| v.as_str())
                .and_then(|s| TxHex::decode_blockhash(s).ok())
                .or_else(|| ctx.chain.storage.get_best_header_tip().ok().flatten());

            let Some(mut cur) = tip else {
                return Ok(json!({
                    "count": 0,
                    "path": [],
                    "reason": "no best header tip (and no from hash)"
                }));
            };

            let mut path: Vec<String> = Vec::new();
            let mut steps: usize = 0;

            while steps < crate::config::BEST_CHAIN_PATH_LIMIT {
                path.push(TxHex::encode_blockhash(&cur));
                steps += 1;

                let prev = ctx
                    .chain
                    .storage
                    .db
                    .get_cf(crate::storage::schema::CF_HEADER_PREV, &cur)?;
                let Some(p) = prev else {
                    break;
                };
                if p.len() != 32 {
                    break;
                }

                let mut ph = [0u8; 32];
                ph.copy_from_slice(&p);
                cur = ph;
            }

            path.reverse();

            Ok(json!({
                "count": path.len(),
                "path": path,
                "tiphash": tip.map(|h| TxHex::encode_blockhash(&h))
            }))
        }

        "bestchaindiff" => {
            let a_str = params
                .get("a")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing a"))?;
            let b_str = params
                .get("b")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing b"))?;

            let a = TxHex::decode_blockhash(a_str).map_err(anyhow::Error::msg)?;
            let b = TxHex::decode_blockhash(b_str).map_err(anyhow::Error::msg)?;

            let anc = ctx.chain.storage.find_common_ancestor(a, b)?;
            let Some(anc) = anc else {
                return Ok(json!({
                    "found": false,
                    "reason": "no common ancestor (disconnected headers?)"
                }));
            };

            fn build_path(
                storage: &crate::storage::Storage<crate::storage::rocks::Rocks>,
                mut tip: [u8; 32],
                anc: [u8; 32],
                limit: usize,
            ) -> Result<Vec<[u8; 32]>> {
                use crate::storage::schema::CF_HEADER_PREV;
                let mut v = Vec::new();
                let mut steps: u64 = 0;

                while tip != anc
                    && v.len() < limit
                    && steps < crate::config::CHAIN_DIFF_SCAN_LIMIT
                {
                    v.push(tip);
                    let prev = storage.db.get_cf(CF_HEADER_PREV, &tip)?;
                    let Some(p) = prev else {
                        break;
                    };
                    if p.len() != 32 {
                        break;
                    }
                    let mut ph = [0u8; 32];
                    ph.copy_from_slice(&p);
                    tip = ph;
                    steps += 1;
                }
                v.reverse();
                Ok(v)
            }

            let fork_point_height = ctx.chain.storage.get_header_height(&anc)?.unwrap_or(0);

            let a_path =
                build_path(&ctx.chain.storage, a, anc, crate::config::CHAIN_DIFF_LIMIT)?;
            let b_path =
                build_path(&ctx.chain.storage, b, anc, crate::config::CHAIN_DIFF_LIMIT)?;

            let a_path2 = a_path
                .iter()
                .map(|h| {
                    let height = ctx
                        .chain
                        .storage
                        .get_header_height(h)
                        .ok()
                        .flatten()
                        .unwrap_or(0);
                    json!({ "hash": TxHex::encode_blockhash(h), "height": height })
                })
                .collect::<Vec<_>>();
            let b_path2 = b_path
                .iter()
                .map(|h| {
                    let height = ctx
                        .chain
                        .storage
                        .get_header_height(h)
                        .ok()
                        .flatten()
                        .unwrap_or(0);
                    json!({ "hash": TxHex::encode_blockhash(h), "height": height })
                })
                .collect::<Vec<_>>();

            Ok(json!({
                "found": true,
                "common_ancestor": TxHex::encode_blockhash(&anc),
                "fork_point_height": fork_point_height,
                "a_tip": TxHex::encode_blockhash(&a),
                "b_tip": TxHex::encode_blockhash(&b),
                "a_path": a_path2,
                "b_path": b_path2,
                "a_len": a_path2.len(),
                "b_len": b_path2.len()
            }))
        }

        "getrawtransaction" => {
            let txid = params.get("txid").and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing txid"))?;
            let txid = TxHex::decode_txid(txid).map_err(anyhow::Error::msg)?;

            let verbose = params.get("verbose").and_then(|v| v.as_i64()).unwrap_or(0);

            let best_height = ctx.chain.storage.best_height()?;

            let (wire, in_mempool) = if let Some(w) = ctx.mempool.get(&txid) {
                (w, true)
            } else {
                let w = ctx.chain.storage.get_tx_wire(&txid)?
                    .ok_or_else(|| anyhow::anyhow!("unknown tx"))?;
                (w, false)
            };

            if verbose == 0 {
                return Ok(json!(Hex::encode(&wire)));
            }
            if verbose != 1 {
                anyhow::bail!("invalid verbose (use 0 or 1)");
            }

            let tx = Transaction::from_wire(&wire).map_err(anyhow::Error::msg)?;
            let meta = ctx.chain.storage.get_tx_meta(&txid)?;

            let block_time_opt = if let Some((_h, bh)) = meta {
                match ctx.chain.storage.get_block_meta(&bh)? {
                    Some((_bh_h, t)) => Some(t),
                    None => None,
                }
            } else {
                None
            };

            let decoded = tx_json_decoded(&tx, &wire, in_mempool, best_height, meta, block_time_opt);

            Ok(json!({
                "decoded": decoded,
                "hex": Hex::encode(&wire)
            }))
        }

        "sendrawtransaction" => {
            let tx_hex = match params.get("tx").and_then(|v| v.as_str()) {
                Some(s) => s,
                None => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": "missing tx"
                    }))
                }
            };

            let wire = match Hex::decode_with_limit(tx_hex, 512 * 1024) {
                Ok(b) => b,
                Err(e) => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": format!("bad hex: {e}")
                    }))
                }
            };

            let tx = match Transaction::from_wire(&wire) {
                Ok(tx) => tx,
                Err(e) => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": format!("decode failed: {e}")
                    }))
                }
            };

            if tx.chain_id != ctx.chain.chain_id {
                return Ok(json!({
                    "accepted": false,
                    "reason": "tx chain_id mismatch"
                }));
            }

            let txid = match tx.txid() {
                Ok(id) => id,
                Err(e) => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": format!("txid error: {e}")
                    }))
                }
            };

            if ctx.mempool.has(&txid) {
                return Ok(json!({
                    "accepted": false,
                    "txid": TxHex::encode_txid(&txid),
                    "reason": "duplicate tx (mempool)"
                }));
            }
            if ctx.chain.storage.get_tx_wire(&txid).ok().flatten().is_some() {
                return Ok(json!({
                    "accepted": false,
                    "txid": TxHex::encode_txid(&txid),
                    "reason": "duplicate tx (disk)"
                }));
            }

            match ctx.mempool.put(&tx) {
                Ok(id) => Ok(json!({
                    "accepted": true,
                    "txid": TxHex::encode_txid(&id)
                })),
                Err(e) => Ok(json!({
                    "accepted": false,
                    "txid": TxHex::encode_txid(&txid),
                    "reason": e.to_string()
                }))
            }
        }

        "submitblock" => {
            let block_hex = match params.get("block").and_then(|v| v.as_str()) {
                Some(s) => s,
                None => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": "missing block"
                    }))
                }
            };

            let bw = match Hex::decode_with_limit(block_hex, 4 * 1024 * 1024) {
                Ok(b) => b,
                Err(e) => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": format!("bad hex: {e}")
                    }))
                }
            };

            let block = match Block::from_wire(&bw) {
                Ok(b) => b,
                Err(e) => {
                    return Ok(json!({
                        "accepted": false,
                        "reason": format!("decode failed: {e}")
                    }))
                }
            };

            let bh = block.header.blockhash();
            if ctx.chain.storage.has_block(&bh)? {
                let best_h = ctx.chain.storage.best_height()?;
                let tiphash = ctx.chain.storage.best_hash()?.map(|h| TxHex::encode_blockhash(&h));
                return Ok(json!({
                    "accepted": false,
                    "blockhash": TxHex::encode_blockhash(&bh),
                    "reason": "duplicate block",
                    "best_height": best_h,
                    "tiphash": tiphash
                }));
            }

            match ctx.chain.submit_block(&block) {
                Ok(h) => {
                    if let Some(ref urls) = ctx.config.peer_rpc_urls {
                        let block_hex_relay = block_hex.to_string();
                        let urls_relay = urls.clone();
                        let token = ctx.config.rpc_token.clone();
                        tokio::spawn(async move {
                            let client = reqwest::Client::builder()
                                .timeout(std::time::Duration::from_secs(10))
                                .build()
                                .unwrap_or_else(|_| reqwest::Client::new());
                            for url in urls_relay {
                                let body = serde_json::json!({
                                    "jsonrpc": "2.0",
                                    "method": "submitblock",
                                    "params": { "block": block_hex_relay },
                                    "id": 1
                                });
                                let mut req = client.post(&url).json(&body);
                                if let Some(t) = token.as_deref() {
                                    req = req.header("x-acp-rpc-token", t);
                                }
                                if let Err(e) = req.send().await {
                                    tracing::warn!(%url, "block relay failed: {}", e);
                                }
                            }
                        });
                    }
                    let _ = ctx.chain.storage.recompute_best_header_tip_v52();
                    let best_h = ctx.chain.storage.best_height()?;
                    let tiphash = ctx.chain.storage.best_hash()?.map(|h| TxHex::encode_blockhash(&h));
                    Ok(json!({
                        "accepted": true,
                        "blockhash": TxHex::encode_blockhash(&h),
                        "height": block.header.height,
                        "best_height": best_h,
                        "tiphash": tiphash
                    }))
                }
                Err(e) => {
                    let best_h = ctx.chain.storage.best_height()?;
                    let tiphash = ctx.chain.storage.best_hash()?.map(|h| TxHex::encode_blockhash(&h));
                    Ok(json!({
                        "accepted": false,
                        "blockhash": TxHex::encode_blockhash(&bh),
                        "reason": e.to_string(),
                        "best_height": best_h,
                        "tiphash": tiphash
                    }))
                }
            }
        }

        "gettransaction" => {
            Ok(json!({
                "supported": false,
                "reason": "wallet module not enabled (use getrawtransaction instead)"
            }))
        }

        "getaddressinfo" => {
            let s = params
                .get("address")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing address"))?;

            if s.starts_with("acp1") {
                return match acp_crypto::AddressV0::decode(s) {
                    Ok(a) => {
                        let mut payload = Vec::with_capacity(21);
                        payload.push(0u8);
                        payload.extend_from_slice(&a.pubkey_hash20);

                        Ok(json!({
                            "isvalid": true,
                            "address": s,
                            "type": "bech32_acp_v0",
                            "hrp": acp_crypto::HRP,
                            "version": 0,
                            "pubkey_hash20": Hex::encode(&a.pubkey_hash20),
                            "payload_hex": Hex::encode(&payload),
                            "checksum_ok": true,
                            "ismine": false,
                            "iswatchonly": false,
                            "script_type": "p2h20_v0",
                            "embedded": null
                        }))
                    }
                    Err(_) => Ok(json!({
                        "isvalid": false,
                        "address": s,
                        "type": "bech32_acp_v0",
                        "hrp": acp_crypto::HRP,
                        "checksum_ok": false
                    })),
                };
            }

            let pk = match TxHex::decode_pubkey(s) {
                Ok(pk) => pk,
                Err(_) => {
                    return Ok(json!({
                        "isvalid": false,
                        "address": s,
                        "type": "unknown"
                    }))
                }
            };

            let pubkey_wire = pk.to_wire_bytes().map_err(anyhow::Error::msg)?;
            let addr_obj =
                acp_crypto::address_v0_from_pubkey_wire(&pubkey_wire).map_err(anyhow::Error::msg)?;
            let addr = addr_obj.encode().map_err(anyhow::Error::msg)?;

            let mut payload = Vec::with_capacity(21);
            payload.push(0u8);
            payload.extend_from_slice(&addr_obj.pubkey_hash20);

            Ok(json!({
                "isvalid": true,
                "address": s,
                "type": "pubkey_wire_hex",
                "canonical_pubkey_wire_hex": TxHex::encode_pubkey(&pk).map_err(anyhow::Error::msg)?,
                "derived": {
                    "address": addr,
                    "type": "bech32_acp_v0",
                    "hrp": acp_crypto::HRP,
                    "version": 0,
                    "pubkey_hash20": Hex::encode(&addr_obj.pubkey_hash20),
                    "payload_hex": Hex::encode(&payload),
                    "checksum_ok": true,
                    "script_type": "p2h20_v0"
                },
                "ismine": false,
                "iswatchonly": false
            }))
        }

        "validateaddress" => {
            let s = params
                .get("address")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("missing address"))?;

            if s.starts_with("acp1") {
                match acp_crypto::AddressV0::decode(s) {
                    Ok(a) => {
                        let mut payload = Vec::with_capacity(21);
                        payload.push(0u8);
                        payload.extend_from_slice(&a.pubkey_hash20);

                        Ok(json!({
                            "isvalid": true,
                            "type": "bech32",
                            "hrp": acp_crypto::HRP,
                            "version": 0,
                            "address": s,
                            "pubkey_hash20": Hex::encode(&a.pubkey_hash20),
                            "payload_hex": Hex::encode(&payload),
                            "checksum_ok": true,
                            "ismine": false,
                            "iswatchonly": false
                        }))
                    }
                    Err(_) => Ok(json!({
                        "isvalid": false,
                        "type": "bech32",
                        "hrp": acp_crypto::HRP,
                        "address": s,
                        "checksum_ok": false
                    })),
                }
            } else {
                let pk = match TxHex::decode_pubkey(s) {
                    Ok(pk) => pk,
                    Err(_) => {
                        return Ok(json!({
                            "isvalid": false,
                            "type": "unknown"
                        }))
                    }
                };

                let pubkey_wire = pk.to_wire_bytes().map_err(anyhow::Error::msg)?;
                let addr_obj =
                    acp_crypto::address_v0_from_pubkey_wire(&pubkey_wire).map_err(anyhow::Error::msg)?;
                let addr = addr_obj.encode().map_err(anyhow::Error::msg)?;

                let mut payload = Vec::with_capacity(21);
                payload.push(0u8);
                payload.extend_from_slice(&addr_obj.pubkey_hash20);

                Ok(json!({
                    "isvalid": true,
                    "type": "pubkey_wire_hex",
                    "canonical_pubkey_wire_hex": TxHex::encode_pubkey(&pk).map_err(anyhow::Error::msg)?,
                    "derived": {
                        "hrp": acp_crypto::HRP,
                        "version": 0,
                        "address": addr,
                        "pubkey_hash20": Hex::encode(&addr_obj.pubkey_hash20),
                        "payload_hex": Hex::encode(&payload),
                        "checksum_ok": true
                    },
                    "ismine": false,
                    "iswatchonly": false
                }))
            }
        }

        "getmempoolinfo" => {
            let lim = ctx.mempool.limits();
            Ok(json!({
                "size": ctx.mempool.len(),
                "bytes": ctx.mempool.size_bytes(),
                "max_txs": lim.max_txs,
                "max_bytes": lim.max_bytes,
                "max_tx_bytes": lim.max_tx_bytes,
                "min_fee": lim.min_fee
            }))
        }

        "getfeeestimate" => {
            let lim = ctx.mempool.limits();
            Ok(json!({
                "min_fee": lim.min_fee,
                "max_tx_bytes": lim.max_tx_bytes
            }))
        }

        _ => anyhow::bail!("method not found"),
    }
}
