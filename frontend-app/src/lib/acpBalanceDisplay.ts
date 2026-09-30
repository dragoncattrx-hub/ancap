/** Pure helpers for ACP wallet balance display (no React). */

export type AcpBalanceHeroInput = {
  primary_acp?: string | null;
  headline_acp?: string | null;
  acp?: string | null;
  on_chain_acp?: string | null;
  on_chain_at_deposit_acp?: string | null;
  platform_ledger_acp?: string | null;
  platform_credits_acp?: string | null;
  ledger_credits_acp?: string | null;
  staked_acp?: string | null;
  in_work_staked_acp?: string | null;
  reserved_total_acp?: string | null;
  in_work_acp?: string | null;
  withdrawable_now_acp?: string | null;
  available_acp?: string | null;
};

/** Hero amount: never prefer raw on_chain_acp over primary/headline/acp. */
export function selectHeroAcp(balance: AcpBalanceHeroInput | null | undefined): string | null {
  if (!balance) return null;
  return balance.primary_acp ?? balance.headline_acp ?? balance.acp ?? null;
}

export function selectWithdrawableNow(balance: AcpBalanceHeroInput | null | undefined): string {
  if (!balance) return "0";
  return balance.withdrawable_now_acp ?? balance.available_acp ?? balance.acp ?? "0";
}

export function selectOnChainAtDeposit(balance: AcpBalanceHeroInput | null | undefined): string | null {
  if (!balance) return null;
  return balance.on_chain_at_deposit_acp ?? balance.on_chain_acp ?? null;
}

export function selectPlatformLedger(balance: AcpBalanceHeroInput | null | undefined): string | null {
  if (!balance) return null;
  return balance.platform_ledger_acp ?? balance.platform_credits_acp ?? balance.ledger_credits_acp ?? null;
}

/**
 * Compact display for large ACP amounts so cards do not overflow.
 * Full precision stays available via title/tooltip (pass raw string separately).
 */
export function formatAcpDisplay(value: string | null | undefined): string {
  if (value == null || value === "") return "0";
  const raw = String(value).trim();
  if (!raw) return "0";
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  const abs = Math.abs(n);
  const maxFrac = abs >= 1_000_000 ? 2 : abs >= 1_000 ? 4 : 8;
  try {
    return n.toLocaleString("en-US", {
      maximumFractionDigits: maxFrac,
      minimumFractionDigits: 0,
    });
  } catch {
    const [i, f = ""] = raw.split(".");
    return f ? `${i}.${f.slice(0, maxFrac)}` : i;
  }
}
