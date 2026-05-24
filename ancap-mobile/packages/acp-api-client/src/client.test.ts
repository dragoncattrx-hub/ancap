import { describe, expect, it, vi } from "vitest";
import { AcpApiClient } from "./client.js";

describe("AcpApiClient", () => {
  it("strips trailing slashes from baseUrl and calls correct path", () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ minAppVersion: "1.0.0" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = new AcpApiClient({ baseUrl: "https://api.test/", fetchImpl: mock });
    void client.getConfig();
    expect(mock).toHaveBeenCalledWith(
      "https://api.test/mobile/config",
      expect.objectContaining({ headers: expect.objectContaining({ "Content-Type": "application/json" }) })
    );
  });

  it("throws on non-ok response with status text", () => {
    const mock = vi.fn().mockResolvedValue(
      new Response("Internal Server Error", { status: 500 })
    );
    const client = new AcpApiClient({ baseUrl: "https://api.test", fetchImpl: mock });
    return expect(client.getConfig()).rejects.toThrow("API 500");
  });

  it("attaches auth header when provided", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ devices: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = new AcpApiClient({
      baseUrl: "https://api.test",
      fetchImpl: mock,
      authHeader: "Bearer token123",
    });
    await client.listDevices();
    const [, opts] = mock.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer token123");
  });

  it("getNetworkStatus calls /acp/network/status", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ chain: "acp", rpcStatus: "ok", blockHeight: 42, minFeeAcp: "0.00000100" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = new AcpApiClient({ baseUrl: "https://api.test", fetchImpl: mock });
    const result = await client.getNetworkStatus();
    expect(mock).toHaveBeenCalledWith(
      "https://api.test/acp/network/status",
      expect.any(Object)
    );
    expect(result.blockHeight).toBe(42);
  });

  it("getBalance encodes address in URL", () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ address: "acp1...", units: "100000000", acp: "1", utxo_count: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = new AcpApiClient({ baseUrl: "https://api.test", fetchImpl: mock });
    void client.getBalance("acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9");
    const url = mock.mock.calls[0][0] as string;
    expect(url).toContain("/acp/address/");
    expect(url).toContain("/balance");
  });

  it("getTransaction calls /acp/transactions/{txid}", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        txid: "abc123",
        block_height: 1,
        block_hash: null,
        block_time: "2026-05-24T00:00:00Z",
        confirmations: 2,
        total_input_units: "100",
        total_input_acp: "0.000001",
        total_output_units: "100",
        total_output_acp: "0.000001",
        fee_units: "0",
        fee_acp: "0",
        inputs: [],
        outputs: [],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = new AcpApiClient({ baseUrl: "https://api.test", fetchImpl: mock });
    const result = await client.getTransaction("abc123");
    expect(mock).toHaveBeenCalledWith(
      "https://api.test/acp/transactions/abc123",
      expect.any(Object)
    );
    expect(result.txid).toBe("abc123");
  });

  it("broadcast sends rawTx in body", () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ accepted: true, txid: "abc123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = new AcpApiClient({ baseUrl: "https://api.test", fetchImpl: mock });
    void client.broadcast("deadbeefdeadbeef");
    const [, opts] = mock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse((opts.body as string) ?? "{}");
    expect(body.rawTx).toBe("deadbeefdeadbeef");
  });

  it("estimateFee passes correct body shape", () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ feeAcp: "0.00000100", feeUnits: "100", minFeeAcp: "0.00000100" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = new AcpApiClient({ baseUrl: "https://api.test", fetchImpl: mock });
    void client.estimateFee({ from: "acp1...", to: "acp1...", amountAcp: "1" });
    const [, opts] = mock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse((opts.body as string) ?? "{}");
    expect(body.amountAcp).toBe("1");
  });

  it("registerDevice posts snake_case payload to /mobile/devices/register", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ device_id: "dev-1", registered: true, message: "Device registered" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = new AcpApiClient({ baseUrl: "https://api.test", fetchImpl: mock });
    const result = await client.registerDevice({
      deviceToken: "token-123",
      platform: "android",
      appVersion: "1.0.0",
    });
    const [url, opts] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/mobile/devices/register");
    expect(JSON.parse(String(opts.body))).toEqual({
      device_token: "token-123",
      platform: "android",
      app_version: "1.0.0",
    });
    expect(result.registered).toBe(true);
  });

  it("unregisterDevice posts snake_case payload to /mobile/devices/unregister", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, message: "Device deactivated" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = new AcpApiClient({ baseUrl: "https://api.test", fetchImpl: mock });
    const result = await client.unregisterDevice("token-123");
    const [url, opts] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/mobile/devices/unregister");
    expect(JSON.parse(String(opts.body))).toEqual({ device_token: "token-123" });
    expect(result.ok).toBe(true);
  });

  it("listDevices calls /mobile/devices", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ devices: [{ device_id: "dev-1", platform: "ios", app_version: "1.0.0", is_active: true, last_seen_at: null, created_at: "2026-05-24T00:00:00Z" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = new AcpApiClient({ baseUrl: "https://api.test", fetchImpl: mock });
    const result = await client.listDevices();
    expect(mock).toHaveBeenCalledWith(
      "https://api.test/mobile/devices",
      expect.any(Object)
    );
    expect(result.devices).toHaveLength(1);
    expect(result.devices[0]?.device_id).toBe("dev-1");
  });

  it("explorerTxUrl builds correct URL from config", () => {
    const mock = vi.fn();
    const client = new AcpApiClient({ baseUrl: "https://api.test", fetchImpl: mock });
    const config = {
      minAppVersion: "1.0.0",
      maintenance: false,
      maintenanceMessage: null,
      acpDecimals: 8,
      wacpDecimals: 18,
      acpRpcStatus: "ok",
      bridgeStatus: "ok",
      bridgeEnabled: true,
      bridgePaused: false,
      bridgeReverseEnabled: false,
      wacpContract: "0x0",
      bscChainId: 56,
      acpRpcUrl: "https://rpc.test",
      bscRpcUrl: "https://bsc-dataseed.binance.org",
      acpExplorerTxBase: "https://ancap.cloud/acp/tx",
      bscExplorerBase: "https://bscscan.com",
      supportUrl: "https://ancap.cloud/support",
      docs: {
        bridge: "https://ancap.cloud/docs/bridge",
        risks: "https://ancap.cloud/docs/risks",
        reserve: "https://ancap.cloud/docs/reserve",
        contracts: "https://ancap.cloud/docs/contracts",
        walletSecurity: "https://ancap.cloud/security",
      },
    };
    expect(client.explorerTxUrl(config, "abc123")).toBe("https://ancap.cloud/acp/tx/abc123");
  });
});
