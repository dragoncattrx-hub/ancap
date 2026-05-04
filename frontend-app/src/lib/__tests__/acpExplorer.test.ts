import { describe, expect, it } from "vitest";
import { ACP_TX_FALLBACK_BASE, buildAcpTxHref, sanitizeAcpTxid } from "../acpExplorer";

describe("sanitizeAcpTxid", () => {
  it("removes wrapper brackets from pasted txids", () => {
    expect(sanitizeAcpTxid("<15d61ff66007c0190d5de98cf9128516a00a67cc7ac45b2a17c0dd9566f5fdf9>")).toBe(
      "15d61ff66007c0190d5de98cf9128516a00a67cc7ac45b2a17c0dd9566f5fdf9",
    );
    expect(sanitizeAcpTxid("[15d61ff66007c0190d5de98cf9128516a00a67cc7ac45b2a17c0dd9566f5fdf9]")).toBe(
      "15d61ff66007c0190d5de98cf9128516a00a67cc7ac45b2a17c0dd9566f5fdf9",
    );
  });

  it("preserves a normal txid", () => {
    const txid = "6c38d15141424819700e043fbd664826d37b0e0de14179a5f18906c2b3b4838e";
    expect(sanitizeAcpTxid(txid)).toBe(txid);
  });
});

describe("buildAcpTxHref", () => {
  it("uses the built-in fallback explorer when runtime base is empty", () => {
    expect(buildAcpTxHref("<abc123>", "")).toBe(`${ACP_TX_FALLBACK_BASE}/abc123`);
  });

  it("uses an explicit explorer base when provided", () => {
    expect(buildAcpTxHref("abc123", "https://ancap.cloud/acp/tx/")).toBe("https://ancap.cloud/acp/tx/abc123");
  });

  it("returns empty string when txid is empty", () => {
    expect(buildAcpTxHref("", "https://ancap.cloud/acp/tx")).toBe("");
  });
});
