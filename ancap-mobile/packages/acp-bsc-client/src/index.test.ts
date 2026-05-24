import { describe, expect, it, vi } from "vitest";
import { fetchWacpBalanceWei, formatWacp, isValidBscAddress, WACP_DECIMALS } from "./index.js";

describe("WACP_DECIMALS", () => {
  it("equals 18", () => {
    expect(WACP_DECIMALS).toBe(18);
  });
});

describe("isValidBscAddress", () => {
  it("accepts valid BSC addresses", () => {
    expect(isValidBscAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F")).toBe(true);
    expect(isValidBscAddress("0x0000000000000000000000000000000000000001")).toBe(true);
  });

  it("rejects non-0x addresses", () => {
    expect(isValidBscAddress("1x71C7656EC7ab88b098defB751B7401B5f6d8976F")).toBe(false);
    expect(isValidBscAddress("")).toBe(false);
    expect(isValidBscAddress("71C7656EC7ab88b098defB751B7401B5f6d8976F")).toBe(false);
  });

  it("rejects wrong-length hex strings", () => {
    expect(isValidBscAddress("0x1234")).toBe(false);
    expect(isValidBscAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976")).toBe(false);
  });

  it("trims whitespace", () => {
    expect(isValidBscAddress("  0x71C7656EC7ab88b098defB751B7401B5f6d8976F  ")).toBe(true);
  });
});

describe("formatWacp", () => {
  it("formats 0", () => {
    expect(formatWacp(0n)).toBe("0");
  });

  it("formats whole numbers", () => {
    expect(formatWacp(1_000_000_000_000_000_000n)).toBe("1");
    expect(formatWacp(100n * 10n ** 18n)).toBe("100");
  });

  it("formats fractional amounts", () => {
    expect(formatWacp(1_500_000_000_000_000_000n)).toBe("1.5");
    expect(formatWacp(123n)).toBe("0.000000000000000123");
  });

  it("strips trailing zeros from fractional part", () => {
    expect(formatWacp(1_000_100_000_000_000_000n)).toBe("1.0001");
  });
});

describe("fetchWacpBalanceWei", () => {
  it("throws on invalid contract address", async () => {
    await expect(
      fetchWacpBalanceWei({ rpcUrl: "http://x", contract: "0x1", holder: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" })
    ).rejects.toThrow("Invalid BSC address");
  });

  it("throws on invalid holder address", async () => {
    await expect(
      fetchWacpBalanceWei({ rpcUrl: "http://x", contract: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", holder: "0x1" })
    ).rejects.toThrow("Invalid BSC address");
  });

  it("returns bigint from successful RPC response", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        result: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000", // 1e18 hex
      }), { status: 200 })
    );
    const result = await fetchWacpBalanceWei({
      rpcUrl: "https://bsc-dataseed.binance.org",
      contract: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      holder: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    expect(result).toBe(10n ** 18n);
  });

  it("throws when RPC returns no result", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1 }), { status: 200 })
    );
    await expect(
      fetchWacpBalanceWei({
        rpcUrl: "https://bsc-dataseed.binance.org",
        contract: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        holder: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        fetchImpl: mockFetch as unknown as typeof fetch,
      })
    ).rejects.toThrow("BSC RPC eth_call failed");
  });
});
