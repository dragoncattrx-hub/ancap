"""System constants (L3: platform, stake escrow, order escrow account IDs)."""
from uuid import UUID

# Well-known account owner_id for internal ledger accounts (owner_type=system / stake_escrow / order_escrow)
PLATFORM_ACCOUNT_OWNER_ID = UUID("00000000-0000-0000-0000-000000000001")
STAKE_ESCROW_ACCOUNT_OWNER_ID = UUID("00000000-0000-0000-0000-000000000002")
ORDER_ESCROW_ACCOUNT_OWNER_ID = UUID("00000000-0000-0000-0000-000000000003")
