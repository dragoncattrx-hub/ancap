//! RocksDB column families and key constants.

pub const CF_META: &str = "meta";
pub const CF_BLOCKS: &str = "blocks";
pub const CF_HEADERS: &str = "headers";
pub const CF_TXS: &str = "txs";
pub const CF_TX_META: &str = "txmeta";
pub const CF_BLOCK_META: &str = "blockmeta"; // blockhash -> [height(u64)][time(u64)]
pub const CF_HEIGHT_TO_HASH: &str = "h2h";

pub const CF_HEADER_PREV: &str = "hprev";   // headerhash -> prev_headerhash (32)
pub const CF_HEADER_CHILDREN: &str = "hchild"; // headerhash -> concatenated child hashes (32*N)
pub const CF_TIPS: &str = "tips";           // headerhash -> [height(u64)][status(u8)]

pub const CF_HEADER_STATUS: &str = "hstatus"; // headerhash -> status(u8) 1=valid-headers 2=active 3=invalid
pub const CF_HEADER_HEIGHT: &str = "hheight"; // headerhash -> height(u64 LE)

pub const CF_HEADER_SCORE: &str = "hscore";   // headerhash -> score(u128 LE, 16 bytes)
pub const CF_ORPHAN_PREV: &str = "orphprev"; // headerhash -> prevhash (32)
pub const CF_ORPHANS_BY_PREV: &str = "orphby"; // prevhash -> concat child headerhashes (32*N)

pub const CF_BEST_HEADER_TIP: &str = "bestht"; // singleton key -> headerhash(32)
pub const KEY_BEST_HEADER_TIP: &[u8] = b"best_header_tip";

pub const CF_HEADER_BANINFO: &str = "hban"; // headerhash -> baninfo (ts + reason)

pub const CF_BANLOG: &str = "banlog";       // ts_u64_le || seq_u32_le -> headerhash(32) || reason
/// Secondary index: headerhash(32) || ts_u64_le || seq_u32_le -> reason (len_u16 + bytes). v0.54.
pub const CF_BANLOG_BY_HASH: &str = "blhash";
pub const CF_BANLOG_META: &str = "banlog_meta"; // singleton meta
pub const KEY_BANLOG_SEQ: &[u8] = b"banlog_seq";

pub const CF_PENDING_REVALIDATE: &str = "preval"; // headerhash -> 1

/// Active bans index by time: key = ts_u64_le||seq_u32_le (same as banlog), value = headerhash(32). v0.53.
pub const CF_ACTIVE_BANS_BY_TS: &str = "abants";
/// Header -> active ban key (12 bytes) for index cleanup on revalidate. v0.53.
pub const CF_HEADER_ACTIVE_BANKEY: &str = "hbkey";

pub const KEY_BEST_HEIGHT: &[u8] = b"best_height";
pub const KEY_BEST_HASH: &[u8] = b"best_hash";
