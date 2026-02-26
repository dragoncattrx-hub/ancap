//! Parse acp1... addresses for "pay to" flows.

use acp_crypto::{AddressV0, Result};

/// Parse bech32 acp1... address string.
pub fn parse_acp_address(s: &str) -> Result<AddressV0> {
    AddressV0::decode(s)
}
