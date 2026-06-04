import { describe, expect, it } from "vitest";

import {
  canSubmitSmartPayRecoveryInput,
  formatSmartPayRecoveryRefPreview,
  getSmartPayRecoveryInputBlockReason,
  normalizeSmartPayRecoveryRef,
  normalizeSmartPayRecoveryToken,
  parseSmartPayRecoveryInput,
} from "./smart-pay-recovery";

describe("smart pay recovery helpers", () => {
  it("parses explorer links into structured recovery refs with inferred network", () => {
    expect(
      normalizeSmartPayRecoveryRef("https://bscscan.com/tx/demo_tx_abc123")
    ).toEqual({
      txid: "demo_tx_abc123",
      network: "bsc",
      explorerUrl: "https://bscscan.com/tx/demo_tx_abc123",
    });

    expect(
      normalizeSmartPayRecoveryRef("https://ancap.cloud/acp/transactions/tx-789")
    ).toEqual({
      txid: "tx-789",
      network: "acp",
      explorerUrl: "https://ancap.cloud/acp/transactions/tx-789",
    });
  });

  it("preserves raw tx hashes when no explorer metadata is available", () => {
    expect(normalizeSmartPayRecoveryRef("  demo_feedbeef  ")).toEqual({
      txid: "demo_feedbeef",
      network: null,
      explorerUrl: null,
    });
    expect(normalizeSmartPayRecoveryToken("  demo_feedbeef  ")).toBe("demo_feedbeef");
  });

  it("rejects structured locator noise that does not expose a tx id", () => {
    expect(normalizeSmartPayRecoveryRef("https://merchant.example/invoice/123")).toBeNull();
    expect(normalizeSmartPayRecoveryRef("merchant.example/pay?id=123")).toBeNull();
  });

  it("deduplicates recovery refs case-insensitively while keeping richer explorer metadata", () => {
    const parsed = parseSmartPayRecoveryInput(
      [
        "DEMO_TX_ABC123",
        "https://basescan.org/tx/demo_tx_abc123",
        "https://etherscan.io/tx/demo_tx_def456",
        "DEMO_TX_DEF456",
      ].join("\n")
    );

    expect(parsed.txids).toEqual(["demo_tx_abc123", "demo_tx_def456"]);
    expect(parsed.duplicateTokens).toEqual([
      "https://basescan.org/tx/demo_tx_abc123",
      "DEMO_TX_DEF456",
    ]);
    expect(parsed.invalidTokens).toEqual([]);
    expect(parsed.refs).toEqual([
      {
        txid: "demo_tx_abc123",
        network: "base",
        explorerUrl: "https://basescan.org/tx/demo_tx_abc123",
      },
      {
        txid: "demo_tx_def456",
        network: "ethereum",
        explorerUrl: "https://etherscan.io/tx/demo_tx_def456",
      },
    ]);
  });

  it("blocks submission when pasted recovery input only contains invalid structured noise", () => {
    const input = "https://merchant.example/invoice/123 https://merchant.example/pay?id=456";

    expect(canSubmitSmartPayRecoveryInput(input)).toBe(false);
    expect(getSmartPayRecoveryInputBlockReason(input)).toBe(
      "No valid tx hash or explorer link was parsed from this recovery input. Fix the pasted values or clear the field to run a status-only recovery pass."
    );
  });

  it("allows empty status-only passes and formats preview text for valid refs", () => {
    expect(canSubmitSmartPayRecoveryInput("   ")).toBe(true);
    expect(getSmartPayRecoveryInputBlockReason("   ")).toBeNull();
    expect(
      formatSmartPayRecoveryRefPreview({
        txid: "demo_tx_abc123",
        network: "base",
        explorerUrl: "https://basescan.org/tx/demo_tx_abc123",
      })
    ).toBe("BASE · demo_tx_abc123 · explorer link preserved");
  });
});
