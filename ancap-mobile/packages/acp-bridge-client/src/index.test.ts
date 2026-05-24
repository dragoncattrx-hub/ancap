import { describe, expect, it, vi } from "vitest";
import { AcpBridgeClient } from "./index.js";

describe("AcpBridgeClient", () => {
  it("getStatus calls /bridge/status", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ bridge_enabled: true, bridge_paused: false }), {
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
    expect(result.bridge_enabled).toBe(true);
  });

  it("getWacpStatus calls /bridge/wacp/status", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );
    const client = new AcpBridgeClient("https://api.test", mock as unknown as typeof fetch);
    await client.getWacpStatus();
    expect(mock).toHaveBeenCalledWith(
      "https://api.test/bridge/wacp/status",
      expect.any(Object)
    );
  });

  it("getReserveProof calls /bridge/wacp/reserve-proof", async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );
    const client = new AcpBridgeClient("https://api.test", mock as unknown as typeof fetch);
    await client.getReserveProof();
    expect(mock).toHaveBeenCalledWith(
      "https://api.test/bridge/wacp/reserve-proof",
      expect.any(Object)
    );
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
