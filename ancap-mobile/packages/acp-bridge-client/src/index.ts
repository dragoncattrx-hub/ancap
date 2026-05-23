/** wACP bridge HTTP client — wraps ANCAP `/v1/bridge/*` (see docs/mobile/BRIDGE_MOBILE_SPEC.md). */

export type BridgeStatus = {
  bridge_enabled?: boolean;
  bridge_paused?: boolean;
  mint_available?: boolean;
  redeem_available?: boolean;
};

export type BridgeOperation = {
  id: string;
  status: string;
  direction?: string;
  amount_acp_smallest?: string;
  amount_wacp_wei?: string;
  acp_tx_hash?: string | null;
  bsc_tx_hash?: string | null;
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

  getStatus(): Promise<BridgeStatus> {
    return this.get<BridgeStatus>("/bridge/status");
  }

  getWacpStatus(): Promise<Record<string, unknown>> {
    return this.get("/bridge/wacp/status");
  }

  getReserveProof(): Promise<Record<string, unknown>> {
    return this.get("/bridge/wacp/reserve-proof");
  }
}
