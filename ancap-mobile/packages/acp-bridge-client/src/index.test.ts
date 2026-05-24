import { describe, expect, it, vi } from "vitest";
import { AcpBridgeClient } from "./index.js";

describe("AcpBridgeClient", () => {
  it("getStatus calls /bridge/status", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ bridge_rail_enabled: true, bridge_rail_paused: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = new AcpBridgeClient("https://api.test", mock as unknown as typeof fetch);
    const result = await client.getStatus();
    expect(mock).toHaveBeenCalledWith(
      "https://api.test/bridge/status",
      expect.objectContaining({ headers: expect.objectContaining({ "Content-Type": "application/json" }) })
    );
    expect(result.bridge_rail_enabled).toBe(true);
  });

  it("getWacpStatus calls /bridge/wacp/status", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "live" }), { status: 200 })
    );
    const client = new AcpBridgeClient("https://api.test", mock as unknown as typeof fetch);
    const result = await client.getWacpStatus();
    expect(mock).toHaveBeenCalledWith(
      "https://api.test/bridge/wacp/status",
      expect.any(Object)
    );
    expect(result.status).toBe("live");
  });

  it("getReserveProof calls /bridge/wacp/reserve-proof", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "healthy" }), { status: 200 })
    );
    const client = new AcpBridgeClient("https://api.test", mock as unknown as typeof fetch);
    const result = await client.getReserveProof();
    expect(mock).toHaveBeenCalledWith(
      "https://api.test/bridge/wacp/reserve-proof",
      expect.any(Object)
    );
    expect(result.status).toBe("healthy");
  });

  it("quoteBscToAcp posts snake_case payload", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ acp_amount_floor: "1" }), { status: 200 })
    );
    const client = new AcpBridgeClient("https://api.test", mock as unknown as typeof fetch);
    const result = await client.quoteBscToAcp("1.25");
    const [url, opts] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/bridge/quote/bsc-to-acp");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(String(opts.body))).toEqual({ amount_wacp: "1.25" });
    expect(result.acp_amount_floor).toBe("1");
  });

  it("createIntentAcpToBsc posts correct payload", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "intent-1", direction: "acp_to_bsc" }), { status: 200 })
    );
    const client = new AcpBridgeClient("https://api.test", mock as unknown as typeof fetch, "Bearer token123");
    const result = await client.createIntentAcpToBsc({
      userBscAddress: "0x1111111111111111111111111111111111111111",
      amountAcp: "2.5",
      userAcpAddress: "acp1test",
    });
    const [url, opts] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/bridge/intents/acp-to-bsc");
    expect(JSON.parse(String(opts.body))).toEqual({
      user_bsc_address: "0x1111111111111111111111111111111111111111",
      amount_acp: "2.5",
      user_acp_address: "acp1test",
    });
    expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer token123");
    expect(result.direction).toBe("acp_to_bsc");
  });

  it("createIntentBscToAcp posts correct payload", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "intent-2", direction: "bsc_to_acp" }), { status: 200 })
    );
    const client = new AcpBridgeClient("https://api.test", mock as unknown as typeof fetch, "Bearer token123");
    const result = await client.createIntentBscToAcp({
      userBscAddress: "0x2222222222222222222222222222222222222222",
      userAcpAddress: "acp1dest",
      amountWacp: "3.75",
    });
    const [url, opts] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/bridge/intents/bsc-to-acp");
    expect(JSON.parse(String(opts.body))).toEqual({
      user_bsc_address: "0x2222222222222222222222222222222222222222",
      user_acp_address: "acp1dest",
      amount_wacp: "3.75",
    });
    expect(result.direction).toBe("bsc_to_acp");
  });

  it("listMyIntents calls /bridge/intents/me with limit", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: "intent-1" }]), { status: 200 })
    );
    const client = new AcpBridgeClient("https://api.test", mock as unknown as typeof fetch, "Bearer token123");
    const result = await client.listMyIntents(25);
    expect(mock).toHaveBeenCalledWith(
      "https://api.test/bridge/intents/me?limit=25",
      expect.any(Object)
    );
    expect(result).toHaveLength(1);
  });

  it("throws on non-ok response", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response("Service Unavailable", { status: 503 })
    );
    const client = new AcpBridgeClient("https://api.test", mock as unknown as typeof fetch);
    await expect(client.getStatus()).rejects.toThrow("503");
  });

  it("attaches auth header when provided", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );
    const client = new AcpBridgeClient("https://api.test", mock as unknown as typeof fetch, "Bearer token123");
    await client.getStatus();
    const [, opts] = mock.mock.calls[0] as [string, RequestInit];
    expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer token123");
  });
});
