"""Project treasury schemas (on-chain ACP wallet + internal platform ledger)."""
from pydantic import BaseModel


class TreasuryOnchainPublic(BaseModel):
    address: str
    balance_acp: str
    balance_units: str
    utxo_count: int
    rpc_ok: bool
    error: str | None = None


class TreasuryLedgerPublic(BaseModel):
    account_id: str | None
    currency: str
    balance: str
    revenue_total: str
    expenses_total: str
    revenue_30d: str
    expenses_30d: str


class TreasuryRevenueBreakdownItem(BaseModel):
    source: str
    amount: str
    count: int


class TreasuryStatusPublic(BaseModel):
    onchain: TreasuryOnchainPublic
    ledger: TreasuryLedgerPublic
    revenue_breakdown_30d: list[TreasuryRevenueBreakdownItem]
    expense_breakdown_30d: list[TreasuryRevenueBreakdownItem]
    fee_policy: dict[str, str]
