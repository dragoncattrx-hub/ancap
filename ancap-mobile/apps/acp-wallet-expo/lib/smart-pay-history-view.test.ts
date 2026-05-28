import { describe, expect, it } from "vitest";
import type { SmartPayHistoryEntry } from "./smart-pay-history";
import {
  buildSmartPayHistorySections,
  formatSmartPayTimestamp,
  getSmartPayHistoryAmountLabel,
} from "./smart-pay-history-view";

function makeEntry(
  id: string,
  status: SmartPayHistoryEntry["execution"]["status"],
  overrides?: Partial<SmartPayHistoryEntry>
): SmartPayHistoryEntry {
  return {
    id: `exec-${id}`,
    savedAt: `2026-05-28T18:0${id}:00.000Z`,
    intent: {
      id: `intent-${id}`,
      createdAt: "2026-05-28T18:00:00.000Z",
      source: "paste",
      rawPayload: `acp:${id}`,
      payloadHash: `hash-${id}`,
      parseMethod: "deterministic",
      confidence: 1,
      status: "parsed",
      network: "acp",
      asset: {
        kind: "native",
        symbol: "ACP",
        name: "ACP",
        tokenAddress: null,
        decimals: 8,
        isSupported: true,
        isAllowlisted: true,
      },
      recipient: {
        address: `acp_test_${id}`,
        resolvedDisplay: null,
        addressType: "acp",
        checksumValid: null,
        ensOrAlias: null,
      },
      amount: {
        value: "15.0",
        atomicValue: "1500000000",
        currencySymbol: "ACP",
        isExact: true,
        isMax: false,
      },
      memo: null,
      merchant: null,
      riskFlags: [],
      warnings: [],
      unsupportedReasons: [],
      requiresUserConfirmation: true,
      metadata: {
        detectedStandard: "acp-uri",
        invoiceType: null,
        aiModel: null,
        aiUsed: false,
        parserVersion: "test",
      },
    },
    quote: {
      quoteId: `quote-${id}`,
      paymentIntentId: `intent-${id}`,
      mode: "direct_send",
      expiresAt: "2026-05-28T18:10:00.000Z",
      sourceAsset: {
        network: "acp",
        symbol: "ACP",
        tokenAddress: null,
        decimals: 8,
      },
      targetAsset: {
        network: "acp",
        symbol: "ACP",
        tokenAddress: null,
        decimals: 8,
      },
      targetAmount: "14.8",
      requiredSourceAmount: "15.0",
      serviceFeeAcp: "0.2",
      networkFee: [],
      slippageBps: 0,
      route: [],
      warnings: [],
      riskFlags: [],
    },
    execution: {
      id: `exec-${id}`,
      paymentIntentId: `intent-${id}`,
      quoteId: `quote-${id}`,
      status,
      createdAt: "2026-05-28T18:01:00.000Z",
      updatedAt: "2026-05-28T18:02:00.000Z",
      recoverable: status !== "completed",
      nextAction: status === "completed" ? null : "refresh_status",
      txRefs: [],
      error: status === "failed" ? "execution_failed" : null,
    },
    receipt: status === "completed"
      ? {
          id: `receipt-${id}`,
          paymentExecutionId: `exec-${id}`,
          paymentIntentId: `intent-${id}`,
          completedAt: "2026-05-28T18:02:00.000Z",
          sourceAssetSpent: "ACP",
          sourceAmountSpent: "15.0",
          targetAssetPaid: "ACP",
          targetAmountPaid: "14.8",
          serviceFeeAcp: "0.2",
          networkFees: [],
          recipientAddress: `acp_test_${id}`,
          merchantLabel: null,
          routeSummary: [],
          txRefs: [],
        }
      : null,
    ...overrides,
  };
}

describe("smart pay history view helpers", () => {
  it("groups entries by execution lifecycle for UI sections", () => {
    const sections = buildSmartPayHistorySections([
      makeEntry("1", "completed"),
      makeEntry("2", "pending_reconciliation"),
      makeEntry("3", "failed"),
    ]);

    expect(sections.map((section) => section.key)).toEqual([
      "in_flight",
      "needs_attention",
      "completed",
    ]);
    expect(sections[0]?.entries[0]?.execution.status).toBe("pending_reconciliation");
    expect(sections[1]?.entries[0]?.execution.status).toBe("failed");
    expect(sections[2]?.entries[0]?.execution.status).toBe("completed");
  });

  it("formats saved timestamps with stable UTC output", () => {
    expect(formatSmartPayTimestamp("2026-05-28T18:03:00.000Z")).toBe("2026-05-28 18:03 UTC");
    expect(formatSmartPayTimestamp("not-a-date")).toBe("not-a-date");
  });

  it("prefers receipt amount labels over quote or intent fallbacks", () => {
    expect(getSmartPayHistoryAmountLabel(makeEntry("1", "completed"))).toBe("14.8 ACP");

    const noReceipt = makeEntry("2", "pending_reconciliation", { receipt: null });
    expect(getSmartPayHistoryAmountLabel(noReceipt)).toBe("14.8 ACP");

    const noQuote = makeEntry("3", "failed", { receipt: null, quote: null });
    expect(getSmartPayHistoryAmountLabel(noQuote)).toBe("15.0 ACP");
  });
});
