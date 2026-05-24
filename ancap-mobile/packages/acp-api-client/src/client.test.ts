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
