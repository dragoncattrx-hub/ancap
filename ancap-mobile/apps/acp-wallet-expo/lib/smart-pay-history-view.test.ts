import { describe, expect, it } from "vitest";
import type { SmartPayHistoryEntry } from "./smart-pay-history";
import {
  buildSmartPayActiveHistoryEntry,
  buildSmartPayHistorySections,
  canSmartPayRefreshOrRecover,
  getSmartPayActiveExecutionView,
  formatSmartPayTimestamp,
  getSmartPayExecutionStatusLabel,
  getSmartPayHistoryAccessHint,
  getSmartPayHistoryAccessLabel,
  getSmartPayHistoryActionHint,
  getSmartPayHistoryActionLabel,
  getSmartPayHistoryAdditionalProofHint,
  getSmartPayHistoryAdditionalProofTxRefHint,
  getSmartPayHistoryAdditionalProofTxRefs,
  getSmartPayHistoryAmountLabel,
  getSmartPayHistoryFreshnessHint,
  getSmartPayHistoryFreshnessLabel,
  getSmartPayHistoryNetworkFeesHint,
  getSmartPayHistoryNetworkFeesLabel,
  getSmartPayHistoryReceiptDisplay,
  getSmartPayHistorySnapshotStatusLabel,
  getSmartPayHistorySnapshotTitle,
  getSmartPayHistoryPendingProofHint,
  getSmartPayHistoryProofHint,
  getSmartPayHistoryProofLabel,
  getSmartPayHistoryProofRouteSteps,
  getSmartPayHistoryProofTxRefs,
  getSmartPayHistoryProgressHint,
  getSmartPayHistoryProgressLabel,
  getSmartPayHistorySourceHint,
  getSmartPayHistorySourceLabel,
  getSmartPayRecoverHint,
  getSmartPayRefreshOrRecoverHint,
  hasSmartPayLiveSessionAccess,
  canSmartPayRecoverExecution,
} from "./smart-pay-history-view";
import {
  canSubmitSmartPayRecoveryInput,
  extractSmartPayRecoveryTxs,
  formatSmartPayRecoveryRefPreview,
  getSmartPayRecoveryInputBlockReason,
  normalizeSmartPayRecoveryToken,
  parseSmartPayRecoveryInput,
} from "./smart-pay-recovery";

