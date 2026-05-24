import type {
  AcpNetworkStatus,
  AcpTransaction,
  AcpTransactionDetails,
  BroadcastResult,
  MobileBalance,
  MobileConfig,
  MobileDeviceListResponse,
  MobileDeviceRegisterInput,
  MobileDeviceRegisterResponse,
  MobileDeviceUnregisterResponse,
} from "./types.js";

export type AcpApiClientOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  authHeader?: string;
};

export class AcpApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly authHeader?: string;

  constructor(options: AcpApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.authHeader = options.authHeader;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (this.authHeader) {
      headers.Authorization = this.authHeader;
    }
    const res = await this.fetchImpl(url, {
      ...init,
      headers,
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

  getNetworkStatus(): Promise<AcpNetworkStatus> {
    return this.request<AcpNetworkStatus>("/acp/network/status");
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

  getTransaction(txid: string): Promise<AcpTransactionDetails> {
    const enc = encodeURIComponent(txid);
    return this.request<AcpTransactionDetails>(`/acp/transactions/${enc}`);
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

  registerDevice(body: MobileDeviceRegisterInput): Promise<MobileDeviceRegisterResponse> {
    return this.request<MobileDeviceRegisterResponse>("/mobile/devices/register", {
      method: "POST",
      body: JSON.stringify({
        device_token: body.deviceToken,
        platform: body.platform,
        app_version: body.appVersion ?? null,
      }),
    });
  }

  unregisterDevice(deviceToken: string): Promise<MobileDeviceUnregisterResponse> {
    return this.request<MobileDeviceUnregisterResponse>("/mobile/devices/unregister", {
      method: "POST",
      body: JSON.stringify({ device_token: deviceToken }),
    });
  }

  listDevices(): Promise<MobileDeviceListResponse> {
    return this.request<MobileDeviceListResponse>("/mobile/devices");
  }

  explorerTxUrl(config: MobileConfig, txid: string): string {
    return `${config.acpExplorerTxBase}/${txid}`;
  }
}
