import type {
  AcpTransaction,
  BroadcastResult,
  MobileBalance,
  MobileConfig,
} from "./types.js";

export type AcpApiClientOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

export class AcpApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AcpApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await this.fetchImpl(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }

  getConfig(): Promise<MobileConfig> {
    return this.request<MobileConfig>("/mobile/config");
  }

  getBalance(address: string): Promise<MobileBalance> {
    const enc = encodeURIComponent(address);
    return this.request<MobileBalance>(`/acp/address/${enc}/balance`);
  }

  getTransactions(address: string, limit = 50): Promise<AcpTransaction[]> {
    const enc = encodeURIComponent(address);
    return this.request<AcpTransaction[]>(
      `/acp/address/${enc}/transactions?limit=${limit}`
    );
  }

  estimateFee(body: {
    from: string;
    to: string;
    amountAcp: string;
  }): Promise<{ feeAcp: string; feeUnits: string; minFeeAcp: string }> {
    return this.request("/acp/tx/estimate-fee", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  broadcast(rawTx: string): Promise<BroadcastResult> {
    return this.request<BroadcastResult>("/acp/tx/broadcast", {
      method: "POST",
      body: JSON.stringify({ rawTx }),
    });
  }

  explorerTxUrl(config: MobileConfig, txid: string): string {
    return `${config.acpExplorerTxBase}/${txid}`;
  }
}
