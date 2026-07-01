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
  SmartPayCapabilities,
  SmartPayExecuteInput,
  SmartPayExecutionResponse,
  SmartPayHistoryResponse,
  SmartPayQuoteInput,
  SmartPayQuoteResponse,
  SmartPayReceipt,
  SmartPayRecoverInput,
  SmartQrParseInput,
  SmartQrParseResponse,
} from "./types.js";

export type AcpApiClientOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  authHeader?: string;
  /** Registered mobile device token; required by /acp/tx/broadcast when not authenticated. */
  deviceToken?: string;
};

export class AcpApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly authHeader?: string;
  private deviceToken?: string;

  constructor(options: AcpApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.authHeader = options.authHeader;
    this.deviceToken = options.deviceToken;
  }

  setDeviceToken(token: string | undefined): void {
    this.deviceToken = token;
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
    if (this.deviceToken && !headers["X-Device-Token"]) {
      headers["X-Device-Token"] = this.deviceToken;
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

  getSmartPayCapabilities(): Promise<SmartPayCapabilities> {
    return this.request<SmartPayCapabilities>("/mobile/smart-pay/capabilities");
  }

  parseSmartQr(body: SmartQrParseInput): Promise<SmartQrParseResponse> {
    return this.request<SmartQrParseResponse>("/mobile/smart-pay/parse", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  quoteSmartPay(body: SmartPayQuoteInput): Promise<SmartPayQuoteResponse> {
    return this.request<SmartPayQuoteResponse>("/mobile/smart-pay/quote", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  executeSmartPay(body: SmartPayExecuteInput): Promise<SmartPayExecutionResponse> {
    return this.request<SmartPayExecutionResponse>("/mobile/smart-pay/execute", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  listSmartPayPayments(limit = 20): Promise<SmartPayHistoryResponse> {
    return this.request<SmartPayHistoryResponse>(`/mobile/smart-pay/payments?limit=${limit}`);
  }

  getSmartPayExecution(executionId: string, sessionToken?: string | null): Promise<SmartPayExecutionResponse> {
    const enc = encodeURIComponent(executionId);
    const query = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : "";
    return this.request<SmartPayExecutionResponse>(`/mobile/smart-pay/payments/${enc}${query}`);
  }

  getSmartPayReceipt(executionId: string, sessionToken?: string | null): Promise<SmartPayReceipt> {
    const enc = encodeURIComponent(executionId);
    const query = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : "";
    return this.request<SmartPayReceipt>(`/mobile/smart-pay/payments/${enc}/receipt${query}`);
  }

  recoverSmartPay(executionId: string, body: SmartPayRecoverInput, sessionToken?: string | null): Promise<SmartPayExecutionResponse> {
    const enc = encodeURIComponent(executionId);
    const query = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : "";
    return this.request<SmartPayExecutionResponse>(`/mobile/smart-pay/payments/${enc}/recover${query}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  explorerTxUrl(config: MobileConfig, txid: string): string {
    return `${config.acpExplorerTxBase}/${txid}`;
  }
}