function makeEntry(
  id: string,
  status: SmartPayHistoryEntry["execution"]["status"],
  overrides?: Partial<SmartPayHistoryEntry>
): SmartPayHistoryEntry {
  return {
    id: `exec-${id}`,
    savedAt: `2026-05-28T18:0${id}:00.000Z`,
    sessionToken: status === "completed" ? null : `session-${id}`,
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
  it("builds an active Smart Pay history entry from the current execution snapshot", () => {
    const base = makeEntry("14", "pending_reconciliation", {
      snapshotOrigin: "local+backend",
      savedAt: "2026-05-28T18:04:00.000Z",
    });

    expect(
      buildSmartPayActiveHistoryEntry({
        snapshotSavedAt: base.savedAt,
        intent: base.intent,
        quote: base.quote,
        execution: base.execution,
        receipt: base.receipt ?? null,
        sessionToken: base.sessionToken,
        snapshotOrigin: base.snapshotOrigin,
      })
    ).toEqual(base);
    expect(
      buildSmartPayActiveHistoryEntry({
        snapshotSavedAt: base.savedAt,
        intent: null,
        quote: base.quote,
        execution: base.execution,
        receipt: base.receipt ?? null,
        sessionToken: base.sessionToken,
        snapshotOrigin: base.snapshotOrigin,
      })
    ).toBeNull();
    expect(
      buildSmartPayActiveHistoryEntry({
        snapshotSavedAt: base.savedAt,
        intent: base.intent,
        quote: base.quote,
        execution: null,
        receipt: base.receipt ?? null,
        sessionToken: base.sessionToken,
        snapshotOrigin: base.snapshotOrigin,
      })
    ).toBeNull();
  });

  it("prefers merged active-history execution state over the raw in-memory execution snapshot", () => {
    const rawExecution = makeEntry("15-raw", "completed", {
      execution: {
        ...makeEntry("15-raw", "completed").execution,
        status: "completed",
        recoverable: false,
        nextAction: null,
        txRefs: [],
        progress: {
          totalRouteSteps: 1,
          observedTxCount: 1,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
      },
      receipt: null,
    }).execution;
    const mergedEntry = makeEntry("15-raw", "pending_reconciliation", {
      execution: {
        ...makeEntry("15-raw", "pending_reconciliation").execution,
        status: "pending_reconciliation",
        recoverable: true,
        nextAction: "refresh_status",
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "demo_bridge_proof",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_bridge_proof",
            routeStepIndex: 1,
          },
        ],
        progress: {
          totalRouteSteps: 2,
          observedTxCount: 1,
          remainingRouteSteps: 1,
          pendingRoles: ["swap"],
        },
      },
    });

    expect(getSmartPayActiveExecutionView(mergedEntry, rawExecution)).toEqual(mergedEntry.execution);
    expect(getSmartPayActiveExecutionView(null, rawExecution)).toEqual(rawExecution);
    expect(getSmartPayActiveExecutionView(null, null)).toBeNull();
  });

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

  it("formats execution statuses into user-facing labels", () => {
    expect(getSmartPayExecutionStatusLabel("awaiting_local_signature")).toBe("Awaiting local signature");
    expect(getSmartPayExecutionStatusLabel("pending_reconciliation")).toBe("Pending reconciliation");
    expect(getSmartPayExecutionStatusLabel("failed")).toBe("Needs attention");
    expect(getSmartPayExecutionStatusLabel("completed")).toBe("Completed");
  });

  it("prefers receipt amount labels over quote or intent fallbacks", () => {
    expect(getSmartPayHistoryAmountLabel(makeEntry("1", "completed"))).toBe("14.8 ACP");

    const noReceipt = makeEntry("2", "pending_reconciliation", { receipt: null });
    expect(getSmartPayHistoryAmountLabel(noReceipt)).toBe("14.8 ACP");

    const noQuote = makeEntry("3", "failed", { receipt: null, quote: null });
    expect(getSmartPayHistoryAmountLabel(noQuote)).toBe("15.0 ACP");
  });

  it("labels snapshot cards as receipt or execution snapshots depending on persisted data", () => {
    const receiptSnapshot = makeEntry("3-label", "completed");
    const executionSnapshot = makeEntry("4-label", "pending_reconciliation", { receipt: null });

    expect(getSmartPayHistorySnapshotTitle(receiptSnapshot)).toBe("Receipt snapshot");
    expect(getSmartPayHistorySnapshotStatusLabel(receiptSnapshot)).toBe("Receipt status");
    expect(getSmartPayHistorySnapshotTitle(executionSnapshot)).toBe("Execution snapshot");
    expect(getSmartPayHistorySnapshotStatusLabel(executionSnapshot)).toBe("Execution status");
  });

  it("builds receipt snapshot display fields from merged history context before falling back to quote or intent data", () => {
    const mergedReceipt = makeEntry("3-merged", "completed", {
      receipt: {
        ...makeEntry("3-merged", "completed").receipt!,
        completedAt: "2026-05-28T18:07:00.000Z",
        merchantLabel: "Merged merchant",
        routeSummary: ["1. bridge ACP -> wACP on acp", "2. swap wACP -> USDT on bsc"],
        networkFees: [
          {
            network: "acp",
            assetSymbol: "ACP",
            amount: "0.03",
          },
        ],
      },
    });

    expect(getSmartPayHistoryReceiptDisplay(mergedReceipt)).toEqual({
      recipientAddress: "acp_test_3-merged",
      sourceAsset: "ACP",
      sourceAmount: "15.0",
      targetAsset: "ACP",
      targetAmount: "14.8",
      serviceFeeAcp: "0.2",
      completedAt: "2026-05-28T18:07:00.000Z",
      merchantLabel: "Merged merchant",
      routeSummary: ["1. bridge ACP -> wACP on acp", "2. swap wACP -> USDT on bsc"],
      networkFees: [
        {
          network: "acp",
          assetSymbol: "ACP",
          amount: "0.03",
        },
      ],
      networkFeesSource: "receipt",
    });

    const quoteFallback = makeEntry("4-fallback", "pending_reconciliation", {
      quote: {
        ...makeEntry("4-fallback", "pending_reconciliation").quote!,
        route: [
          {
            kind: "swap",
            network: "bsc",
            dexOrRail: "pancakeswap",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "14.7",
          },
        ],
        networkFee: [
          {
            network: "bsc",
            assetSymbol: "BNB",
            amount: "0.001",
          },
        ],
      },
      receipt: null,
    });

    expect(getSmartPayHistoryReceiptDisplay(quoteFallback)).toEqual({
      recipientAddress: "acp_test_4-fallback",
      sourceAsset: "ACP",
      sourceAmount: "15.0",
      targetAsset: "ACP",
      targetAmount: "14.8",
      serviceFeeAcp: "0.2",
      completedAt: null,
      merchantLabel: null,
      routeSummary: ["Step 1: swap wACP → USDT via bsc via pancakeswap"],
      networkFees: [
        {
          network: "bsc",
          assetSymbol: "BNB",
          amount: "0.001",
        },
      ],
      networkFeesSource: "quote",
    });
  });

  it("labels receipt network fees separately from quote-estimated fees", () => {
    const receiptWithoutNetworkFees = makeEntry("5-no-fee", "completed", {
      receipt: {
        ...makeEntry("5-no-fee", "completed").receipt!,
        networkFees: [],
      },
    });

    expect(getSmartPayHistoryReceiptDisplay(receiptWithoutNetworkFees).networkFeesSource).toBe("none");
    expect(getSmartPayHistoryNetworkFeesLabel(getSmartPayHistoryReceiptDisplay(receiptWithoutNetworkFees))).toBe("Network fees");
    expect(getSmartPayHistoryNetworkFeesHint(getSmartPayHistoryReceiptDisplay(receiptWithoutNetworkFees))).toBeNull();

    const quoteEstimatedFees = makeEntry("6-estimated", "pending_reconciliation", {
      quote: {
        ...makeEntry("6-estimated", "pending_reconciliation").quote!,
        networkFee: [
          {
            network: "bsc",
            assetSymbol: "BNB",
            amount: "0.002",
          },
        ],
      },
      receipt: null,
    });

    expect(getSmartPayHistoryReceiptDisplay(quoteEstimatedFees).networkFeesSource).toBe("quote");
    expect(getSmartPayHistoryNetworkFeesLabel(getSmartPayHistoryReceiptDisplay(quoteEstimatedFees))).toBe("Estimated network fees");
    expect(getSmartPayHistoryNetworkFeesHint(getSmartPayHistoryReceiptDisplay(quoteEstimatedFees))).toBe(
      "Quoted fee estimates are shown until execution stores final receipt-side network fee values."
    );

    const receiptWithQuoteFallbackFees = makeEntry("7-fallback-fees", "completed", {
      quote: {
        ...makeEntry("7-fallback-fees", "completed").quote!,
        networkFee: [
          {
            network: "bsc",
            assetSymbol: "BNB",
            amount: "0.003",
          },
        ],
      },
      receipt: {
        ...makeEntry("7-fallback-fees", "completed").receipt!,
        networkFees: [],
      },
    });

    expect(getSmartPayHistoryReceiptDisplay(receiptWithQuoteFallbackFees).networkFeesSource).toBe("quote_fallback");
    expect(getSmartPayHistoryNetworkFeesLabel(getSmartPayHistoryReceiptDisplay(receiptWithQuoteFallbackFees))).toBe("Estimated network fees");
    expect(getSmartPayHistoryNetworkFeesHint(getSmartPayHistoryReceiptDisplay(receiptWithQuoteFallbackFees))).toBe(
      "This receipt snapshot does not yet include final network fee values, so quoted estimates are shown for context only."
    );
  });

  it("distinguishes local live resume, signed-in backend resume, and snapshot-only history", () => {
    const localLive = makeEntry("2", "pending_reconciliation", { snapshotOrigin: "local" });
    const backendOnly = makeEntry("1", "completed", { sessionToken: null, snapshotOrigin: "backend" });

    expect(hasSmartPayLiveSessionAccess(localLive)).toBe(true);
    expect(getSmartPayHistoryAccessLabel(localLive)).toBe("Live resume available on this device");
    expect(getSmartPayHistoryAccessHint(localLive)).toContain("Refresh and recovery can continue");

    expect(hasSmartPayLiveSessionAccess(backendOnly)).toBe(false);
    expect(getSmartPayHistoryAccessLabel(backendOnly)).toBe("Snapshot restored — auth or original device session required for live resume");
    expect(getSmartPayHistoryAccessHint(backendOnly)).toContain("If this device is signed into the same ANCAP account");
    expect(getSmartPayHistoryAccessHint(backendOnly)).toContain("otherwise only the saved snapshot is available");

    expect(getSmartPayHistoryAccessLabel(backendOnly, { hasAccountAuth: true })).toBe(
      "Backend resume available for signed-in ANCAP account"
    );
    expect(getSmartPayHistoryAccessHint(backendOnly, { hasAccountAuth: true })).toContain(
      "authenticated backend history on this signed-in device"
    );
  });

  it("allows refresh from a local session token or signed-in backend ownership, but gates recovery on recoverable state", () => {
    expect(canSmartPayRefreshOrRecover({ sessionToken: "session-123", hasAccountAuth: false })).toBe(true);
    expect(canSmartPayRefreshOrRecover({ sessionToken: null, hasAccountAuth: true })).toBe(true);
    expect(canSmartPayRefreshOrRecover({ sessionToken: null, hasAccountAuth: false })).toBe(false);

    expect(canSmartPayRecoverExecution({ sessionToken: "session-123", hasAccountAuth: false, recoverable: true })).toBe(true);
    expect(canSmartPayRecoverExecution({ sessionToken: null, hasAccountAuth: true, recoverable: true })).toBe(true);
    expect(canSmartPayRecoverExecution({ sessionToken: "session-123", hasAccountAuth: false, recoverable: false })).toBe(false);
    expect(canSmartPayRecoverExecution({ sessionToken: null, hasAccountAuth: true, recoverable: false })).toBe(false);
    expect(canSmartPayRecoverExecution({ sessionToken: null, hasAccountAuth: false, recoverable: true })).toBe(false);

    expect(getSmartPayRefreshOrRecoverHint({ sessionToken: "session-123", hasAccountAuth: false })).toContain(
      "original device-local session token"
    );
    expect(getSmartPayRefreshOrRecoverHint({ sessionToken: null, hasAccountAuth: true })).toContain(
      "signed-in ANCAP account can still refresh"
    );
    expect(getSmartPayRefreshOrRecoverHint({ sessionToken: null, hasAccountAuth: false })).toContain(
      "Anonymous refresh/recover requires the original device-local session token"
    );

    expect(getSmartPayRecoverHint({ sessionToken: "session-123", hasAccountAuth: false, recoverable: false })).toContain(
      "already in a final state"
    );
    expect(getSmartPayRecoverHint({ sessionToken: null, hasAccountAuth: false, recoverable: false })).toContain(
      "lacks the live session or backend access needed to refresh it"
    );
  });

  it("labels whether a history entry came from local storage, backend history, or a merged snapshot", () => {
    const localOnly = makeEntry("11", "pending_reconciliation", { snapshotOrigin: "local" });
    const backendOnly = makeEntry("12", "completed", { sessionToken: null, snapshotOrigin: "backend" });
    const merged = makeEntry("13", "completed", { snapshotOrigin: "local+backend" });

    expect(getSmartPayHistorySourceLabel(localOnly)).toBe("Device-local secure snapshot");
    expect(getSmartPayHistorySourceHint(localOnly)).toContain("stored only in secure device-local history");

    expect(getSmartPayHistorySourceLabel(backendOnly)).toBe("Authenticated backend history");
    expect(getSmartPayHistorySourceHint(backendOnly)).toContain("came from authenticated ANCAP backend payment history");

    expect(getSmartPayHistorySourceLabel(merged)).toBe("Merged local + backend snapshot");
    expect(getSmartPayHistorySourceHint(merged)).toContain("merges the device-local secure snapshot with authenticated backend payment history");
  });

  it("summarizes snapshot freshness for recent, stale, and auth-blocked restored history", () => {
    const recent = makeEntry("18", "pending_reconciliation", {
      savedAt: "2026-05-28T18:02:30.000Z",
      execution: {
        ...makeEntry("18", "pending_reconciliation").execution,
        updatedAt: "2026-05-28T18:02:30.000Z",
      },
      receipt: null,
    });
    const staleRecoverable = makeEntry("19", "pending_reconciliation", {
      savedAt: "2026-05-28T17:15:00.000Z",
      execution: {
        ...makeEntry("19", "pending_reconciliation").execution,
        updatedAt: "2026-05-28T17:15:00.000Z",
      },
      receipt: null,
    });
    const staleSnapshotOnly = makeEntry("20", "completed", {
      sessionToken: null,
      snapshotOrigin: "backend",
      savedAt: "2026-05-28T17:00:00.000Z",
      execution: {
        ...makeEntry("20", "completed").execution,
        updatedAt: "2026-05-28T17:00:00.000Z",
      },
      receipt: {
        ...makeEntry("20", "completed").receipt!,
        completedAt: "2026-05-28T17:00:00.000Z",
      },
    });

    const now = Date.parse("2026-05-28T18:03:00.000Z");

    expect(getSmartPayHistoryFreshnessLabel(recent, now)).toBe("Snapshot freshness: updated 30s ago");
    expect(getSmartPayHistoryFreshnessHint(recent, { hasAccountAuth: false }, now)).toContain(
      "saved execution snapshot is recent"
    );

    expect(getSmartPayHistoryFreshnessLabel(staleRecoverable, now)).toBe("Snapshot freshness: updated 48m ago");
    expect(getSmartPayHistoryFreshnessHint(staleRecoverable, { hasAccountAuth: false }, now)).toContain(
      "Refresh status or recover before relying on remaining route steps or proof coverage"
    );

    expect(getSmartPayHistoryFreshnessLabel(staleSnapshotOnly, now)).toBe("Snapshot freshness: updated 1h 3m ago");
    expect(getSmartPayHistoryFreshnessHint(staleSnapshotOnly, { hasAccountAuth: false }, now)).toContain(
      "cannot be refreshed anonymously from this device"
    );
    expect(getSmartPayHistoryFreshnessHint(staleSnapshotOnly, { hasAccountAuth: true }, now)).toContain(
      "Refresh status/receipt before relying on final proof coverage"
    );
  });

  it("uses the newest receipt completion timestamp when fresher receipt data exists, including backend-only snapshots", () => {
    const mergedReceiptSnapshot = makeEntry("20b", "completed", {
      sessionToken: null,
      snapshotOrigin: "local+backend",
      savedAt: "2026-05-28T17:00:00.000Z",
      execution: {
        ...makeEntry("20b", "completed").execution,
        updatedAt: "2026-05-28T17:00:00.000Z",
      },
      receipt: {
        ...makeEntry("20b", "completed").receipt!,
        completedAt: "2026-05-28T18:02:30.000Z",
      },
    });
    const backendReceiptSnapshot = makeEntry("20c", "completed", {
      sessionToken: null,
      snapshotOrigin: "backend",
      savedAt: "2026-05-28T17:00:00.000Z",
      execution: {
        ...makeEntry("20c", "completed").execution,
        updatedAt: "2026-05-28T17:00:00.000Z",
      },
      receipt: {
        ...makeEntry("20c", "completed").receipt!,
        completedAt: "2026-05-28T18:02:30.000Z",
      },
    });

    const now = Date.parse("2026-05-28T18:03:00.000Z");

    expect(getSmartPayHistoryFreshnessLabel(mergedReceiptSnapshot, now)).toBe(
      "Snapshot freshness: updated 30s ago"
    );
    expect(getSmartPayHistoryFreshnessHint(mergedReceiptSnapshot, { hasAccountAuth: true }, now)).toContain(
      "saved receipt/proof snapshot is recent"
    );
    expect(getSmartPayHistoryFreshnessLabel(backendReceiptSnapshot, now)).toBe(
      "Snapshot freshness: updated 30s ago"
    );
    expect(getSmartPayHistoryFreshnessHint(backendReceiptSnapshot, { hasAccountAuth: true }, now)).toContain(
      "saved receipt/proof snapshot is recent"
    );
  });

  it("prefers the freshest receipt timestamp when building the active on-screen history snapshot", () => {
    const base = makeEntry("20d", "completed", {
      savedAt: "2026-05-28T17:00:00.000Z",
      execution: {
        ...makeEntry("20d", "completed").execution,
        updatedAt: "2026-05-28T17:10:00.000Z",
      },
      receipt: {
        ...makeEntry("20d", "completed").receipt!,
        completedAt: "2026-05-28T18:02:30.000Z",
      },
    });

    const built = buildSmartPayActiveHistoryEntry({
      snapshotSavedAt: base.savedAt,
      intent: base.intent,
      quote: base.quote,
      execution: base.execution,
      receipt: base.receipt ?? null,
      sessionToken: base.sessionToken,
      snapshotOrigin: base.snapshotOrigin,
    });

    expect(built?.savedAt).toBe("2026-05-28T18:02:30.000Z");
  });

  it("summarizes whether a history snapshot can refresh, recover, or only restore static context", () => {
    const localRecoverable = makeEntry("15", "pending_reconciliation", {
      snapshotOrigin: "local",
    });
    const backendFinalized = makeEntry("16", "completed", {
      sessionToken: null,
      snapshotOrigin: "backend",
    });
    const snapshotOnly = makeEntry("17", "completed", {
      sessionToken: null,
      snapshotOrigin: "local",
    });

    expect(getSmartPayHistoryActionLabel(localRecoverable)).toBe("Refresh status + recover available");
    expect(getSmartPayHistoryActionHint(localRecoverable)).toContain(
      "original device-local session token"
    );

    expect(getSmartPayHistoryActionLabel(backendFinalized, { hasAccountAuth: true })).toBe(
      "Refresh status only"
    );
    expect(getSmartPayHistoryActionHint(backendFinalized, { hasAccountAuth: true })).toContain(
      "already in a final state"
    );

    expect(getSmartPayHistoryActionLabel(snapshotOnly)).toBe("Snapshot only");
    expect(getSmartPayHistoryActionHint(snapshotOnly)).toContain(
      "otherwise only the saved snapshot is available"
    );
  });

  it("formats route progress labels and hints for in-flight executions", () => {
    const inFlight = makeEntry("2", "pending_reconciliation", {
      execution: {
        ...makeEntry("2", "pending_reconciliation").execution,
        progress: {
          totalRouteSteps: 3,
          observedTxCount: 1,
          remainingRouteSteps: 2,
          pendingRoles: ["swap", "merchant_payout"],
        },
      },
    });

    expect(getSmartPayHistoryProgressLabel(inFlight)).toBe(
      "Route progress: 1/3 tx observed · 2 route steps remaining"
    );
    expect(getSmartPayHistoryProgressHint(inFlight)).toBe(
      "Route submitted; pending roles: swap → merchant_payout."
    );
  });

  it("falls back to receipt summary or tx refs when explicit route progress is absent", () => {
    const completed = makeEntry("1", "completed", {
      receipt: {
        ...makeEntry("1", "completed").receipt!,
        routeSummary: ["bridge", "swap"],
      },
    });
    const awaitingSignature = makeEntry("4", "awaiting_local_signature", {
      execution: {
        ...makeEntry("4", "awaiting_local_signature").execution,
        nextAction: "sign_swap_tx",
      },
      receipt: null,
    });

    expect(getSmartPayHistoryProgressLabel(completed)).toBe(
      "Receipt route summary: 2 steps recorded"
    );
    expect(getSmartPayHistoryProgressHint(completed)).toContain("Receipt snapshot completed at");
    expect(getSmartPayHistoryProgressLabel(awaitingSignature)).toBe(
      "Route progress: waiting for local signature"
    );
    expect(getSmartPayHistoryProgressHint(awaitingSignature)).toBe(
      "Waiting for sign swap tx before route progress can continue."
    );
  });

  it("summarizes route-linked proof coverage from receipt and execution tx refs", () => {
    const completed = makeEntry("5", "completed", {
      execution: {
        ...makeEntry("5", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "demo_bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_bridge",
          },
          {
            role: "swap",
            network: "bsc",
            txid: "demo_swap",
            explorerUrl: null,
          },
        ],
        progress: {
          totalRouteSteps: 3,
          observedTxCount: 2,
          remainingRouteSteps: 1,
          pendingRoles: ["merchant_payout"],
        },
      },
      receipt: {
        ...makeEntry("5", "completed").receipt!,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_pay",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_pay",
          },
        ],
        routeSummary: ["bridge", "swap", "merchant payout"],
      },
    });

    expect(getSmartPayHistoryProofLabel(completed)).toBe(
      "On-chain proof: 3/3 receipt route steps linked"
    );
    expect(getSmartPayHistoryProofHint(completed)).toBe(
      "Linked proof covers all stored receipt route steps; 2 explorer links available."
    );
  });

  it("deduplicates combined execution and receipt proof refs while keeping explorer-linked receipt refs", () => {
    const completed = makeEntry("7", "completed", {
      execution: {
        ...makeEntry("7", "completed").execution,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_pay",
            explorerUrl: null,
          },
          {
            role: "bridge",
            network: "acp",
            txid: "demo_bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_bridge",
          },
        ],
      },
      receipt: {
        ...makeEntry("7", "completed").receipt!,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_pay",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_pay",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofTxRefs(completed)).toEqual([
      {
        role: "payment",
        network: "acp",
        txid: "demo_pay",
        explorerUrl: "https://ancap.cloud/acp/tx/demo_pay",
      },
      {
        role: "bridge",
        network: "acp",
        txid: "demo_bridge",
        explorerUrl: "https://ancap.cloud/acp/tx/demo_bridge",
      },
    ]);
  });

  it("deduplicates proof refs case-insensitively while keeping the richer explorer-linked entry", () => {
    const completed = makeEntry("7b", "completed", {
      execution: {
        ...makeEntry("7b", "completed").execution,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_tx_abc123",
            explorerUrl: null,
          },
        ],
      },
      receipt: {
        ...makeEntry("7b", "completed").receipt!,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "DEMO_TX_ABC123",
            explorerUrl: "https://ancap.cloud/acp/tx/DEMO_TX_ABC123",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofTxRefs(completed)).toEqual([
      {
        role: "payment",
        network: "acp",
        txid: "DEMO_TX_ABC123",
        explorerUrl: "https://ancap.cloud/acp/tx/DEMO_TX_ABC123",
      },
    ]);
  });

  it("separates additional observed tx refs that do not map to the quoted route", () => {
    const routed = makeEntry("9", "completed", {
      quote: {
        ...makeEntry("9", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: null,
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
        ],
      },
      execution: {
        ...makeEntry("9", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "demo_bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_bridge",
          },
          {
            role: "refund",
            network: "acp",
            txid: "demo_refund",
            explorerUrl: null,
          },
        ],
      },
      receipt: {
        ...makeEntry("9", "completed").receipt!,
        routeSummary: ["1. bridge ACP -> wACP on acp"],
      },
    });

    expect(getSmartPayHistoryAdditionalProofTxRefs(routed)).toEqual([
      {
        role: "refund",
        network: "acp",
        txid: "demo_refund",
        explorerUrl: null,
      },
    ]);
    expect(getSmartPayHistoryAdditionalProofTxRefHint(routed, getSmartPayHistoryAdditionalProofTxRefs(routed)[0]!)).toBe(
      "refund on acp is stored separately because it does not map to any quoted route step yet."
    );
    expect(getSmartPayHistoryAdditionalProofHint(routed)).toBe(
      "Additional observed tx refs: refund on acp — refund on acp is stored separately because it does not map to any quoted route step yet."
    );
    expect(getSmartPayHistoryProofLabel(routed)).toBe("On-chain proof: 1/1 route steps linked");
    expect(getSmartPayHistoryProofHint(routed)).toBe(
      "Linked proof covers all quoted route steps; 1 explorer link available. 1 additional tx ref is stored separately because it does not map to a quoted route step yet."
    );
  });

  it("does not count additional unmatched explorer links as quoted-route proof coverage", () => {
    const routed = makeEntry("11", "completed", {
      quote: {
        ...makeEntry("11", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: null,
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
        ],
      },
      execution: {
        ...makeEntry("11", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "demo_bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_bridge",
          },
          {
            role: "refund",
            network: "acp",
            txid: "demo_refund",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_refund",
          },
        ],
      },
      receipt: {
        ...makeEntry("11", "completed").receipt!,
        routeSummary: ["1. bridge ACP -> wACP on acp"],
      },
    });

    expect(getSmartPayHistoryProofLabel(routed)).toBe("On-chain proof: 1/1 route steps linked");
    expect(getSmartPayHistoryProofHint(routed)).toBe(
      "Linked proof covers all quoted route steps; 1 explorer link available. 1 additional tx ref is stored separately because it does not map to a quoted route step yet."
    );
  });

  it("maps quoted route steps to linked or pending proof refs for receipt rendering", () => {
    const routed = makeEntry("8", "pending_reconciliation", {
      quote: {
        ...makeEntry("8", "pending_reconciliation").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: null,
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
          {
            kind: "swap",
            network: "bsc",
            dexOrRail: "pancakeswap",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "2.5",
          },
          {
            kind: "transfer",
            network: "bsc",
            dexOrRail: null,
            fromAsset: "USDT",
            toAsset: "USDT",
            estimatedOut: "2.5",
          },
        ],
      },
      execution: {
        ...makeEntry("8", "pending_reconciliation").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "demo_bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_bridge",
          },
        ],
      },
      receipt: {
        ...makeEntry("8", "pending_reconciliation").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "demo_bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_bridge",
          },
        ],
        routeSummary: ["1. bridge ACP -> wACP on acp", "2. swap wACP -> USDT on bsc", "3. transfer USDT -> USDT on bsc"],
      },
    });

    expect(getSmartPayHistoryProofRouteSteps(routed)).toEqual([
      {
        key: "bridge|acp|1",
        stepIndex: 1,
        role: "bridge",
        network: "acp",
        kind: "bridge",
        fromAsset: "ACP",
        toAsset: "wACP",
        label: "Step 1: bridge ACP → wACP via acp",
        status: "linked",
        txRef: {
          role: "bridge",
          network: "acp",
          txid: "demo_bridge",
          explorerUrl: "https://ancap.cloud/acp/tx/demo_bridge",
        },
      },
      {
        key: "swap|bsc|2",
        stepIndex: 2,
        role: "swap",
        network: "bsc",
        kind: "swap",
        fromAsset: "wACP",
        toAsset: "USDT",
        label: "Step 2: swap wACP → USDT via bsc via pancakeswap",
        status: "pending",
        txRef: null,
      },
      {
        key: "merchant_payout|bsc|3",
        stepIndex: 3,
        role: "merchant_payout",
        network: "bsc",
        kind: "transfer",
        fromAsset: "USDT",
        toAsset: "USDT",
        label: "Step 3: transfer USDT → USDT via bsc",
        status: "pending",
        txRef: null,
      },
    ]);
    expect(getSmartPayHistoryPendingProofHint(routed)).toBe(
      "Pending quoted route proof (2 steps): step 2 swap wACP → USDT via bsc via pancakeswap → step 3 transfer USDT → USDT via bsc (merchant payout)."
    );
  });

  it("does not reuse one tx ref across multiple quoted route steps with the same role and network", () => {
    const routed = makeEntry("10", "pending_reconciliation", {
      quote: {
        ...makeEntry("10", "pending_reconciliation").quote!,
        route: [
          {
            kind: "swap",
            network: "bsc",
            dexOrRail: "pancakeswap",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "5.0",
          },
          {
            kind: "swap",
            network: "bsc",
            dexOrRail: "1inch",
            fromAsset: "USDT",
            toAsset: "USDC",
            estimatedOut: "4.9",
          },
        ],
      },
      execution: {
        ...makeEntry("10", "pending_reconciliation").execution,
        txRefs: [
          {
            role: "swap",
            network: "bsc",
            txid: "demo_first",
            explorerUrl: "https://bscscan.com/tx/demo_first",
          },
        ],
      },
      receipt: {
        ...makeEntry("10", "pending_reconciliation").receipt!,
        txRefs: [
          {
            role: "swap",
            network: "bsc",
            txid: "demo_first",
            explorerUrl: "https://bscscan.com/tx/demo_first",
          },
        ],
        routeSummary: [
          "1. swap wACP -> USDT on bsc",
          "2. swap USDT -> USDC on bsc",
        ],
      },
    });

    expect(getSmartPayHistoryProofRouteSteps(routed)).toEqual([
      {
        key: "swap|bsc|1",
        stepIndex: 1,
        role: "swap",
        network: "bsc",
        kind: "swap",
        fromAsset: "wACP",
        toAsset: "USDT",
        label: "Step 1: swap wACP → USDT via bsc via pancakeswap",
        status: "linked",
        txRef: {
          role: "swap",
          network: "bsc",
          txid: "demo_first",
          explorerUrl: "https://bscscan.com/tx/demo_first",
        },
      },
      {
        key: "swap|bsc|2",
        stepIndex: 2,
        role: "swap",
        network: "bsc",
        kind: "swap",
        fromAsset: "USDT",
        toAsset: "USDC",
        label: "Step 2: swap USDT → USDC via bsc via 1inch",
        status: "pending",
        txRef: null,
      },
    ]);
  });

  it("prefers explicit routeStepIndex linkage when the same role/network appears multiple times", () => {
    const routed = makeEntry("21", "pending_reconciliation", {
      quote: {
        ...makeEntry("21", "pending_reconciliation").quote!,
        route: [
          {
            kind: "swap",
            network: "bsc",
            dexOrRail: "pancakeswap",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "5.0",
          },
          {
            kind: "swap",
            network: "bsc",
            dexOrRail: "1inch",
            fromAsset: "USDT",
            toAsset: "USDC",
            estimatedOut: "4.9",
          },
        ],
      },
      execution: {
        ...makeEntry("21", "pending_reconciliation").execution,
        txRefs: [
          {
            role: "swap",
            network: "bsc",
            txid: "demo_second",
            explorerUrl: "https://bscscan.com/tx/demo_second",
            routeStepIndex: 2,
          },
        ],
      },
      receipt: {
        ...makeEntry("21", "pending_reconciliation").receipt!,
        txRefs: [
          {
            role: "swap",
            network: "bsc",
            txid: "demo_second",
            explorerUrl: "https://bscscan.com/tx/demo_second",
            routeStepIndex: 2,
          },
        ],
        routeSummary: [
          "1. swap wACP -> USDT on bsc",
          "2. swap USDT -> USDC on bsc",
        ],
      },
    });

    expect(getSmartPayHistoryProofRouteSteps(routed)).toEqual([
      {
        key: "swap|bsc|1",
        stepIndex: 1,
        role: "swap",
        network: "bsc",
        kind: "swap",
        fromAsset: "wACP",
        toAsset: "USDT",
        label: "Step 1: swap wACP → USDT via bsc via pancakeswap",
        status: "pending",
        txRef: null,
      },
      {
        key: "swap|bsc|2",
        stepIndex: 2,
        role: "swap",
        network: "bsc",
        kind: "swap",
        fromAsset: "USDT",
        toAsset: "USDC",
        label: "Step 2: swap USDT → USDC via bsc via 1inch",
        status: "linked",
        txRef: {
          role: "swap",
          network: "bsc",
          txid: "demo_second",
          explorerUrl: "https://bscscan.com/tx/demo_second",
          routeStepIndex: 2,
        },
      },
    ]);
  });

  it("ignores mismatched explicit routeStepIndex refs when role or network conflict with the quoted step", () => {
    const routed = makeEntry("22", "pending_reconciliation", {
      quote: {
        ...makeEntry("22", "pending_reconciliation").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "5.0",
          },
          {
            kind: "swap",
            network: "bsc",
            dexOrRail: "pancakeswap",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "4.9",
          },
        ],
      },
      execution: {
        ...makeEntry("22", "pending_reconciliation").execution,
        txRefs: [
          {
            role: "merchant_payout",
            network: "bsc",
            txid: "demo_wrong_step",
            explorerUrl: "https://bscscan.com/tx/demo_wrong_step",
            routeStepIndex: 1,
          },
        ],
      },
      receipt: {
        ...makeEntry("22", "pending_reconciliation").receipt!,
        txRefs: [
          {
            role: "merchant_payout",
            network: "bsc",
            txid: "demo_wrong_step",
            explorerUrl: "https://bscscan.com/tx/demo_wrong_step",
            routeStepIndex: 1,
          },
        ],
        routeSummary: [
          "1. bridge ACP -> wACP on acp via ancap_bridge_v1",
          "2. swap wACP -> USDT on bsc via pancakeswap",
        ],
      },
    });

    expect(getSmartPayHistoryProofRouteSteps(routed)).toEqual([
      {
        key: "bridge|acp|1",
        stepIndex: 1,
        role: "bridge",
        network: "acp",
        kind: "bridge",
        fromAsset: "ACP",
        toAsset: "wACP",
        label: "Step 1: bridge ACP → wACP via acp via ancap_bridge_v1",
        status: "pending",
        txRef: null,
      },
      {
        key: "swap|bsc|2",
        stepIndex: 2,
        role: "swap",
        network: "bsc",
        kind: "swap",
        fromAsset: "wACP",
        toAsset: "USDT",
        label: "Step 2: swap wACP → USDT via bsc via pancakeswap",
        status: "pending",
        txRef: null,
      },
    ]);

    expect(getSmartPayHistoryAdditionalProofTxRefs(routed)).toEqual([
      {
        role: "merchant_payout",
        network: "bsc",
        txid: "demo_wrong_step",
        explorerUrl: "https://bscscan.com/tx/demo_wrong_step",
        routeStepIndex: 1,
      },
    ]);
    expect(getSmartPayHistoryAdditionalProofTxRefHint(routed, getSmartPayHistoryAdditionalProofTxRefs(routed)[0]!)).toBe(
      "Claims quoted route step 1, but that step expects bridge on acp via ancap_bridge_v1."
    );
    expect(getSmartPayHistoryAdditionalProofHint(routed)).toBe(
      "Additional observed tx refs: merchant_payout on bsc — Claims quoted route step 1, but that step expects bridge on acp via ancap_bridge_v1."
    );
  });

  it("returns null pending-proof hint when there is no quoted route or all quoted steps are linked", () => {
    const noQuotedRoute = makeEntry("12", "completed", {
      execution: {
        ...makeEntry("12", "completed").execution,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_pay",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_pay",
          },
        ],
      },
      receipt: {
        ...makeEntry("12", "completed").receipt!,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_pay",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_pay",
          },
        ],
      },
    });

    const fullyLinkedRoute = makeEntry("13", "completed", {
      quote: {
        ...makeEntry("13", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: null,
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
        ],
      },
      execution: {
        ...makeEntry("13", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "demo_bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_bridge",
          },
        ],
      },
      receipt: {
        ...makeEntry("13", "completed").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "demo_bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_bridge",
          },
        ],
      },
    });

    expect(getSmartPayHistoryPendingProofHint(noQuotedRoute)).toBeNull();
    expect(getSmartPayHistoryPendingProofHint(fullyLinkedRoute)).toBeNull();
  });

  it("keeps quoted-route proof coverage visible when a receipt snapshot exists without linked tx refs yet", () => {
    const routeSnapshotOnly = makeEntry("6", "completed", {
      execution: {
        ...makeEntry("6", "completed").execution,
        txRefs: [],
      },
      quote: {
        ...makeEntry("6", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: null,
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
          {
            kind: "swap",
            network: "bsc",
            dexOrRail: "ancap_router_v1",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "2.5",
          },
          {
            kind: "transfer",
            network: "bsc",
            dexOrRail: null,
            fromAsset: "USDT",
            toAsset: "USDT",
            estimatedOut: "2.5",
          },
        ],
      },
      receipt: {
        ...makeEntry("6", "completed").receipt!,
        txRefs: [],
        routeSummary: [
          "1. bridge ACP -> wACP on acp",
          "2. swap wACP -> USDT on bsc",
          "3. transfer USDT -> USDT on bsc",
        ],
      },
    });

    expect(getSmartPayHistoryProofLabel(routeSnapshotOnly)).toBe(
      "On-chain proof: 0/3 route steps linked"
    );
    expect(getSmartPayHistoryProofHint(routeSnapshotOnly)).toBe(
      "Receipt data is stored, but 0/3 route steps are linked to tx proof refs so far."
    );
    expect(getSmartPayHistoryPendingProofHint(routeSnapshotOnly)).toBe(
      "Pending quoted route proof (3 steps): step 1 bridge ACP → wACP via acp → step 2 swap wACP → USDT via bsc via ancap_router_v1 → step 3 transfer USDT → USDT via bsc (merchant payout)."
    );
  });

  it("still explains when receipt snapshots exist without linked proof refs yet and no quoted route is available", () => {
    const snapshotOnly = makeEntry("16", "completed", {
      execution: {
        ...makeEntry("16", "completed").execution,
        txRefs: [],
      },
      quote: {
        ...makeEntry("16", "completed").quote!,
        route: [],
      },
      receipt: {
        ...makeEntry("16", "completed").receipt!,
        txRefs: [],
        routeSummary: [],
      },
    });

    expect(getSmartPayHistoryProofLabel(snapshotOnly)).toBe(
      "On-chain proof: receipt snapshot saved; tx links pending"
    );
    expect(getSmartPayHistoryProofHint(snapshotOnly)).toBe(
      "Receipt data is stored, but no route-linked tx proof refs are attached yet."
    );
  });

  it("falls back to tx-reference proof labels when there is no quoted route", () => {
    const linkedWithoutRoute = makeEntry("18", "completed", {
      quote: {
        ...makeEntry("18", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("18", "completed").execution,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_proof18",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_proof18",
          },
        ],
      },
      receipt: {
        ...makeEntry("18", "completed").receipt!,
        routeSummary: [],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_proof18",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_proof18",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofLabel(linkedWithoutRoute)).toBe(
      "On-chain proof: 1 tx reference linked"
    );
    expect(getSmartPayHistoryProofHint(linkedWithoutRoute)).toBe(
      "Linked proof refs are available for 1 explorer link and can be opened from the receipt view."
    );
  });

  it("does not let extra unmatched tx refs inflate fallback proof coverage without a quoted route", () => {
    const snapshotWithExtraRef = makeEntry("19", "completed", {
      quote: {
        ...makeEntry("19", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("19", "completed").execution,
        progress: {
          totalRouteSteps: 1,
          observedTxCount: 1,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_proof19",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_proof19",
          },
          {
            role: "refund",
            network: "acp",
            txid: "demo_refund19",
            explorerUrl: null,
          },
        ],
      },
      receipt: {
        ...makeEntry("19", "completed").receipt!,
        routeSummary: [],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_proof19",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_proof19",
          },
          {
            role: "refund",
            network: "acp",
            txid: "demo_refund19",
            explorerUrl: null,
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofLabel(snapshotWithExtraRef)).toBe(
      "On-chain proof: 2 tx references linked"
    );
    expect(getSmartPayHistoryProofHint(snapshotWithExtraRef)).toBe(
      "Linked proof refs are available for 1 explorer link and can be opened from the receipt view."
    );
  });

  it("caps receipt-summary proof coverage when no quoted route exists so extra tx refs do not inflate linked steps", () => {
    const receiptSummaryOnly = makeEntry("20", "completed", {
      quote: {
        ...makeEntry("20", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("20", "completed").execution,
        progress: {
          totalRouteSteps: 1,
          observedTxCount: 1,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_proof20",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_proof20",
          },
          {
            role: "refund",
            network: "acp",
            txid: "demo_refund20",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_refund20",
          },
        ],
      },
      receipt: {
        ...makeEntry("20", "completed").receipt!,
        routeSummary: ["1. transfer ACP -> ACP on acp"],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_proof20",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_proof20",
          },
          {
            role: "refund",
            network: "acp",
            txid: "demo_refund20",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_refund20",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofLabel(receiptSummaryOnly)).toBe(
      "On-chain proof: 1/1 receipt route steps linked"
    );
    expect(getSmartPayHistoryProofHint(receiptSummaryOnly)).toBe(
      "Linked proof covers all stored receipt route steps; 1 explorer link available."
    );
  });

  it("labels receipt-summary-only proof coverage as stored receipt context instead of quoted-route proof", () => {
    const receiptSummaryOnly = makeEntry("20b", "completed", {
      quote: {
        ...makeEntry("20b", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("20b", "completed").execution,
        progress: {
          totalRouteSteps: 2,
          observedTxCount: 1,
          remainingRouteSteps: 1,
          pendingRoles: [],
        },
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_proof20b",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_proof20b",
          },
        ],
      },
      receipt: {
        ...makeEntry("20b", "completed").receipt!,
        routeSummary: [
          "1. transfer ACP -> ACP on acp",
          "2. receipt-side fee/refund summary",
        ],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_proof20b",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_proof20b",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofLabel(receiptSummaryOnly)).toBe(
      "On-chain proof: 1/2 receipt route steps linked"
    );
    expect(getSmartPayHistoryProofHint(receiptSummaryOnly)).toBe(
      "Linked proof currently covers 1/2 stored receipt route steps; 1 explorer link available."
    );
  });

  it("does not treat receipt-only refund rows as route-proof coverage when no quoted route is available", () => {
    const receiptSummaryWithRefund = makeEntry("20c", "completed", {
      quote: {
        ...makeEntry("20c", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("20c", "completed").execution,
        progress: {
          totalRouteSteps: 1,
          observedTxCount: 1,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_proof20c",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_proof20c",
          },
          {
            role: "refund",
            network: "acp",
            txid: "demo_refund20c",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_refund20c",
          },
        ],
      },
      receipt: {
        ...makeEntry("20c", "completed").receipt!,
        routeSummary: ["1. transfer ACP -> ACP on acp"],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "demo_proof20c",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_proof20c",
          },
          {
            role: "refund",
            network: "acp",
            txid: "demo_refund20c",
            explorerUrl: "https://ancap.cloud/acp/tx/demo_refund20c",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofLabel(receiptSummaryWithRefund)).toBe(
      "On-chain proof: 1/1 receipt route steps linked"
    );
    expect(getSmartPayHistoryProofHint(receiptSummaryWithRefund)).toBe(
      "Linked proof covers all stored receipt route steps; 1 explorer link available."
    );
  });

  it("explains recoverable in-flight snapshots can use tx hashes or explorer links", () => {
    const pendingWithoutRefs = makeEntry("14", "pending_reconciliation", {
      execution: {
        ...makeEntry("14", "pending_reconciliation").execution,
        txRefs: [],
      },
      receipt: null,
    });

    expect(getSmartPayHistoryProofHint(pendingWithoutRefs)).toBe(
      "Refresh this session or recover with observed tx hashes/explorer links after route activity to attach tx proof refs."
    );
  });

  it("normalizes recovery tx inputs from explorer links and de-duplicates them", () => {
    expect(normalizeSmartPayRecoveryToken(" https://bscscan.com/tx/demo_tx_abc123 ")).toBe("demo_tx_abc123");
    expect(normalizeSmartPayRecoveryToken("https://ancap.cloud/acp/tx/demo_tx_def456?foo=bar")).toBe("demo_tx_def456");
    expect(normalizeSmartPayRecoveryToken("https://ancap.cloud/acp/transactions/demo_route_proof?source=wallet")).toBe("demo_route_proof");
    expect(normalizeSmartPayRecoveryToken("https://example.com/?txHash=demo_feedbeef")).toBe("demo_feedbeef");
    expect(normalizeSmartPayRecoveryToken("demo_raw_tx")).toBe("demo_raw_tx");

    expect(
      extractSmartPayRecoveryTxs(
        "demo_raw_tx\nhttps://bscscan.com/tx/demo_tx_abc123, https://example.com/?txHash=demo_feedbeef demo_raw_tx"
      )
    ).toEqual(["demo_raw_tx", "demo_tx_abc123", "demo_feedbeef"]);

    expect(
      parseSmartPayRecoveryInput(
        "demo_raw_tx\nhttps://bscscan.com/tx/demo_tx_abc123, https://ancap.cloud/acp/transactions/demo_route_proof?source=wallet https://example.com/?txHash=demo_feedbeef demo_raw_tx"
      ).refs
    ).toEqual([
      {
        txid: "demo_raw_tx",
        network: null,
        explorerUrl: null,
      },
      {
        txid: "demo_tx_abc123",
        network: "bsc",
        explorerUrl: "https://bscscan.com/tx/demo_tx_abc123",
      },
      {
        txid: "demo_route_proof",
        network: "acp",
        explorerUrl: "https://ancap.cloud/acp/transactions/demo_route_proof?source=wallet",
      },
      {
        txid: "demo_feedbeef",
        network: null,
        explorerUrl: "https://example.com/?txHash=demo_feedbeef",
      },
    ]);
  });

  it("ignores unparseable recovery locator noise while surfacing duplicates and invalid tokens", () => {
    expect(normalizeSmartPayRecoveryToken("bscscan.com/tx/demo_tx_abc123")).toBe("demo_tx_abc123");
    expect(normalizeSmartPayRecoveryToken("example.com/not-a-tx")).toBeNull();
    expect(normalizeSmartPayRecoveryToken("https://example.com/not-a-tx")).toBeNull();

    expect(
      parseSmartPayRecoveryInput(
        "demo_raw_tx bscscan.com/tx/demo_tx_abc123 https://example.com/not-a-tx DEMO_RAW_TX"
      )
    ).toEqual({
      refs: [
        {
          txid: "demo_raw_tx",
          network: null,
          explorerUrl: null,
        },
        {
          txid: "demo_tx_abc123",
          network: "bsc",
          explorerUrl: "https://bscscan.com/tx/demo_tx_abc123",
        },
      ],
      txids: ["demo_raw_tx", "demo_tx_abc123"],
      duplicateTokens: ["DEMO_RAW_TX"],
      invalidTokens: ["https://example.com/not-a-tx"],
    });
  });

  it("formats parsed recovery refs for UI preview so users can see preserved network/link metadata", () => {
    expect(
      formatSmartPayRecoveryRefPreview({
        txid: "demo_tx_abc123",
        network: "bsc",
        explorerUrl: "https://bscscan.com/tx/demo_tx_abc123",
      })
    ).toBe("BSC · demo_tx_abc123 · explorer link preserved");

    expect(
      formatSmartPayRecoveryRefPreview({
        txid: "demo_raw_tx",
        network: null,
        explorerUrl: null,
      })
    ).toBe("Unspecified network · demo_raw_tx · raw tx hash only");
  });

  it("allows status-only recover with empty input but blocks recover submissions when only invalid locator noise is pasted", () => {
    expect(canSubmitSmartPayRecoveryInput("")).toBe(true);
    expect(canSubmitSmartPayRecoveryInput("   ")).toBe(true);
    expect(getSmartPayRecoveryInputBlockReason("")).toBeNull();

    expect(canSubmitSmartPayRecoveryInput("demo_raw_tx https://example.com/not-a-tx")).toBe(true);
    expect(getSmartPayRecoveryInputBlockReason("demo_raw_tx https://example.com/not-a-tx")).toBeNull();

    expect(canSubmitSmartPayRecoveryInput("https://example.com/not-a-tx badorigin/tx/not-real")).toBe(false);
    expect(
      getSmartPayRecoveryInputBlockReason("https://example.com/not-a-tx badorigin/tx/not-real")
    ).toBe(
      "No valid tx hash or explorer link was parsed from this recovery input. Fix the pasted values or clear the field to run a status-only recovery pass."
    );
  });
});
