/** wACP bridge HTTP client — wraps ANCAP `/v1/bridge/*` (see docs/mobile/BRIDGE_MOBILE_SPEC.md). */

export type BridgeStatus = {
  bridge_rail_enabled: boolean;
  bridge_rail_paused: boolean;
  dry_run: boolean;
  wacp_contract: string;
  gateway_contract: string;
  reserve_acp_address: string;
  confirmations_acp: number;
  confirmations_bsc: number;
  bsc_explorer_base: string;
  acp_explorer_tx_base: string;
  counts_by_status: Record<string, number>;
  checkpoint_acp: number | null;
  checkpoint_bsc: number | null;
  last_reconciliation?: Record<string, unknown> | null;
};

export type WacpStatus = {
  status: string;
  bridge_enabled: boolean;
  bridge_paused: boolean;
  mint_available: boolean;
  redeem_available: boolean;
  redeem_mode: string;
  reserve_proof_status: string;
  reserve_health: string;
  wacp_contract: string;
  gateway_contract: string;
  reserve_acp_address: string;
  confirmations_acp: number;
  confirmations_bsc: number;
  bsc_explorer_base: string;
  acp_explorer_tx_base: string;
  checkpoint_acp: number | null;
  checkpoint_bsc: number | null;
  last_updated_at: string | null;
  pair_live: boolean;
  pair_dex: string | null;
  pair_symbol: string | null;
  pair_address: string | null;
  pair_url: string | null;
  swap_url: string | null;
  liquidity_tx_hash: string | null;
  first_swap_buy_tx_hash: string | null;
  first_swap_sell_tx_hash: string | null;
  bsc_contract_verified: boolean;
  token_metadata_live: boolean;
  docs: Record<string, string>;
  counts_by_status: Record<string, number>;
  notes: string[];
};

export type ReserveProof = {
  status: string;
  bridge_enabled: boolean;
  bridge_paused: boolean;
  acp_reserve_address: string;
  acp_reserve_balance_smallest: string;
  wacp_contract: string;
  wacp_total_supply_wei: string;
  wacp_total_supply_acp_smallest: string;
  operational_buffer_smallest: string;
  backing_ratio: string | null;
  reserve_health: string;
  last_acp_block_height: number | null;
  last_bsc_block_number: number | null;
  last_updated_at: string | null;
  notes: string[];
};

export type RedeemQuote = {
  amount_wacp: string;
  amount_wacp_wei: string;
  acp_amount_floor: string;
  acp_smallest_floor: string;
  remainder_wacp_wei: string;
  remainder_wacp: string;
  policy: string;
};

export type BridgeIntent = {
  id: string;
  direction: string;
  status: string;
  user_bsc_address: string | null;
  user_acp_address: string | null;
  amount_acp_smallest: string;
  amount_wacp_wei: string;
  remainder_wacp_wei: string;
  acp_tx_hash: string | null;
  bsc_tx_hash_mint: string | null;
  bsc_tx_hash_burn: string | null;
  deposit_ref_hex: string | null;
  bsc_log_index: number | null;
  version: number | null;
  created_at: string | null;
};

export type CreateAcpToBscIntentInput = {
  userBscAddress: string;
  amountAcp: string;
  userAcpAddress?: string | null;
};

export type CreateBscToAcpIntentInput = {
  userBscAddress: string;
  userAcpAddress: string;
  amountWacp: string;
};

export class AcpBridgeClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly authHeader?: string
  ) {}

  private headers(): HeadersInit {
    const h: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (this.authHeader) {
      h.Authorization = this.authHeader;
    }
    return h;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`Bridge API ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Bridge API ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  getStatus(): Promise<BridgeStatus> {
    return this.get<BridgeStatus>("/bridge/status");
  }

  getWacpStatus(): Promise<WacpStatus> {
    return this.get<WacpStatus>("/bridge/wacp/status");
  }

  getReserveProof(): Promise<ReserveProof> {
    return this.get<ReserveProof>("/bridge/wacp/reserve-proof");
  }

  quoteBscToAcp(amountWacp: string): Promise<RedeemQuote> {
    return this.post<RedeemQuote>("/bridge/quote/bsc-to-acp", {
      amount_wacp: amountWacp,
    });
  }

  createIntentAcpToBsc(input: CreateAcpToBscIntentInput): Promise<BridgeIntent> {
    return this.post<BridgeIntent>("/bridge/intents/acp-to-bsc", {
      user_bsc_address: input.userBscAddress,
      amount_acp: input.amountAcp,
      user_acp_address: input.userAcpAddress ?? null,
    });
  }

  createIntentBscToAcp(input: CreateBscToAcpIntentInput): Promise<BridgeIntent> {
    return this.post<BridgeIntent>("/bridge/intents/bsc-to-acp", {
      user_bsc_address: input.userBscAddress,
      user_acp_address: input.userAcpAddress,
      amount_wacp: input.amountWacp,
    });
  }

  listMyIntents(limit = 50): Promise<BridgeIntent[]> {
    return this.get<BridgeIntent[]>(`/bridge/intents/me?limit=${limit}`);
  }
}
