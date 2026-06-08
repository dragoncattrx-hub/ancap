import { describe, expect, it } from "vitest";
import type { SmartPayHistoryEntry } from "./smart-pay-history";
import {
  buildSmartPayActiveHistoryEntry,
  buildSmartPayHistorySections,
  canSmartPayRefreshOrRecover,
  getSmartPayActiveExecutionTxRefs,
  getSmartPayActiveExecutionView,
  formatSmartPayTimestamp,
  formatSmartPayRouteStepIndexLabel,
  formatSmartPayTxRefLabel,
  getSmartPayExecutionStatusLabel,
  getSmartPayHistoryAccessHint,
  getSmartPayHistoryAccessLabel,
  getSmartPayHistoryActionHint,
  getSmartPayHistoryActionLabel,
  getSmartPayHistoryRestoreHint,
  getSmartPayHistoryAdditionalProofHint,
  getSmartPayHistoryAdditionalProofProvenanceHint,
  getSmartPayHistoryAdditionalProofProvenanceLabel,
  getSmartPayHistoryNextStepHint,
  getSmartPayHistoryNextStepLabel,
  getSmartPayHistoryAdditionalProofTxRefHint,
  getSmartPayHistoryProofTxRefHint,
  getSmartPayHistoryAdditionalProofTxRefs,
  getSmartPayHistoryAmountLabel,
  getSmartPayHistoryFreshnessHint,
  getSmartPayHistoryFreshnessLabel,
  getSmartPayHistoryRefreshButtonLabel,
  getSmartPayHistoryMerchantHint,
  getSmartPayHistoryNetworkFeesHint,
  getSmartPayHistoryNetworkFeesLabel,
  getSmartPayHistoryReceiptDisplay,
  getSmartPayHistorySnapshotStatusLabel,
  getSmartPayHistorySnapshotTitle,
  getSmartPayHistoryPendingProofHint,
  getSmartPayHistoryProofEmptyStateHint,
  getSmartPayHistoryProofHint,
  getSmartPayHistoryProofLabel,
  getSmartPayHistoryProofProvenanceHint,
  getSmartPayHistoryProofProvenanceLabel,
  getSmartPayHistoryProofSyncHint,
  getSmartPayHistoryProofSyncLabel,
  getSmartPayHistoryRecoverButtonLabel,
  getSmartPayHistoryRecoveryInputHint,
  getSmartPayHistoryRecoveryInputLabel,
  getSmartPayHistoryProofQualityHint,
  getSmartPayHistoryProofQualityLabel,
  getSmartPayHistoryProofRouteDetailHint,
  getSmartPayHistoryProofRouteDetailLabel,
  getSmartPayHistoryProofRouteStepHint,
  getSmartPayHistoryProofRouteSteps,
  getSmartPayHistoryProofTxRefs,
  getSmartPayHistoryTxRefStorageHint,
  getSmartPayHistoryExecutionProgressDetailLines,
  getSmartPayHistoryExecutionProgressDisplayLines,
  getSmartPayHistoryProgressHint,
  getSmartPayHistoryProgressLabel,
  getSmartPayHistorySourceHint,
  getSmartPayHistorySourceLabel,
  getSmartPayRecoverHint,
  getSmartPayRefreshOrRecoverHint,
  hasSmartPayLiveSessionAccess,
  canSmartPayRecoverExecution,
  resolveSmartPayExecutionSessionToken,
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
            txid: "fixture-bridge-proof-link",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-bridge-proof-link",
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

  it("prefers merged proof refs for the active execution panel when history is richer than the in-memory execution snapshot", () => {
    const rawExecution = makeEntry("15-refs", "pending_reconciliation", {
      execution: {
        ...makeEntry("15-refs", "pending_reconciliation").execution,
        txRefs: [],
      },
      receipt: null,
    }).execution;
    const mergedEntry = makeEntry("15-refs", "pending_reconciliation", {
      execution: {
        ...makeEntry("15-refs", "pending_reconciliation").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-bridge-proof-link",
            explorerUrl: null,
            routeStepIndex: 1,
          },
        ],
      },
      receipt: {
        ...makeEntry("15-refs", "completed").receipt!,
        paymentExecutionId: "exec-15-refs",
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-bridge-proof-link",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-bridge-proof-link",
            routeStepIndex: 1,
          },
        ],
      },
    });

    expect(getSmartPayActiveExecutionTxRefs(mergedEntry, rawExecution)).toEqual([
      {
        role: "bridge",
        network: "acp",
        txid: "fixture-bridge-proof-link",
        explorerUrl: "https://ancap.cloud/acp/tx/fixture-bridge-proof-link",
        routeStepIndex: 1,
      },
    ]);
    expect(getSmartPayActiveExecutionTxRefs(null, rawExecution)).toEqual([]);
    expect(getSmartPayActiveExecutionTxRefs(null, null)).toEqual([]);
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

  it("formats explicit route step indexes as stable 1-based labels", () => {
    expect(formatSmartPayRouteStepIndexLabel(1)).toBe("route step 1");
    expect(formatSmartPayRouteStepIndexLabel(2)).toBe("route step 2");
    expect(formatSmartPayRouteStepIndexLabel(0)).toBeNull();
    expect(formatSmartPayRouteStepIndexLabel(null)).toBeNull();
  });

  it("formats tx refs with optional route-step suffixes for consistent execution and receipt labels", () => {
    expect(
      formatSmartPayTxRefLabel({
        role: "bridge",
        network: "acp",
        txid: "fixture-proof-bridge",
        explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-bridge",
        routeStepIndex: 2,
      })
    ).toBe("bridge tx on acp: fixture-proof-bridge (route step 2)");
    expect(
      formatSmartPayTxRefLabel({
        role: "payment",
        network: "bsc",
        txid: "fixture-proof-payment",
        explorerUrl: null,
        routeStepIndex: null,
      })
    ).toBe("payment tx on bsc: fixture-proof-payment");
  });

  it("explains active proof refs using matched route-step context when available", () => {
    const entry = makeEntry("4-proof-hint", "pending_reconciliation", {
      quote: {
        ...makeEntry("4-proof-hint", "pending_reconciliation").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "native bridge",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "14.9",
          },
          {
            kind: "swap",
            network: "bsc",
            dexOrRail: "pancakeswap",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "14.7",
          },
        ],
      },
      execution: {
        ...makeEntry("4-proof-hint", "pending_reconciliation").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "proof-bridge-1",
            explorerUrl: "https://ancap.cloud/acp/tx/proof-bridge-1",
            routeStepIndex: 1,
          },
          {
            role: "swap",
            network: "bsc",
            txid: "proof-swap-2",
            explorerUrl: null,
            routeStepIndex: null,
          },
        ],
      },
      receipt: null,
    });

    const proofRefs = getSmartPayHistoryProofTxRefs(entry);
    expect(getSmartPayHistoryProofTxRefHint(entry, proofRefs[0]!)).toBe(
      "Linked via explicit quoted route step 1 proof ref."
    );
    expect(getSmartPayHistoryProofTxRefHint(entry, proofRefs[1]!)).toBe(
      "Linked by swap on bsc because this saved proof ref does not carry an explicit quoted route-step index."
    );
  });

  it("falls back to a generic proof-ref hint when no route metadata is available", () => {
    const entry = makeEntry("5-proof-hint-generic", "pending_reconciliation", {
      quote: {
        ...makeEntry("5-proof-hint-generic", "pending_reconciliation").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("5-proof-hint-generic", "pending_reconciliation").execution,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "proof-generic-1",
            explorerUrl: null,
            routeStepIndex: null,
          },
        ],
      },
      receipt: null,
    });

    expect(getSmartPayHistoryProofTxRefHint(entry, getSmartPayHistoryProofTxRefs(entry)[0]!)).toBe(
      "Observed payment on acp proof ref; no quoted or stored route-step metadata is available in this snapshot."
    );
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
      merchantLabelSource: "receipt",
      merchantCategory: null,
      merchantWebsite: null,
      merchantInvoiceId: null,
      merchantDetailsSource: "none",
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
      merchantLabelSource: "none",
      merchantCategory: null,
      merchantWebsite: null,
      merchantInvoiceId: null,
      merchantDetailsSource: "none",
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

  it("falls back to parsed merchant intent labels until a receipt snapshot confirms the merchant", () => {
    const intentMerchantOnly = makeEntry("4-merchant", "pending_reconciliation", {
      intent: {
        ...makeEntry("4-merchant", "pending_reconciliation").intent,
        merchant: {
          label: "Intent merchant",
          category: "services",
          website: "https://merchant.example",
          invoiceId: "inv-4-merchant",
        },
      },
      receipt: null,
    });

    const display = getSmartPayHistoryReceiptDisplay(intentMerchantOnly);

    expect(display.merchantLabel).toBe("Intent merchant");
    expect(display.merchantLabelSource).toBe("intent");
    expect(display.merchantCategory).toBe("services");
    expect(display.merchantWebsite).toBe("https://merchant.example");
    expect(display.merchantInvoiceId).toBe("inv-4-merchant");
    expect(display.merchantDetailsSource).toBe("intent");
    expect(getSmartPayHistoryMerchantHint(display)).toBe(
      "Merchant label comes from the parsed payment intent until a receipt snapshot confirms it."
    );
  });

  it("keeps intent-side merchant details visible even after a receipt label exists", () => {
    const mergedMerchantDetails = makeEntry("4-merchant-details", "completed", {
      intent: {
        ...makeEntry("4-merchant-details", "completed").intent,
        merchant: {
          label: "Intent merchant",
          category: "services",
          website: "https://merchant.example/pay",
          invoiceId: "inv-merchant-details",
        },
      },
      receipt: {
        ...makeEntry("4-merchant-details", "completed").receipt!,
        merchantLabel: "Receipt merchant",
      },
    });

    const display = getSmartPayHistoryReceiptDisplay(mergedMerchantDetails);

    expect(display.merchantLabel).toBe("Receipt merchant");
    expect(display.merchantLabelSource).toBe("receipt");
    expect(display.merchantCategory).toBe("services");
    expect(display.merchantWebsite).toBe("https://merchant.example/pay");
    expect(display.merchantInvoiceId).toBe("inv-merchant-details");
    expect(display.merchantDetailsSource).toBe("intent");
    expect(getSmartPayHistoryMerchantHint(display)).toBe(
      "Merchant label comes from the stored receipt snapshot. Website/category/invoice details still come from the parsed payment intent."
    );
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
    const backendOnly = makeEntry("1-token", "completed", {
      sessionToken: null,
      snapshotOrigin: "backend",
    });
    const localLive = makeEntry("2-token", "pending_reconciliation", {
      sessionToken: "session-2-token",
      snapshotOrigin: "local+backend",
    });

    expect(resolveSmartPayExecutionSessionToken(localLive, null)).toBe("session-2-token");
    expect(resolveSmartPayExecutionSessionToken(backendOnly, "fallback-session")).toBe("fallback-session");
    expect(resolveSmartPayExecutionSessionToken(null, " fallback-session ")).toBe("fallback-session");
    expect(resolveSmartPayExecutionSessionToken(backendOnly, null)).toBeNull();

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
    const now = Date.parse("2026-05-28T18:10:00.000Z");
    const localRecoverable = makeEntry("15", "pending_reconciliation", {
      snapshotOrigin: "local",
    });
    const backendFinalized = makeEntry("16", "completed", {
      sessionToken: null,
      snapshotOrigin: "backend",
    });
    const awaitingLocalLive = makeEntry("16b", "awaiting_local_signature", {
      snapshotOrigin: "local",
    });
    const awaitingLocalBackendOnly = makeEntry("16c", "awaiting_local_signature", {
      sessionToken: null,
      snapshotOrigin: "backend",
    });
    const snapshotOnly = makeEntry("17", "completed", {
      sessionToken: null,
      snapshotOrigin: "local",
    });

    expect(getSmartPayHistoryRefreshButtonLabel(localRecoverable)).toBe("Refresh status");
    expect(getSmartPayHistoryActionLabel(localRecoverable)).toBe("Refresh status + recover available");
    expect(getSmartPayHistoryActionHint(localRecoverable)).toContain(
      "original device-local session token"
    );

    expect(getSmartPayHistoryRefreshButtonLabel(backendFinalized, { hasAccountAuth: true }, now)).toBe(
      "Refresh receipt"
    );
    expect(getSmartPayHistoryActionLabel(backendFinalized, { hasAccountAuth: true }, now)).toBe(
      "Refresh receipt only"
    );
    expect(getSmartPayHistoryActionHint(backendFinalized, { hasAccountAuth: true }, now)).toContain(
      "already in a final state"
    );

    const receiptProofLag = makeEntry("16-final-proof-lag", "completed", {
      quote: {
        ...makeEntry("16-final-proof-lag", "completed").quote!,
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
            kind: "transfer",
            network: "bsc",
            dexOrRail: "merchant payout",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "4.9",
          },
        ],
      },
      execution: {
        ...makeEntry("16-final-proof-lag", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-final-proof-lag-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-final-proof-lag-bridge",
            routeStepIndex: 1,
          },
          {
            role: "merchant_payout",
            network: "bsc",
            txid: "fixture-final-proof-lag-payout",
            explorerUrl: "https://bscscan.com/tx/fixture-final-proof-lag-payout",
            routeStepIndex: 2,
          },
        ],
      },
      receipt: {
        ...makeEntry("16-final-proof-lag", "completed").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-final-proof-lag-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-final-proof-lag-bridge",
            routeStepIndex: 1,
          },
        ],
        routeSummary: [
          "1. bridge ACP -> wACP on acp via ancap_bridge_v1",
          "2. payout wACP -> USDT on bsc",
        ],
      },
    });

    expect(getSmartPayHistoryRefreshButtonLabel(receiptProofLag, { hasAccountAuth: true })).toBe(
      "Refresh receipt + proof sync"
    );
    expect(getSmartPayHistoryActionLabel(receiptProofLag, { hasAccountAuth: true })).toBe(
      "Refresh receipt + proof sync"
    );
    expect(getSmartPayHistoryActionHint(receiptProofLag, { hasAccountAuth: true }, now)).toContain(
      "still visible only from saved execution history"
    );

    const staleCompletedReceipt = makeEntry("16d", "completed", {
      receipt: {
        ...makeEntry("16d", "completed").receipt!,
        completedAt: "2026-05-28T17:00:00.000Z",
      },
      execution: {
        ...makeEntry("16d", "completed").execution,
        updatedAt: "2026-05-28T17:00:00.000Z",
      },
      savedAt: "2026-05-28T17:00:00.000Z",
    });

    expect(getSmartPayHistoryRefreshButtonLabel(staleCompletedReceipt, { hasAccountAuth: true }, now)).toBe(
      "Refresh stale receipt snapshot"
    );
    expect(getSmartPayHistoryActionLabel(staleCompletedReceipt, { hasAccountAuth: true }, now)).toBe(
      "Refresh stale receipt snapshot"
    );
    expect(getSmartPayHistoryActionHint(staleCompletedReceipt, { hasAccountAuth: true }, now)).toContain(
      "saved receipt/proof snapshot is aging"
    );

    expect(getSmartPayHistoryRefreshButtonLabel(awaitingLocalLive)).toBe("Refresh status");
    expect(getSmartPayHistoryActionLabel(awaitingLocalLive)).toBe("Restore original session");
    expect(getSmartPayHistoryActionHint(awaitingLocalLive, {}, now)).toContain(
      "needs the pending local signature"
    );
    expect(getSmartPayHistoryActionHint(awaitingLocalLive, {}, now)).toContain(
      "recovery only helps after you have observed a broadcast tx"
    );

    expect(getSmartPayHistoryRefreshButtonLabel(awaitingLocalBackendOnly, { hasAccountAuth: true })).toBe(
      "Refresh status"
    );
    expect(getSmartPayHistoryActionLabel(awaitingLocalBackendOnly, { hasAccountAuth: true })).toBe(
      "Refresh status only"
    );
    expect(getSmartPayHistoryActionHint(awaitingLocalBackendOnly, { hasAccountAuth: true }, now)).toContain(
      "cannot create the missing local signature"
    );

    expect(getSmartPayHistoryRefreshButtonLabel(snapshotOnly)).toBe("Refresh status");
    expect(getSmartPayHistoryActionLabel(snapshotOnly)).toBe("Snapshot only");
    expect(getSmartPayHistoryActionHint(snapshotOnly)).toContain(
      "otherwise only the saved snapshot is available"
    );
    expect(getSmartPayHistoryActionHint(receiptProofLag, {}, now)).toContain(
      "Sign in to the owning ANCAP account or restore the original device session"
    );

    const missingFinalProofSnapshotOnly = makeEntry("16-final-proof-missing-snapshot", "completed", {
      sessionToken: null,
      snapshotOrigin: "local",
      quote: {
        ...makeEntry("16-final-proof-missing-snapshot", "completed").quote!,
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
            kind: "transfer",
            network: "bsc",
            dexOrRail: "merchant payout",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "4.9",
          },
        ],
      },
      execution: {
        ...makeEntry("16-final-proof-missing-snapshot", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-final-proof-missing-snapshot-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-final-proof-missing-snapshot-bridge",
            routeStepIndex: 1,
          },
        ],
      },
      receipt: {
        ...makeEntry("16-final-proof-missing-snapshot", "completed").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-final-proof-missing-snapshot-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-final-proof-missing-snapshot-bridge",
            routeStepIndex: 1,
          },
        ],
        routeSummary: [
          "1. bridge ACP -> wACP on acp via ancap_bridge_v1",
          "2. payout wACP -> USDT on bsc",
        ],
      },
    });

    expect(getSmartPayHistoryRefreshButtonLabel(missingFinalProofSnapshotOnly)).toBe("Refresh status");
    expect(getSmartPayHistoryActionLabel(missingFinalProofSnapshotOnly)).toBe("Snapshot only");
    expect(getSmartPayHistoryActionHint(missingFinalProofSnapshotOnly)).toContain(
      "still lacks linked proof refs for some quoted or stored route steps"
    );
  });

  it("tailors recovery-input labels, hints, and button text to the current execution state", () => {
    const awaitingLocal = makeEntry("recover-awaiting", "awaiting_local_signature", {
      receipt: null,
      execution: {
        ...makeEntry("recover-awaiting", "awaiting_local_signature", { receipt: null }).execution,
        recoverable: true,
      },
    });
    const failed = makeEntry("recover-failed", "failed", {
      receipt: null,
      execution: {
        ...makeEntry("recover-failed", "failed", { receipt: null }).execution,
        recoverable: true,
      },
    });
    const completed = makeEntry("recover-completed", "completed", {
      execution: {
        ...makeEntry("recover-completed", "completed").execution,
        recoverable: false,
      },
    });

    expect(getSmartPayHistoryRecoveryInputLabel(awaitingLocal)).toBe("Recovery tx hints after signature (optional)");
    expect(getSmartPayHistoryRecoveryInputHint(awaitingLocal)).toContain("still needs the original local signature");
    expect(getSmartPayHistoryRecoverButtonLabel(awaitingLocal)).toBe("Status-only recover");
    expect(getSmartPayHistoryRecoverButtonLabel(awaitingLocal, 2)).toBe("Recover with 2 tx refs");

    expect(getSmartPayHistoryRecoveryInputLabel(failed)).toBe("Recovery / reconcile tx hints (optional)");
    expect(getSmartPayHistoryRecoveryInputHint(failed)).toContain("reconcile partial proof before you decide whether to retry");

    expect(getSmartPayHistoryRecoveryInputLabel(completed)).toBe("Recovery tx hints (optional)");
    expect(getSmartPayHistoryRecoveryInputHint(completed)).toContain("Recovery is unavailable");
    expect(getSmartPayHistoryRecoverButtonLabel(completed)).toBe("Recovery unavailable");
  });

  it("tailors restore hints so restored history cards do not over-promise refresh/recover access", () => {
    const liveAwaitingSignature = makeEntry("27-restore-live-awaiting", "awaiting_local_signature", {
      snapshotOrigin: "local",
    });
    const backendRecoverable = makeEntry("27-restore-backend-recoverable", "pending_reconciliation", {
      sessionToken: null,
      snapshotOrigin: "backend",
    });
    const backendCompletedProofLag = makeEntry("27-restore-backend-proof-lag", "completed", {
      sessionToken: null,
      snapshotOrigin: "backend",
      quote: {
        ...makeEntry("27-restore-backend-proof-lag", "completed").quote!,
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
            kind: "transfer",
            network: "bsc",
            dexOrRail: "merchant payout",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "4.9",
          },
        ],
      },
      execution: {
        ...makeEntry("27-restore-backend-proof-lag", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-restore-proof-lag-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-restore-proof-lag-bridge",
            routeStepIndex: 1,
          },
          {
            role: "merchant_payout",
            network: "bsc",
            txid: "fixture-restore-proof-lag-payout",
            explorerUrl: "https://bscscan.com/tx/fixture-restore-proof-lag-payout",
            routeStepIndex: 2,
          },
        ],
      },
      receipt: {
        ...makeEntry("27-restore-backend-proof-lag", "completed").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-restore-proof-lag-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-restore-proof-lag-bridge",
            routeStepIndex: 1,
          },
        ],
        routeSummary: [
          "1. bridge ACP -> wACP on acp via ancap_bridge_v1",
          "2. payout wACP -> USDT on bsc",
        ],
      },
    });
    const backendCompleted = makeEntry("27-restore-backend-completed", "completed", {
      sessionToken: null,
      snapshotOrigin: "backend",
    });
    const localSnapshotOnly = makeEntry("27-restore-local-snapshot", "failed", {
      sessionToken: null,
      snapshotOrigin: "local",
    });

    expect(getSmartPayHistoryRestoreHint(liveAwaitingSignature)).toBe(
      "Tap to restore this live payment session and finish the pending local signature on the original device."
    );
    expect(getSmartPayHistoryRestoreHint(backendRecoverable, { hasAccountAuth: true })).toBe(
      "Tap to restore this snapshot, then refresh or recover through your signed-in ANCAP account."
    );
    expect(getSmartPayHistoryRestoreHint(backendCompletedProofLag, { hasAccountAuth: true })).toBe(
      "Tap to restore this snapshot, then refresh receipt/proof sync through your signed-in ANCAP account."
    );
    expect(getSmartPayHistoryRestoreHint(backendCompleted, { hasAccountAuth: true })).toBe(
      "Tap to restore this snapshot, then refresh receipt details through your signed-in ANCAP account."
    );
    expect(getSmartPayHistoryRestoreHint(localSnapshotOnly)).toBe(
      "Tap to restore this saved failure snapshot and quoted payment context."
    );

    const localCompletedProofLagSnapshot = makeEntry("27-restore-local-proof-lag", "completed", {
      sessionToken: null,
      snapshotOrigin: "local",
      quote: {
        ...makeEntry("27-restore-local-proof-lag", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "3.2",
          },
          {
            kind: "transfer",
            network: "bsc",
            dexOrRail: "merchant payout",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "3.1",
          },
        ],
      },
      execution: {
        ...makeEntry("27-restore-local-proof-lag", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-restore-local-proof-lag-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-restore-local-proof-lag-bridge",
            routeStepIndex: 1,
          },
          {
            role: "merchant_payout",
            network: "bsc",
            txid: "fixture-restore-local-proof-lag-payout",
            explorerUrl: "https://bscscan.com/tx/fixture-restore-local-proof-lag-payout",
            routeStepIndex: 2,
          },
        ],
      },
      receipt: {
        ...makeEntry("27-restore-local-proof-lag", "completed").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-restore-local-proof-lag-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-restore-local-proof-lag-bridge",
            routeStepIndex: 1,
          },
        ],
        routeSummary: [
          "1. bridge ACP -> wACP on acp via ancap_bridge_v1",
          "2. payout wACP -> USDT on bsc",
        ],
      },
    });
    expect(getSmartPayHistoryRestoreHint(localCompletedProofLagSnapshot)).toBe(
      "Tap to restore this snapshot and inspect the saved receipt/proof context. Sign in or reopen the original device session later if you need receipt proof sync beyond this saved snapshot."
    );
  });

  it("suggests the most useful next step for awaiting, in-flight, failed, and finalized history snapshots", () => {
    const awaitingLocal = makeEntry("23", "awaiting_local_signature", {
      receipt: null,
      execution: {
        ...makeEntry("23", "awaiting_local_signature", { receipt: null }).execution,
        nextAction: "sign_swap_tx",
      },
      quote: {
        ...makeEntry("23", "awaiting_local_signature", { receipt: null }).quote!,
        route: [
          {
            kind: "swap",
            network: "bsc",
            dexOrRail: "pancakeswap",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "2.5",
          },
        ],
      },
    });
    const staleRecoverable = makeEntry("24", "pending_reconciliation", {
      savedAt: "2026-05-28T17:00:00.000Z",
      execution: {
        ...makeEntry("24", "pending_reconciliation").execution,
        updatedAt: "2026-05-28T17:00:00.000Z",
      },
    });
    const failedRecoverable = makeEntry("25", "failed", {
      execution: {
        ...makeEntry("25", "failed").execution,
        recoverable: true,
        nextAction: "refresh_status",
      },
      receipt: null,
    });
    const completedMissingProof = makeEntry("26", "completed", {
      quote: {
        ...makeEntry("26", "completed").quote!,
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
        ...makeEntry("26", "completed").execution,
        txRefs: [],
      },
      receipt: {
        ...makeEntry("26", "completed").receipt!,
        txRefs: [],
        routeSummary: ["1. bridge ACP -> wACP on acp"],
      },
    });
    const completedLinkedButStale = makeEntry("27", "completed", {
      savedAt: "2026-05-28T17:00:00.000Z",
      execution: {
        ...makeEntry("27", "completed").execution,
        updatedAt: "2026-05-28T17:00:00.000Z",
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-proof-27",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-27",
          },
        ],
      },
      receipt: {
        ...makeEntry("27", "completed").receipt!,
        completedAt: "2026-05-28T17:00:00.000Z",
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-proof-27",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-27",
          },
        ],
      },
    });
    const completedWithReceiptProofLag = makeEntry("27b", "completed", {
      receipt: {
        ...makeEntry("27b", "completed").receipt!,
        routeSummary: ["1. bridge ACP -> wACP on acp"],
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-proof-27b-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-27b-bridge",
            routeStepIndex: 1,
          },
        ],
      },
      quote: {
        ...makeEntry("27b", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "9.8",
          },
          {
            kind: "transfer",
            network: "bsc",
            dexOrRail: "merchant payout",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "9.7",
          },
        ],
      },
      execution: {
        ...makeEntry("27b", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-proof-27b-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-27b-bridge",
            routeStepIndex: 1,
          },
          {
            role: "merchant_payout",
            network: "bsc",
            txid: "fixture-proof-27b-payout",
            explorerUrl: "https://bscscan.com/tx/fixture-proof-27b-payout",
            routeStepIndex: 2,
          },
        ],
      },
    });

    const now = Date.parse("2026-05-28T18:03:00.000Z");

    expect(getSmartPayHistoryNextStepLabel(awaitingLocal)).toBe("Next step: sign on the original device");
    expect(getSmartPayHistoryNextStepHint(awaitingLocal)).toContain("complete the required signature");

    expect(getSmartPayHistoryNextStepLabel(staleRecoverable, { hasAccountAuth: false }, now)).toBe(
      "Next step: refresh or recover now"
    );
    expect(getSmartPayHistoryNextStepHint(staleRecoverable, { hasAccountAuth: false }, now)).toContain(
      "Refresh status first"
    );

    expect(getSmartPayHistoryNextStepLabel(failedRecoverable)).toBe("Next step: recover with observed tx refs");
    expect(getSmartPayHistoryNextStepHint(failedRecoverable)).toContain(
      "paste observed tx hashes/explorer links"
    );

    expect(getSmartPayHistoryNextStepLabel(completedMissingProof, { hasAccountAuth: true }, now)).toBe(
      "Next step: refresh final proof"
    );
    expect(getSmartPayHistoryNextStepHint(completedMissingProof, { hasAccountAuth: true }, now)).toContain(
      "lacks full linked proof coverage"
    );

    expect(getSmartPayHistoryNextStepLabel(completedWithReceiptProofLag, { hasAccountAuth: true }, now)).toBe(
      "Next step: refresh receipt proof sync"
    );
    expect(getSmartPayHistoryNextStepHint(completedWithReceiptProofLag, { hasAccountAuth: true }, now)).toContain(
      "receipt snapshot still lags behind execution history"
    );
    expect(getSmartPayHistoryNextStepLabel(completedWithReceiptProofLag, {}, now)).toBe(
      "Next step: sign in or restore original device for proof sync"
    );
    expect(getSmartPayHistoryNextStepHint(completedWithReceiptProofLag, {}, now)).toContain(
      "reopen the original device session"
    );

    expect(getSmartPayHistoryProofSyncLabel(completedMissingProof, { hasAccountAuth: true }, now)).toBe(
      "Proof sync state: final proof refresh available"
    );
    expect(getSmartPayHistoryProofSyncHint(completedMissingProof, { hasAccountAuth: true }, now)).toContain(
      "still lack linked proof refs"
    );
    expect(getSmartPayHistoryProofSyncLabel(completedWithReceiptProofLag, { hasAccountAuth: true }, now)).toBe(
      "Proof sync state: receipt lags execution proof"
    );
    expect(getSmartPayHistoryProofSyncHint(completedWithReceiptProofLag, { hasAccountAuth: true }, now)).toContain(
      "saved execution history is ahead of the stored receipt snapshot"
    );
    expect(getSmartPayHistoryProofSyncLabel(completedWithReceiptProofLag, {}, now)).toBe(
      "Proof sync state: receipt proof lag is snapshot-only"
    );
    expect(getSmartPayHistoryProofSyncHint(completedWithReceiptProofLag, {}, now)).toContain(
      "cannot refresh them anonymously"
    );
    expect(getSmartPayHistoryProofSyncLabel(staleRecoverable, { hasAccountAuth: false }, now)).toBe(
      "Proof sync state: route proof still syncing"
    );
    expect(getSmartPayHistoryProofSyncHint(staleRecoverable, { hasAccountAuth: false }, now)).toContain(
      "Refresh status or recover with observed tx refs"
    );
    expect(getSmartPayHistoryProofSyncLabel(awaitingLocal)).toBe(
      "Proof sync state: waiting for signing device"
    );
    expect(getSmartPayHistoryProofSyncHint(awaitingLocal)).toContain(
      "completes the pending local signature"
    );
    expect(getSmartPayHistoryProofSyncLabel(completedLinkedButStale, { hasAccountAuth: true }, now)).toBe(
      "Proof sync state: synced snapshot should be refreshed"
    );
    expect(getSmartPayHistoryProofSyncHint(completedLinkedButStale, { hasAccountAuth: true }, now)).toContain(
      "internally consistent"
    );

    expect(getSmartPayHistoryNextStepLabel(completedLinkedButStale, { hasAccountAuth: true }, now)).toBe(
      "Next step: refresh the receipt snapshot"
    );
    expect(getSmartPayHistoryNextStepHint(completedLinkedButStale, { hasAccountAuth: true }, now)).toContain(
      "getting stale"
    );
    expect(getSmartPayHistoryRefreshButtonLabel(completedLinkedButStale, { hasAccountAuth: true }, now)).toBe(
      "Refresh stale receipt snapshot"
    );
    expect(getSmartPayHistoryActionLabel(completedLinkedButStale, { hasAccountAuth: true }, now)).toBe(
      "Refresh stale receipt snapshot"
    );
    expect(getSmartPayHistoryActionHint(completedLinkedButStale, { hasAccountAuth: true }, now)).toContain(
      "saved receipt/proof snapshot is aging"
    );
  });

  it("formats route progress labels, detail lines, display lines, and hints for in-flight executions", () => {
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
    expect(getSmartPayHistoryExecutionProgressDetailLines(inFlight)).toEqual([
      "Route progress detail: 1/3 tx observed",
      "Remaining route steps: 2",
      "Pending roles: swap → merchant_payout",
    ]);
    expect(getSmartPayHistoryExecutionProgressDisplayLines(inFlight)).toEqual([
      "Route progress: 1/3 tx observed · 2 route steps remaining",
      "Route progress detail: 1/3 tx observed",
      "Remaining route steps: 2",
      "Pending roles: swap → merchant_payout",
    ]);
    expect(getSmartPayHistoryProgressHint(inFlight)).toBe(
      "Route submitted; pending roles: swap → merchant_payout."
    );
  });

  it("avoids misleading 0/0 route-progress text when only pending roles are known", () => {
    const pendingRolesOnly = makeEntry("2b", "pending_reconciliation", {
      quote: {
        ...makeEntry("2b", "pending_reconciliation").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("2b", "pending_reconciliation").execution,
        progress: {
          totalRouteSteps: 0,
          observedTxCount: 0,
          remainingRouteSteps: 0,
          pendingRoles: ["swap", "merchant_payout"],
        },
      },
      receipt: null,
    });

    expect(getSmartPayHistoryProgressLabel(pendingRolesOnly)).toBe(
      "Route progress: reconciliation pending"
    );
    expect(getSmartPayHistoryExecutionProgressDetailLines(pendingRolesOnly)).toEqual([
      "Pending roles: swap → merchant_payout",
    ]);
    expect(getSmartPayHistoryExecutionProgressDisplayLines(pendingRolesOnly)).toEqual([
      "Route progress: reconciliation pending",
      "Pending roles: swap → merchant_payout",
    ]);
    expect(getSmartPayHistoryProgressHint(pendingRolesOnly)).toBe(
      "Route submitted; pending roles: swap → merchant_payout."
    );
  });

  it("falls back to receipt summary or tx refs when explicit route progress is absent", () => {
    const completed = makeEntry("1", "completed", {
      execution: {
        ...makeEntry("1", "completed").execution,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-progress-payment",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-progress-payment",
            routeStepIndex: 1,
          },
        ],
      },
      receipt: {
        ...makeEntry("1", "completed").receipt!,
        routeSummary: ["1. transfer ACP -> ACP on acp", "2. settlement review pending"],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-progress-payment",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-progress-payment",
            routeStepIndex: 1,
          },
        ],
      },
    });
    const awaitingSignature = makeEntry("4", "awaiting_local_signature", {
      execution: {
        ...makeEntry("4", "awaiting_local_signature").execution,
        nextAction: "sign_swap_tx",
      },
      receipt: null,
    });
    const txOnly = makeEntry("4b", "pending_reconciliation", {
      quote: {
        ...makeEntry("4b", "pending_reconciliation").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("4b", "pending_reconciliation").execution,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-progress-tx-only",
            explorerUrl: null,
          },
        ],
      },
      receipt: null,
    });

    expect(getSmartPayHistoryProgressLabel(completed)).toBe(
      "Route progress: 1/2 route steps linked · 1 pending proof link"
    );
    expect(getSmartPayHistoryExecutionProgressDisplayLines(completed)).toEqual([
      "Route progress: 1/2 route steps linked · 1 pending proof link",
    ]);
    expect(getSmartPayHistoryProgressHint(completed)).toBe(
      "Receipt snapshot completed at 2026-05-28 18:02 UTC. This saved snapshot tracks 2 stored receipt route steps, with 1 linked proof ref and 1 pending proof link."
    );
    expect(getSmartPayHistoryProgressLabel(awaitingSignature)).toBe(
      "Route progress: waiting for local signature"
    );
    expect(getSmartPayHistoryExecutionProgressDisplayLines(awaitingSignature)).toEqual([
      "Route progress: waiting for local signature",
    ]);
    expect(getSmartPayHistoryProgressHint(awaitingSignature)).toBe(
      "Waiting for sign swap tx before route progress can continue."
    );
    expect(getSmartPayHistoryProgressLabel(txOnly)).toBe(
      "Execution references: 1 tx recorded"
    );
    expect(getSmartPayHistoryExecutionProgressDisplayLines(txOnly)).toEqual([
      "Execution references: 1 tx recorded",
    ]);
    expect(getSmartPayHistoryProgressHint(txOnly)).toBe(
      "Route submitted; waiting for reconciliation updates."
    );
  });

  it("prefers proof-derived fallback progress when saved execution progress conflicts with receipt-route proof context", () => {
    const completedWithStaleProgress = makeEntry("1c", "completed", {
      quote: {
        ...makeEntry("1c", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("1c", "completed").execution,
        progress: {
          totalRouteSteps: 1,
          observedTxCount: 2,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-progress-payment-1c",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-progress-payment-1c",
          },
        ],
      },
      receipt: {
        ...makeEntry("1c", "completed").receipt!,
        routeSummary: ["1. transfer ACP -> ACP on acp", "2. settlement review pending"],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-progress-payment-1c",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-progress-payment-1c",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProgressLabel(completedWithStaleProgress)).toBe(
      "Route progress: 1/2 route steps linked · 1 pending proof link"
    );
    expect(getSmartPayHistoryExecutionProgressDetailLines(completedWithStaleProgress)).toEqual([]);
    expect(getSmartPayHistoryExecutionProgressDisplayLines(completedWithStaleProgress)).toEqual([
      "Route progress: 1/2 route steps linked · 1 pending proof link",
    ]);
    expect(getSmartPayHistoryProgressHint(completedWithStaleProgress)).toBe(
      "Receipt snapshot completed at 2026-05-28 18:02 UTC. This saved snapshot tracks 2 stored receipt route steps, with 1 linked proof ref and 1 pending proof link."
    );
  });

  it("keeps pending-role guidance while adding fallback proof progress when in-flight execution progress is stale", () => {
    const inFlightWithStaleProgress = makeEntry("4c", "pending_reconciliation", {
      quote: {
        ...makeEntry("4c", "pending_reconciliation").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
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
            estimatedOut: "9.8",
          },
        ],
      },
      execution: {
        ...makeEntry("4c", "pending_reconciliation").execution,
        progress: {
          totalRouteSteps: 1,
          observedTxCount: 1,
          remainingRouteSteps: 0,
          pendingRoles: ["swap"],
        },
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-progress-bridge-4c",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-progress-bridge-4c",
            routeStepIndex: 1,
          },
        ],
      },
      receipt: {
        ...makeEntry("4c", "completed").receipt!,
        paymentExecutionId: "exec-4c",
        routeSummary: [
          "1. bridge ACP -> wACP on acp",
          "2. swap wACP -> USDT on bsc",
        ],
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-progress-bridge-4c",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-progress-bridge-4c",
            routeStepIndex: 1,
          },
        ],
      },
    });

    expect(getSmartPayHistoryProgressLabel(inFlightWithStaleProgress)).toBe(
      "Route progress: 1/2 route steps linked · 1 pending proof link"
    );
    expect(getSmartPayHistoryExecutionProgressDetailLines(inFlightWithStaleProgress)).toEqual([]);
    expect(getSmartPayHistoryExecutionProgressDisplayLines(inFlightWithStaleProgress)).toEqual([
      "Route progress: 1/2 route steps linked · 1 pending proof link",
    ]);
    expect(getSmartPayHistoryProgressHint(inFlightWithStaleProgress)).toBe(
      "Route submitted; pending roles: swap. This saved snapshot tracks 2 quoted route steps, with 1 linked proof ref and 1 pending proof link."
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
            txid: "fixture-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-bridge",
          },
          {
            role: "swap",
            network: "bsc",
            txid: "fixture-swap",
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
            txid: "fixture-payment",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-payment",
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
            txid: "fixture-payment",
            explorerUrl: null,
          },
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-bridge",
          },
        ],
      },
      receipt: {
        ...makeEntry("7", "completed").receipt!,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-payment",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-payment",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofTxRefs(completed)).toEqual([
      {
        role: "payment",
        network: "acp",
        txid: "fixture-payment",
        explorerUrl: "https://ancap.cloud/acp/tx/fixture-payment",
      },
      {
        role: "bridge",
        network: "acp",
        txid: "fixture-bridge",
        explorerUrl: "https://ancap.cloud/acp/tx/fixture-bridge",
      },
    ]);
    expect(getSmartPayHistoryProofProvenanceLabel(completed)).toBe(
      "Proof provenance: 1 receipt-backed · 1 execution-only"
    );
    expect(getSmartPayHistoryProofProvenanceHint(completed)).toBe(
      "Some linked proof refs are already stored in the saved receipt snapshot. Execution-only refs are still visible only from saved execution history until a newer receipt snapshot includes them."
    );
  });

  it("deduplicates proof refs case-insensitively while keeping the richer explorer-linked entry", () => {
    const completed = makeEntry("7b", "completed", {
      execution: {
        ...makeEntry("7b", "completed").execution,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-tx-alpha",
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
            txid: "FIXTURE-TX-ALPHA",
            explorerUrl: "https://ancap.cloud/acp/tx/FIXTURE-TX-ALPHA",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofTxRefs(completed)).toEqual([
      {
        role: "payment",
        network: "acp",
        txid: "FIXTURE-TX-ALPHA",
        explorerUrl: "https://ancap.cloud/acp/tx/FIXTURE-TX-ALPHA",
      },
    ]);
    expect(getSmartPayHistoryProofProvenanceLabel(completed)).toBe(
      "Proof provenance: 1 receipt-backed · 0 execution-only"
    );
    expect(getSmartPayHistoryProofProvenanceHint(completed)).toBe(
      "All linked proof refs are already backed by the saved receipt snapshot."
    );
  });

  it("deduplicates semantically equivalent payment and merchant payout refs for the same tx while keeping route-step metadata", () => {
    const completed = makeEntry("7c-merchant-alias", "completed", {
      quote: {
        ...makeEntry("7c-merchant-alias", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
          {
            kind: "transfer",
            network: "bsc",
            dexOrRail: "merchant payout",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "9.8",
          },
        ],
      },
      execution: {
        ...makeEntry("7c-merchant-alias", "completed").execution,
        txRefs: [
          {
            role: "payment",
            network: "BSC",
            txid: "fixture-shared-payout-proof",
            explorerUrl: null,
            routeStepIndex: 2,
          },
        ],
      },
      receipt: {
        ...makeEntry("7c-merchant-alias", "completed").receipt!,
        txRefs: [
          {
            role: "merchant_payout",
            network: "bsc",
            txid: "FIXTURE-SHARED-PAYOUT-PROOF",
            explorerUrl: "https://bscscan.com/tx/FIXTURE-SHARED-PAYOUT-PROOF",
          },
        ],
        routeSummary: [
          "1. bridge ACP -> wACP on acp via ancap_bridge_v1",
          "2. payout wACP -> USDT on bsc",
        ],
      },
    });

    expect(getSmartPayHistoryProofTxRefs(completed)).toEqual([
      {
        role: "merchant_payout",
        network: "bsc",
        txid: "FIXTURE-SHARED-PAYOUT-PROOF",
        explorerUrl: "https://bscscan.com/tx/FIXTURE-SHARED-PAYOUT-PROOF",
        routeStepIndex: 2,
      },
    ]);
    expect(getSmartPayHistoryProofRouteSteps(completed)).toEqual([
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
        key: "merchant_payout|bsc|2",
        stepIndex: 2,
        role: "merchant_payout",
        network: "bsc",
        kind: "transfer",
        fromAsset: "wACP",
        toAsset: "USDT",
        label: "Step 2: transfer wACP → USDT via bsc via merchant payout",
        status: "linked",
        txRef: {
          role: "merchant_payout",
          network: "bsc",
          txid: "FIXTURE-SHARED-PAYOUT-PROOF",
          explorerUrl: "https://bscscan.com/tx/FIXTURE-SHARED-PAYOUT-PROOF",
          routeStepIndex: 2,
        },
      },
    ]);
    expect(getSmartPayHistoryProofLabel(completed)).toBe(
      "On-chain proof: 1/2 route steps linked"
    );
    expect(getSmartPayHistoryProofHint(completed)).toBe(
      "Linked proof currently covers 1/2 quoted route steps; 1 explorer link available."
    );
    expect(getSmartPayHistoryProofProvenanceLabel(completed)).toBe(
      "Proof provenance: 1 receipt-backed · 0 execution-only"
    );
    expect(getSmartPayHistoryProofRouteDetailLabel(completed)).toBe(
      "Proof linkage detail: 1 explicit · 0 inferred · 1 pending"
    );
  });

  it("matches quoted route steps from alias roles and case-insensitive networks even without explicit route-step indexes", () => {
    const completed = makeEntry("7d-merchant-alias-inferred", "completed", {
      quote: {
        ...makeEntry("7d-merchant-alias-inferred", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
          {
            kind: "transfer",
            network: "bsc",
            dexOrRail: "merchant payout",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "9.8",
          },
        ],
      },
      execution: {
        ...makeEntry("7d-merchant-alias-inferred", "completed").execution,
        txRefs: [
          {
            role: "payment",
            network: "BSC",
            txid: "fixture-inferred-payout-proof",
            explorerUrl: "https://bscscan.com/tx/fixture-inferred-payout-proof",
          },
        ],
      },
      receipt: {
        ...makeEntry("7d-merchant-alias-inferred", "completed").receipt!,
        txRefs: [],
        routeSummary: [
          "1. bridge ACP -> wACP on acp via ancap_bridge_v1",
          "2. payout wACP -> USDT on bsc",
        ],
      },
    });

    expect(getSmartPayHistoryProofRouteSteps(completed)).toEqual([
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
        key: "merchant_payout|bsc|2",
        stepIndex: 2,
        role: "merchant_payout",
        network: "bsc",
        kind: "transfer",
        fromAsset: "wACP",
        toAsset: "USDT",
        label: "Step 2: transfer wACP → USDT via bsc via merchant payout",
        status: "linked",
        txRef: {
          role: "payment",
          network: "BSC",
          txid: "fixture-inferred-payout-proof",
          explorerUrl: "https://bscscan.com/tx/fixture-inferred-payout-proof",
        },
      },
    ]);
    expect(getSmartPayHistoryAdditionalProofTxRefs(completed)).toEqual([]);
    expect(getSmartPayHistoryProofLabel(completed)).toBe(
      "On-chain proof: 1/2 route steps linked"
    );
    expect(getSmartPayHistoryProofHint(completed)).toBe(
      "Linked proof currently covers 1/2 quoted route steps; 1 explorer link available."
    );
    expect(getSmartPayHistoryProofRouteDetailLabel(completed)).toBe(
      "Proof linkage detail: 0 explicit · 1 inferred · 1 pending"
    );
    expect(getSmartPayHistoryProofRouteDetailHint(completed)).toBe(
      "1 quoted route step linked by role/network matching without explicit route-step indexes; 1 quoted route step still pending."
    );
    expect(getSmartPayHistoryProofRouteStepHint(completed, getSmartPayHistoryProofRouteSteps(completed)[1]!)).toBe(
      "Linked by merchant payout on bsc because this saved proof ref does not carry an explicit quoted route-step index."
    );
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
            txid: "fixture-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-bridge",
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund",
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
        txid: "fixture-refund",
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

  it("returns null proof provenance when there are no linked proof refs yet", () => {
    const noProof = makeEntry("7c", "pending_reconciliation", {
      execution: {
        ...makeEntry("7c", "pending_reconciliation").execution,
        txRefs: [],
      },
      receipt: null,
    });

    expect(getSmartPayHistoryProofProvenanceLabel(noProof)).toBeNull();
    expect(getSmartPayHistoryProofProvenanceHint(noProof)).toBeNull();
  });

  it("explains whether linked and additional proof refs are receipt-backed or execution-only", () => {
    const mixedProof = makeEntry("7c-proof-storage", "completed", {
      quote: {
        ...makeEntry("7c-proof-storage", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
          {
            kind: "transfer",
            network: "bsc",
            dexOrRail: "merchant payout",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "9.8",
          },
        ],
      },
      execution: {
        ...makeEntry("7c-proof-storage", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-storage-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-storage-bridge",
            routeStepIndex: 1,
          },
          {
            role: "merchant_payout",
            network: "bsc",
            txid: "fixture-storage-payout",
            explorerUrl: "https://bscscan.com/tx/fixture-storage-payout",
            routeStepIndex: 2,
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-storage-refund",
            explorerUrl: null,
          },
        ],
      },
      receipt: {
        ...makeEntry("7c-proof-storage", "completed").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-storage-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-storage-bridge",
            routeStepIndex: 1,
          },
        ],
        routeSummary: [
          "1. bridge ACP -> wACP on acp via ancap_bridge_v1",
          "2. payout wACP -> USDT on bsc",
        ],
      },
    });

    const routeSteps = getSmartPayHistoryProofRouteSteps(mixedProof);
    const additionalProofRefs = getSmartPayHistoryAdditionalProofTxRefs(mixedProof);

    expect(getSmartPayHistoryProofProvenanceLabel(mixedProof)).toBe(
      "Proof provenance: 1 receipt-backed · 1 execution-only"
    );
    expect(getSmartPayHistoryProofProvenanceHint(mixedProof)).toBe(
      "Some linked proof refs are already stored in the saved receipt snapshot. Execution-only refs are still visible only from saved execution history until a newer receipt snapshot includes them."
    );
    expect(getSmartPayHistoryAdditionalProofProvenanceLabel(mixedProof)).toBe(
      "Additional proof provenance: 0 receipt-backed · 1 execution-only"
    );
    expect(getSmartPayHistoryAdditionalProofProvenanceHint(mixedProof)).toBe(
      "Additional proof refs are currently visible only from saved execution history. Refresh status/receipt if you need a newer receipt snapshot to include them."
    );
    expect(getSmartPayHistoryTxRefStorageHint(mixedProof, routeSteps[0]!.txRef!)).toBe(
      "This tx ref is already backed by the saved receipt snapshot."
    );
    expect(getSmartPayHistoryTxRefStorageHint(mixedProof, routeSteps[1]!.txRef!)).toBe(
      "This tx ref is currently visible only from saved execution history; refresh status/receipt if you need a newer receipt snapshot to include it."
    );
    expect(getSmartPayHistoryTxRefStorageHint(mixedProof, additionalProofRefs[0]!)).toBe(
      "This tx ref is currently visible only from saved execution history; refresh status/receipt if you need a newer receipt snapshot to include it."
    );

    const noReceiptSnapshot = makeEntry("7c-proof-storage-no-receipt", "completed", {
      receipt: null,
      quote: {
        ...makeEntry("7c-proof-storage-no-receipt", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
        ],
      },
      execution: {
        ...makeEntry("7c-proof-storage-no-receipt", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-storage-bridge-no-receipt",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-storage-bridge-no-receipt",
            routeStepIndex: 1,
          },
        ],
      },
    });

    expect(
      getSmartPayHistoryTxRefStorageHint(
        noReceiptSnapshot,
        getSmartPayHistoryProofRouteSteps(noReceiptSnapshot)[0]!.txRef!
      )
    ).toBe(
      "This tx ref is currently visible only from saved execution history; no saved receipt snapshot includes it yet."
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
            txid: "fixture-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-bridge",
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund",
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
            txid: "fixture-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-bridge",
          },
        ],
      },
      receipt: {
        ...makeEntry("8", "pending_reconciliation").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-bridge",
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
          txid: "fixture-bridge",
          explorerUrl: "https://ancap.cloud/acp/tx/fixture-bridge",
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
            txid: "fixture-first-hop",
            explorerUrl: "https://bscscan.com/tx/fixture-first-hop",
          },
        ],
      },
      receipt: {
        ...makeEntry("10", "pending_reconciliation").receipt!,
        txRefs: [
          {
            role: "swap",
            network: "bsc",
            txid: "fixture-first-hop",
            explorerUrl: "https://bscscan.com/tx/fixture-first-hop",
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
          txid: "fixture-first-hop",
          explorerUrl: "https://bscscan.com/tx/fixture-first-hop",
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
            txid: "fixture-second-hop",
            explorerUrl: "https://bscscan.com/tx/fixture-second-hop",
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
            txid: "fixture-second-hop",
            explorerUrl: "https://bscscan.com/tx/fixture-second-hop",
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
          txid: "fixture-second-hop",
          explorerUrl: "https://bscscan.com/tx/fixture-second-hop",
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
            txid: "fixture-wrong-step",
            explorerUrl: "https://bscscan.com/tx/fixture-wrong-step",
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
            txid: "fixture-wrong-step",
            explorerUrl: "https://bscscan.com/tx/fixture-wrong-step",
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
        txid: "fixture-wrong-step",
        explorerUrl: "https://bscscan.com/tx/fixture-wrong-step",
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

  it("explains when an extra quoted-route proof ref points at an already-linked step", () => {
    const duplicateQuotedStep = makeEntry("12duplicate-quoted-step", "completed", {
      quote: {
        ...makeEntry("12duplicate-quoted-step", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
        ],
      },
      execution: {
        ...makeEntry("12duplicate-quoted-step", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-primary-quoted-proof",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-primary-quoted-proof",
            routeStepIndex: 1,
          },
          {
            role: "merchant_payout",
            network: "bsc",
            txid: "fixture-duplicate-quoted-proof",
            explorerUrl: "https://bscscan.com/tx/fixture-duplicate-quoted-proof",
            routeStepIndex: 1,
          },
        ],
      },
      receipt: {
        ...makeEntry("12duplicate-quoted-step", "completed").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-primary-quoted-proof",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-primary-quoted-proof",
            routeStepIndex: 1,
          },
        ],
      },
    });

    expect(getSmartPayHistoryAdditionalProofTxRefs(duplicateQuotedStep)).toEqual([
      {
        role: "merchant_payout",
        network: "bsc",
        txid: "fixture-duplicate-quoted-proof",
        explorerUrl: "https://bscscan.com/tx/fixture-duplicate-quoted-proof",
        routeStepIndex: 1,
      },
    ]);
    expect(getSmartPayHistoryAdditionalProofTxRefHint(duplicateQuotedStep, getSmartPayHistoryAdditionalProofTxRefs(duplicateQuotedStep)[0]!)).toBe(
      "Claims quoted route step 1, but that step is already linked to bridge on acp in this snapshot."
    );
    expect(getSmartPayHistoryAdditionalProofHint(duplicateQuotedStep)).toBe(
      "Additional observed tx refs: merchant_payout on bsc — Claims quoted route step 1, but that step is already linked to bridge on acp in this snapshot."
    );
  });

  it("explains whether route proof steps are explicitly indexed, loosely matched, or still pending", () => {
    const explicitlyIndexed = makeEntry("12hint-indexed", "completed", {
      quote: {
        ...makeEntry("12hint-indexed", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
        ],
      },
      execution: {
        ...makeEntry("12hint-indexed", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-indexed-proof",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-indexed-proof",
            routeStepIndex: 1,
          },
        ],
      },
      receipt: {
        ...makeEntry("12hint-indexed", "completed").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-indexed-proof",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-indexed-proof",
            routeStepIndex: 1,
          },
        ],
      },
    });

    const looselyMatched = makeEntry("12hint-loose", "completed", {
      quote: {
        ...makeEntry("12hint-loose", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
        ],
      },
      execution: {
        ...makeEntry("12hint-loose", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-loose-proof",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-loose-proof",
          },
        ],
      },
      receipt: {
        ...makeEntry("12hint-loose", "completed").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-loose-proof",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-loose-proof",
          },
        ],
      },
    });

    const pendingQuoted = makeEntry("12hint-pending", "pending_reconciliation", {
      quote: {
        ...makeEntry("12hint-pending", "pending_reconciliation").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
        ],
      },
      execution: {
        ...makeEntry("12hint-pending", "pending_reconciliation").execution,
        txRefs: [],
      },
      receipt: {
        ...makeEntry("12hint-pending", "pending_reconciliation").receipt!,
        txRefs: [],
      },
    });

    const pendingStoredReceipt = makeEntry("12hint-stored", "completed", {
      quote: {
        ...makeEntry("12hint-stored", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("12hint-stored", "completed").execution,
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
            txid: "fixture-stored-proof",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-stored-proof",
            routeStepIndex: 1,
          },
        ],
      },
      receipt: {
        ...makeEntry("12hint-stored", "completed").receipt!,
        routeSummary: [
          "1. transfer ACP -> ACP on acp",
          "2. settlement review pending",
        ],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-stored-proof",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-stored-proof",
            routeStepIndex: 1,
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofRouteStepHint(explicitlyIndexed, getSmartPayHistoryProofRouteSteps(explicitlyIndexed)[0]!)).toBe(
      "Linked via explicit quoted route step 1 proof ref."
    );
    expect(getSmartPayHistoryProofRouteStepHint(looselyMatched, getSmartPayHistoryProofRouteSteps(looselyMatched)[0]!)).toBe(
      "Linked by bridge on acp because this saved proof ref does not carry an explicit quoted route-step index."
    );
    expect(getSmartPayHistoryProofRouteStepHint(pendingQuoted, getSmartPayHistoryProofRouteSteps(pendingQuoted)[0]!)).toBe(
      "Awaiting proof ref for quoted route step 1; this step expects bridge on acp via ancap_bridge_v1."
    );
    expect(getSmartPayHistoryProofRouteStepHint(pendingStoredReceipt, getSmartPayHistoryProofRouteSteps(pendingStoredReceipt)[1]!)).toBe(
      "Awaiting proof ref for stored receipt route step 2: settlement review pending."
    );

    expect(getSmartPayHistoryProofRouteDetailLabel(explicitlyIndexed)).toBe(
      "Proof linkage detail: 1 explicit · 0 inferred · 0 pending"
    );
    expect(getSmartPayHistoryProofRouteDetailHint(explicitlyIndexed)).toBe(
      "1 quoted route step linked via explicit route-step indexes."
    );
    expect(getSmartPayHistoryProofQualityLabel(explicitlyIndexed)).toBe(
      "Proof quality: fully explicit"
    );
    expect(getSmartPayHistoryProofQualityHint(explicitlyIndexed)).toBe(
      "All linked quoted route steps are backed by explicit route-step indexes."
    );
    expect(getSmartPayHistoryProofRouteDetailLabel(looselyMatched)).toBe(
      "Proof linkage detail: 0 explicit · 1 inferred · 0 pending"
    );
    expect(getSmartPayHistoryProofRouteDetailHint(looselyMatched)).toBe(
      "1 quoted route step linked by role/network matching without explicit route-step indexes."
    );
    expect(getSmartPayHistoryProofQualityLabel(looselyMatched)).toBe(
      "Proof quality: fully inferred"
    );
    expect(getSmartPayHistoryProofQualityHint(looselyMatched)).toBe(
      "All linked quoted route steps are inferred from role/network matching because explicit route-step indexes are missing from saved proof refs."
    );
    expect(getSmartPayHistoryProofRouteDetailLabel(pendingQuoted)).toBe(
      "Proof linkage detail: 0 explicit · 0 inferred · 1 pending"
    );
    expect(getSmartPayHistoryProofRouteDetailHint(pendingQuoted)).toBe(
      "1 quoted route step still pending."
    );
    expect(getSmartPayHistoryProofQualityLabel(pendingQuoted)).toBe(
      "Proof quality: waiting for proof links"
    );
    expect(getSmartPayHistoryProofQualityHint(pendingQuoted)).toBe(
      "None of the quoted route steps are linked to proof refs yet."
    );
    expect(getSmartPayHistoryProofRouteDetailLabel(pendingStoredReceipt)).toBe(
      "Proof linkage detail: 1 explicit · 0 inferred · 1 pending"
    );
    expect(getSmartPayHistoryProofRouteDetailHint(pendingStoredReceipt)).toBe(
      "1 stored receipt route step linked via explicit route-step indexes; 1 stored receipt route step still pending."
    );
    expect(getSmartPayHistoryProofQualityLabel(pendingStoredReceipt)).toBe(
      "Proof quality: partial explicit coverage"
    );
    expect(getSmartPayHistoryProofQualityHint(pendingStoredReceipt)).toBe(
      "Linked stored receipt route steps are backed by explicit route-step indexes so far, but some steps still need proof refs."
    );
  });

  it("covers mixed and partially inferred proof-quality branches", () => {
    const mixedPartialCoverage = makeEntry("12hint-mixed-partial", "pending_reconciliation", {
      quote: {
        ...makeEntry("12hint-mixed-partial", "pending_reconciliation").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
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
            estimatedOut: "9.8",
          },
          {
            kind: "transfer",
            network: "bsc",
            dexOrRail: null,
            fromAsset: "USDT",
            toAsset: "USDT",
            estimatedOut: "9.8",
          },
        ],
      },
      execution: {
        ...makeEntry("12hint-mixed-partial", "pending_reconciliation").execution,
        progress: {
          totalRouteSteps: 3,
          observedTxCount: 2,
          remainingRouteSteps: 1,
          pendingRoles: ["payment"],
        },
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-mixed-explicit",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-mixed-explicit",
            routeStepIndex: 1,
          },
          {
            role: "swap",
            network: "bsc",
            txid: "fixture-mixed-inferred",
            explorerUrl: "https://bscscan.com/tx/fixture-mixed-inferred",
          },
        ],
      },
      receipt: {
        ...makeEntry("12hint-mixed-partial", "pending_reconciliation").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-mixed-explicit",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-mixed-explicit",
            routeStepIndex: 1,
          },
          {
            role: "swap",
            network: "bsc",
            txid: "fixture-mixed-inferred",
            explorerUrl: "https://bscscan.com/tx/fixture-mixed-inferred",
          },
        ],
      },
    });

    const partialInferredCoverage = makeEntry("12hint-partial-inferred", "pending_reconciliation", {
      quote: {
        ...makeEntry("12hint-partial-inferred", "pending_reconciliation").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
          {
            kind: "transfer",
            network: "bsc",
            dexOrRail: null,
            fromAsset: "USDT",
            toAsset: "USDT",
            estimatedOut: "9.8",
          },
        ],
      },
      execution: {
        ...makeEntry("12hint-partial-inferred", "pending_reconciliation").execution,
        progress: {
          totalRouteSteps: 2,
          observedTxCount: 1,
          remainingRouteSteps: 1,
          pendingRoles: ["payment"],
        },
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-partial-inferred",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-partial-inferred",
          },
        ],
      },
      receipt: {
        ...makeEntry("12hint-partial-inferred", "pending_reconciliation").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-partial-inferred",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-partial-inferred",
          },
        ],
      },
    });

    const mixedLinkedCoverage = makeEntry("12hint-mixed-linked", "completed", {
      quote: {
        ...makeEntry("12hint-mixed-linked", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
          {
            kind: "transfer",
            network: "bsc",
            dexOrRail: null,
            fromAsset: "USDT",
            toAsset: "USDT",
            estimatedOut: "9.8",
          },
        ],
      },
      execution: {
        ...makeEntry("12hint-mixed-linked", "completed").execution,
        progress: {
          totalRouteSteps: 2,
          observedTxCount: 2,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-mixed-linked-explicit",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-mixed-linked-explicit",
            routeStepIndex: 1,
          },
          {
            role: "payment",
            network: "bsc",
            txid: "fixture-mixed-linked-inferred",
            explorerUrl: "https://bscscan.com/tx/fixture-mixed-linked-inferred",
          },
        ],
      },
      receipt: {
        ...makeEntry("12hint-mixed-linked", "completed").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-mixed-linked-explicit",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-mixed-linked-explicit",
            routeStepIndex: 1,
          },
          {
            role: "payment",
            network: "bsc",
            txid: "fixture-mixed-linked-inferred",
            explorerUrl: "https://bscscan.com/tx/fixture-mixed-linked-inferred",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofRouteDetailLabel(mixedPartialCoverage)).toBe(
      "Proof linkage detail: 1 explicit · 1 inferred · 1 pending"
    );
    expect(getSmartPayHistoryProofRouteDetailHint(mixedPartialCoverage)).toBe(
      "1 quoted route step linked via explicit route-step indexes; 1 quoted route step linked by role/network matching without explicit route-step indexes; 1 quoted route step still pending."
    );
    expect(getSmartPayHistoryProofQualityLabel(mixedPartialCoverage)).toBe(
      "Proof quality: mixed partial coverage"
    );
    expect(getSmartPayHistoryProofQualityHint(mixedPartialCoverage)).toBe(
      "Some quoted route steps are linked by explicit indexes, some only by inferred role/network matching, and some are still pending proof refs."
    );

    expect(getSmartPayHistoryProofRouteDetailLabel(partialInferredCoverage)).toBe(
      "Proof linkage detail: 0 explicit · 1 inferred · 1 pending"
    );
    expect(getSmartPayHistoryProofRouteDetailHint(partialInferredCoverage)).toBe(
      "1 quoted route step linked by role/network matching without explicit route-step indexes; 1 quoted route step still pending."
    );
    expect(getSmartPayHistoryProofQualityLabel(partialInferredCoverage)).toBe(
      "Proof quality: partial inferred coverage"
    );
    expect(getSmartPayHistoryProofQualityHint(partialInferredCoverage)).toBe(
      "Current quoted route coverage depends on inferred role/network matching, and some steps still need proof refs."
    );

    expect(getSmartPayHistoryProofRouteDetailLabel(mixedLinkedCoverage)).toBe(
      "Proof linkage detail: 1 explicit · 1 inferred · 0 pending"
    );
    expect(getSmartPayHistoryProofRouteDetailHint(mixedLinkedCoverage)).toBe(
      "1 quoted route step linked via explicit route-step indexes; 1 quoted route step linked by role/network matching without explicit route-step indexes."
    );
    expect(getSmartPayHistoryProofQualityLabel(mixedLinkedCoverage)).toBe(
      "Proof quality: mixed linked coverage"
    );
    expect(getSmartPayHistoryProofQualityHint(mixedLinkedCoverage)).toBe(
      "This snapshot links every quoted route step, but some links are explicit and others are inferred from role/network matching."
    );
  });

  it("returns null proof-linkage detail when there is no route-proof context", () => {
    const noRouteProofContext = makeEntry("12route-detail-none", "completed", {
      receipt: null,
      quote: {
        ...makeEntry("12route-detail-none", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("12route-detail-none", "completed").execution,
        progress: null,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-standalone-proof",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-standalone-proof",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofRouteDetailLabel(noRouteProofContext)).toBeNull();
    expect(getSmartPayHistoryProofRouteDetailHint(noRouteProofContext)).toBeNull();
    expect(getSmartPayHistoryProofQualityLabel(noRouteProofContext)).toBe(
      "Proof quality: unstructured tx refs only"
    );
    expect(getSmartPayHistoryProofQualityHint(noRouteProofContext)).toBe(
      "This snapshot has observed tx refs, but no quoted or stored route-step context to verify whether they map onto the intended payment route."
    );
  });

  it("returns null pending-proof hint when there is no route-proof context or all tracked steps are linked", () => {
    const noRouteProofContext = makeEntry("12", "completed", {
      execution: {
        ...makeEntry("12", "completed").execution,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-payment",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-payment",
          },
        ],
      },
      quote: {
        ...makeEntry("12", "completed").quote!,
        route: [],
      },
      receipt: {
        ...makeEntry("12", "completed").receipt!,
        routeSummary: [],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-payment",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-payment",
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
            txid: "fixture-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-bridge",
          },
        ],
      },
      receipt: {
        ...makeEntry("13", "completed").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "fixture-bridge",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-bridge",
          },
        ],
      },
    });

    const fullyLinkedStoredReceiptRoute = makeEntry("12b", "completed", {
      quote: {
        ...makeEntry("12b", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("12b", "completed").execution,
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
            txid: "fixture-payment-12b",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-payment-12b",
          },
        ],
      },
      receipt: {
        ...makeEntry("12b", "completed").receipt!,
        routeSummary: ["1. transfer ACP -> ACP on acp"],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-payment-12b",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-payment-12b",
          },
        ],
      },
    });

    expect(getSmartPayHistoryPendingProofHint(noRouteProofContext)).toBeNull();
    expect(getSmartPayHistoryPendingProofHint(fullyLinkedRoute)).toBeNull();
    expect(getSmartPayHistoryPendingProofHint(fullyLinkedStoredReceiptRoute)).toBeNull();
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

    expect(getSmartPayHistoryProgressLabel(routeSnapshotOnly)).toBe(
      "Route progress: 0/3 route steps linked · 3 pending proof links"
    );
    expect(getSmartPayHistoryProgressHint(routeSnapshotOnly)).toBe(
      "Receipt snapshot completed at 2026-05-28 18:02 UTC. This saved snapshot tracks 3 quoted route steps, with 0 linked proof refs and 3 pending proof links."
    );
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
    expect(getSmartPayHistoryProofEmptyStateHint(snapshotOnly)).toBe(
      "No tx references observed yet."
    );
  });

  it("distinguishes between zero route-linked proof and zero observed tx refs in the active proof panel", () => {
    const withStoredExtraOnly = makeEntry("16b-extra-only", "completed", {
      quote: {
        ...makeEntry("16b-extra-only", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
        ],
      },
      execution: {
        ...makeEntry("16b-extra-only", "completed").execution,
        txRefs: [
          {
            role: "refund",
            network: "acp",
            txid: "fixture-extra-only-refund",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-extra-only-refund",
          },
        ],
      },
      receipt: {
        ...makeEntry("16b-extra-only", "completed").receipt!,
        txRefs: [
          {
            role: "refund",
            network: "acp",
            txid: "fixture-extra-only-refund",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-extra-only-refund",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofTxRefs(withStoredExtraOnly)).toHaveLength(1);
    expect(getSmartPayHistoryProofRouteSteps(withStoredExtraOnly)).toEqual([
      expect.objectContaining({
        stepIndex: 1,
        status: "pending",
        txRef: null,
      }),
    ]);
    expect(getSmartPayHistoryAdditionalProofTxRefs(withStoredExtraOnly)).toEqual([
      expect.objectContaining({
        role: "refund",
        network: "acp",
        txid: "fixture-extra-only-refund",
      }),
    ]);
    expect(getSmartPayHistoryProofEmptyStateHint(withStoredExtraOnly)).toBe(
      "No route-linked tx refs observed yet. Additional observed tx refs are listed separately below."
    );

    const noObservedRefs = makeEntry("16c-no-observed-refs", "pending_reconciliation", {
      quote: {
        ...makeEntry("16c-no-observed-refs", "pending_reconciliation").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "10.0",
          },
        ],
      },
      execution: {
        ...makeEntry("16c-no-observed-refs", "pending_reconciliation").execution,
        txRefs: [],
      },
      receipt: null,
    });

    expect(getSmartPayHistoryProofEmptyStateHint(noObservedRefs)).toBe(
      "No route-linked tx refs observed yet."
    );
    expect(getSmartPayHistoryProofEmptyStateHint(null)).toBe(
      "No tx references observed yet."
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
            txid: "fixture-proof-18",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-18",
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
            txid: "fixture-proof-18",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-18",
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
            txid: "fixture-proof-19",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-19",
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-19",
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
            txid: "fixture-proof-19",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-19",
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-19",
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
            txid: "fixture-proof-20",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20",
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-20",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-20",
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
            txid: "fixture-proof-20",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20",
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-20",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-20",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofRouteSteps(receiptSummaryOnly)).toEqual([
      {
        key: "receipt_route|1",
        stepIndex: 1,
        role: "payment",
        network: "acp",
        kind: "receipt_route",
        fromAsset: "—",
        toAsset: "—",
        label: "Receipt step 1: transfer ACP -> ACP on acp",
        status: "linked",
        txRef: {
          role: "payment",
          network: "acp",
          txid: "fixture-proof-20",
          explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20",
        },
      },
    ]);
    expect(getSmartPayHistoryAdditionalProofTxRefs(receiptSummaryOnly)).toEqual([
      {
        role: "refund",
        network: "acp",
        txid: "fixture-refund-20",
        explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-20",
      },
    ]);
    expect(getSmartPayHistoryAdditionalProofHint(receiptSummaryOnly)).toBe(
      "Additional observed tx refs: refund on acp — refund on acp is stored separately because it does not map to any stored receipt route step yet."
    );
    expect(getSmartPayHistoryProofLabel(receiptSummaryOnly)).toBe(
      "On-chain proof: 1/1 receipt route steps linked"
    );
    expect(getSmartPayHistoryProofHint(receiptSummaryOnly)).toBe(
      "Linked proof covers all stored receipt route steps; 1 explorer link available. 1 additional tx ref is stored separately because it does not map to a stored receipt route step yet."
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
            txid: "fixture-proof-20b",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20b",
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
            txid: "fixture-proof-20b",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20b",
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

  it("does not treat receipt-only refund rows as stored receipt route-proof coverage when no quoted route is available", () => {
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
            txid: "fixture-proof-20c",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20c",
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-20c",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-20c",
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
            txid: "fixture-proof-20c",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20c",
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-20c",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-20c",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofLabel(receiptSummaryWithRefund)).toBe(
      "On-chain proof: 1/1 receipt route steps linked"
    );
    expect(getSmartPayHistoryProofHint(receiptSummaryWithRefund)).toBe(
      "Linked proof covers all stored receipt route steps; 1 explorer link available. 1 additional tx ref is stored separately because it does not map to a stored receipt route step yet."
    );
    expect(getSmartPayHistoryAdditionalProofHint(receiptSummaryWithRefund)).toBe(
      "Additional observed tx refs: refund on acp — refund on acp is stored separately because it does not map to any stored receipt route step yet."
    );
  });

  it("maps receipt-summary-only proof coverage into pending stored receipt route steps when no quoted route exists", () => {
    const receiptSummaryOnly = makeEntry("20d", "completed", {
      quote: {
        ...makeEntry("20d", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("20d", "completed").execution,
        progress: null,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-proof-20d",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20d",
          },
        ],
      },
      receipt: {
        ...makeEntry("20d", "completed").receipt!,
        routeSummary: [
          "1. transfer ACP -> ACP on acp",
          "2. settlement review pending",
        ],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-proof-20d",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20d",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofRouteSteps(receiptSummaryOnly)).toEqual([
      {
        key: "receipt_route|1",
        stepIndex: 1,
        role: "payment",
        network: "acp",
        kind: "receipt_route",
        fromAsset: "—",
        toAsset: "—",
        label: "Receipt step 1: transfer ACP -> ACP on acp",
        status: "linked",
        txRef: {
          role: "payment",
          network: "acp",
          txid: "fixture-proof-20d",
          explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20d",
        },
      },
      {
        key: "receipt_route|2",
        stepIndex: 2,
        role: "receipt_route",
        network: "unknown",
        kind: "receipt_route",
        fromAsset: "—",
        toAsset: "—",
        label: "Receipt step 2: settlement review pending",
        status: "pending",
        txRef: null,
      },
    ]);
    expect(getSmartPayHistoryProgressLabel(receiptSummaryOnly)).toBe(
      "Route progress: 1/2 route steps linked · 1 pending proof link"
    );
    expect(getSmartPayHistoryProgressHint(receiptSummaryOnly)).toBe(
      "Receipt snapshot completed at 2026-05-28 18:02 UTC. This saved snapshot tracks 2 stored receipt route steps, with 1 linked proof ref and 1 pending proof link."
    );
    expect(getSmartPayHistoryPendingProofHint(receiptSummaryOnly)).toBe(
      "Pending stored receipt route proof (1 step): step 2 settlement review pending."
    );
    expect(getSmartPayHistoryProofLabel(receiptSummaryOnly)).toBe(
      "On-chain proof: 1/2 receipt route steps linked"
    );
  });

  it("does not let a stored receipt proof ref with the wrong network satisfy a summary step", () => {
    const receiptSummaryOnly = makeEntry("20d-network-mismatch", "completed", {
      quote: {
        ...makeEntry("20d-network-mismatch", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("20d-network-mismatch", "completed").execution,
        progress: {
          totalRouteSteps: 2,
          observedTxCount: 2,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
        txRefs: [
          {
            role: "payment",
            network: "bsc",
            txid: "fixture-proof-network-mismatch",
            explorerUrl: "https://bscscan.com/tx/fixture-proof-network-mismatch",
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-network-mismatch",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-network-mismatch",
          },
        ],
      },
      receipt: {
        ...makeEntry("20d-network-mismatch", "completed").receipt!,
        routeSummary: ["1. transfer ACP -> ACP on acp", "2. settlement review pending"],
        txRefs: [
          {
            role: "payment",
            network: "bsc",
            txid: "fixture-proof-network-mismatch",
            explorerUrl: "https://bscscan.com/tx/fixture-proof-network-mismatch",
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-network-mismatch",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-network-mismatch",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofRouteSteps(receiptSummaryOnly)).toEqual([
      {
        key: "receipt_route|1",
        stepIndex: 1,
        role: "receipt_route",
        network: "unknown",
        kind: "receipt_route",
        fromAsset: "—",
        toAsset: "—",
        label: "Receipt step 1: transfer ACP -> ACP on acp",
        status: "pending",
        txRef: null,
      },
      {
        key: "receipt_route|2",
        stepIndex: 2,
        role: "receipt_route",
        network: "unknown",
        kind: "receipt_route",
        fromAsset: "—",
        toAsset: "—",
        label: "Receipt step 2: settlement review pending",
        status: "pending",
        txRef: null,
      },
    ]);
    expect(getSmartPayHistoryAdditionalProofTxRefs(receiptSummaryOnly)).toEqual([
      {
        role: "payment",
        network: "bsc",
        txid: "fixture-proof-network-mismatch",
        explorerUrl: "https://bscscan.com/tx/fixture-proof-network-mismatch",
      },
      {
        role: "refund",
        network: "acp",
        txid: "fixture-refund-network-mismatch",
        explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-network-mismatch",
      },
    ]);
    expect(getSmartPayHistoryAdditionalProofTxRefHint(receiptSummaryOnly, getSmartPayHistoryAdditionalProofTxRefs(receiptSummaryOnly)[0]!)).toBe(
      "payment on bsc is stored separately because it does not map to any stored receipt route step yet."
    );
    expect(getSmartPayHistoryAdditionalProofHint(receiptSummaryOnly)).toBe(
      "Additional observed tx refs: payment on bsc — payment on bsc is stored separately because it does not map to any stored receipt route step yet. refund on acp — refund on acp is stored separately because it does not map to any stored receipt route step yet."
    );
    expect(getSmartPayHistoryPendingProofHint(receiptSummaryOnly)).toBe(
      "Pending stored receipt route proof (2 steps): step 1 transfer ACP -> ACP on acp → step 2 settlement review pending."
    );
  });

  it("does not let a generic transfer-style proof ref satisfy unrelated stored receipt summary text", () => {
    const receiptSummaryOnly = makeEntry("20d-transfer-mismatch", "completed", {
      quote: {
        ...makeEntry("20d-transfer-mismatch", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("20d-transfer-mismatch", "completed").execution,
        progress: {
          totalRouteSteps: 2,
          observedTxCount: 2,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-proof-transfer-mismatch",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-transfer-mismatch",
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-transfer-mismatch",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-transfer-mismatch",
          },
        ],
      },
      receipt: {
        ...makeEntry("20d-transfer-mismatch", "completed").receipt!,
        routeSummary: ["1. transfer ACP -> ACP on acp", "2. settlement review pending"],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-proof-transfer-mismatch",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-transfer-mismatch",
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-transfer-mismatch",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-transfer-mismatch",
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofRouteSteps(receiptSummaryOnly)).toEqual([
      {
        key: "receipt_route|1",
        stepIndex: 1,
        role: "payment",
        network: "acp",
        kind: "receipt_route",
        fromAsset: "—",
        toAsset: "—",
        label: "Receipt step 1: transfer ACP -> ACP on acp",
        status: "linked",
        txRef: {
          role: "payment",
          network: "acp",
          txid: "fixture-proof-transfer-mismatch",
          explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-transfer-mismatch",
        },
      },
      {
        key: "receipt_route|2",
        stepIndex: 2,
        role: "receipt_route",
        network: "unknown",
        kind: "receipt_route",
        fromAsset: "—",
        toAsset: "—",
        label: "Receipt step 2: settlement review pending",
        status: "pending",
        txRef: null,
      },
    ]);
    expect(getSmartPayHistoryAdditionalProofTxRefs(receiptSummaryOnly)).toEqual([
      {
        role: "refund",
        network: "acp",
        txid: "fixture-refund-transfer-mismatch",
        explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-transfer-mismatch",
      },
    ]);
    expect(getSmartPayHistoryAdditionalProofHint(receiptSummaryOnly)).toBe(
      "Additional observed tx refs: refund on acp — refund on acp is stored separately because it does not map to any stored receipt route step yet."
    );
    expect(getSmartPayHistoryPendingProofHint(receiptSummaryOnly)).toBe(
      "Pending stored receipt route proof (1 step): step 2 settlement review pending."
    );
  });

  it("surfaces pending stored receipt route proof hints when only receipt-summary context remains", () => {
    const conflictingIndexedRef = makeEntry("20f", "completed", {
      quote: {
        ...makeEntry("20f", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("20f", "completed").execution,
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
            txid: "fixture-proof-20f",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20f",
            routeStepIndex: 1,
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-20f",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-20f",
            routeStepIndex: 1,
          },
        ],
      },
      receipt: {
        ...makeEntry("20f", "completed").receipt!,
        routeSummary: ["1. transfer ACP -> ACP on acp"],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-proof-20f",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20f",
            routeStepIndex: 1,
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-20f",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-20f",
            routeStepIndex: 1,
          },
        ],
      },
    });

    expect(getSmartPayHistoryAdditionalProofTxRefHint(conflictingIndexedRef, getSmartPayHistoryAdditionalProofTxRefs(conflictingIndexedRef)[0]!)).toBe(
      "Claims stored receipt route step 1, but that step is already linked to payment on acp in this snapshot."
    );
    expect(getSmartPayHistoryAdditionalProofHint(conflictingIndexedRef)).toBe(
      "Additional observed tx refs: refund on acp — Claims stored receipt route step 1, but that step is already linked to payment on acp in this snapshot."
    );

    const incompatibleIndexedRef = makeEntry("20g", "completed", {
      quote: {
        ...makeEntry("20g", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("20g", "completed").execution,
        progress: {
          totalRouteSteps: 2,
          observedTxCount: 2,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-proof-20g",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20g",
            routeStepIndex: 1,
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-20g",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-20g",
            routeStepIndex: 2,
          },
        ],
      },
      receipt: {
        ...makeEntry("20g", "completed").receipt!,
        routeSummary: [
          "1. transfer ACP -> ACP on acp",
          "2. settlement review pending",
        ],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-proof-20g",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20g",
            routeStepIndex: 1,
          },
          {
            role: "refund",
            network: "acp",
            txid: "fixture-refund-20g",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-20g",
            routeStepIndex: 2,
          },
        ],
      },
    });

    expect(getSmartPayHistoryProofRouteSteps(incompatibleIndexedRef)).toEqual([
      {
        key: "receipt_route|1",
        stepIndex: 1,
        role: "payment",
        network: "acp",
        kind: "receipt_route",
        fromAsset: "—",
        toAsset: "—",
        label: "Receipt step 1: transfer ACP -> ACP on acp",
        status: "linked",
        txRef: {
          role: "payment",
          network: "acp",
          txid: "fixture-proof-20g",
          explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20g",
          routeStepIndex: 1,
        },
      },
      {
        key: "receipt_route|2",
        stepIndex: 2,
        role: "receipt_route",
        network: "unknown",
        kind: "receipt_route",
        fromAsset: "—",
        toAsset: "—",
        label: "Receipt step 2: settlement review pending",
        status: "pending",
        txRef: null,
      },
    ]);
    expect(getSmartPayHistoryAdditionalProofTxRefs(incompatibleIndexedRef)).toEqual([
      {
        role: "refund",
        network: "acp",
        txid: "fixture-refund-20g",
        explorerUrl: "https://ancap.cloud/acp/tx/fixture-refund-20g",
        routeStepIndex: 2,
      },
    ]);
    expect(getSmartPayHistoryAdditionalProofTxRefHint(incompatibleIndexedRef, getSmartPayHistoryAdditionalProofTxRefs(incompatibleIndexedRef)[0]!)).toBe(
      "Claims stored receipt route step 2, but that stored step summary does not match refund on acp."
    );
    expect(getSmartPayHistoryAdditionalProofHint(incompatibleIndexedRef)).toBe(
      "Additional observed tx refs: refund on acp — Claims stored receipt route step 2, but that stored step summary does not match refund on acp."
    );
    expect(getSmartPayHistoryPendingProofHint(incompatibleIndexedRef)).toBe(
      "Pending stored receipt route proof (1 step): step 2 settlement review pending."
    );

    const receiptSummaryOnly = makeEntry("20e", "completed", {
      quote: {
        ...makeEntry("20e", "completed").quote!,
        route: [],
      },
      execution: {
        ...makeEntry("20e", "completed").execution,
        progress: {
          totalRouteSteps: 3,
          observedTxCount: 1,
          remainingRouteSteps: 2,
          pendingRoles: [],
        },
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-proof-20e",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20e",
          },
        ],
      },
      receipt: {
        ...makeEntry("20e", "completed").receipt!,
        routeSummary: [
          "1. transfer ACP -> ACP on acp",
          "2. settlement review pending",
          "3. final receipt export pending",
        ],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "fixture-proof-20e",
            explorerUrl: "https://ancap.cloud/acp/tx/fixture-proof-20e",
          },
        ],
      },
    });

    expect(getSmartPayHistoryPendingProofHint(receiptSummaryOnly)).toBe(
      "Pending stored receipt route proof (2 steps): step 2 settlement review pending → step 3 final receipt export pending."
    );
    expect(getSmartPayHistoryProofLabel(receiptSummaryOnly)).toBe(
      "On-chain proof: 1/3 receipt route steps linked"
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
    expect(normalizeSmartPayRecoveryToken(" https://bscscan.com/tx/fixture-tx-alpha ")).toBe("fixture-tx-alpha");
    expect(normalizeSmartPayRecoveryToken("https://ancap.cloud/acp/tx/fixture-tx-beta?foo=bar")).toBe("fixture-tx-beta");
    expect(normalizeSmartPayRecoveryToken("https://ancap.cloud/acp/transactions/fixture-route-proof?source=wallet")).toBe("fixture-route-proof");
    expect(normalizeSmartPayRecoveryToken("https://example.com/?txHash=fixture-feed-proof")).toBe("fixture-feed-proof");
    expect(normalizeSmartPayRecoveryToken("fixture-raw-entry")).toBe("fixture-raw-entry");

    expect(
      extractSmartPayRecoveryTxs(
        "fixture-raw-entry\nhttps://bscscan.com/tx/fixture-tx-alpha, https://example.com/?txHash=fixture-feed-proof fixture-raw-entry"
      )
    ).toEqual(["fixture-raw-entry", "fixture-tx-alpha", "fixture-feed-proof"]);

    expect(
      parseSmartPayRecoveryInput(
        "fixture-raw-entry\nhttps://bscscan.com/tx/fixture-tx-alpha, https://ancap.cloud/acp/transactions/fixture-route-proof?source=wallet https://example.com/?txHash=fixture-feed-proof fixture-raw-entry"
      ).refs
    ).toEqual([
      {
        txid: "fixture-raw-entry",
        network: null,
        explorerUrl: null,
      },
      {
        txid: "fixture-tx-alpha",
        network: "bsc",
        explorerUrl: "https://bscscan.com/tx/fixture-tx-alpha",
      },
      {
        txid: "fixture-route-proof",
        network: "acp",
        explorerUrl: "https://ancap.cloud/acp/transactions/fixture-route-proof?source=wallet",
      },
      {
        txid: "fixture-feed-proof",
        network: null,
        explorerUrl: "https://example.com/?txHash=fixture-feed-proof",
      },
    ]);
  });

  it("ignores unparseable recovery locator noise while surfacing duplicates and invalid tokens", () => {
    expect(normalizeSmartPayRecoveryToken("bscscan.com/tx/fixture-tx-alpha")).toBe("fixture-tx-alpha");
    expect(normalizeSmartPayRecoveryToken("example.com/not-a-tx")).toBeNull();
    expect(normalizeSmartPayRecoveryToken("https://example.com/not-a-tx")).toBeNull();

    expect(
      parseSmartPayRecoveryInput(
        "fixture-raw-entry bscscan.com/tx/fixture-tx-alpha https://example.com/not-a-tx FIXTURE-RAW-ENTRY"
      )
    ).toEqual({
      refs: [
        {
          txid: "fixture-raw-entry",
          network: null,
          explorerUrl: null,
        },
        {
          txid: "fixture-tx-alpha",
          network: "bsc",
          explorerUrl: "https://bscscan.com/tx/fixture-tx-alpha",
        },
      ],
      txids: ["fixture-raw-entry", "fixture-tx-alpha"],
      duplicateTokens: ["FIXTURE-RAW-ENTRY"],
      invalidTokens: ["https://example.com/not-a-tx"],
    });
  });

  it("formats parsed recovery refs for UI preview so users can see preserved network/link metadata", () => {
    expect(
      formatSmartPayRecoveryRefPreview({
        txid: "fixture-tx-alpha",
        network: "bsc",
        explorerUrl: "https://bscscan.com/tx/fixture-tx-alpha",
      })
    ).toBe("BSC · fixture-tx-alpha · explorer link preserved");

    expect(
      formatSmartPayRecoveryRefPreview({
        txid: "fixture-raw-entry",
        network: null,
        explorerUrl: null,
      })
    ).toBe("Unspecified network · fixture-raw-entry · raw tx hash only");
  });

  it("allows status-only recover with empty input but blocks recover submissions when only invalid locator noise is pasted", () => {
    expect(canSubmitSmartPayRecoveryInput("")).toBe(true);
    expect(canSubmitSmartPayRecoveryInput("   ")).toBe(true);
    expect(getSmartPayRecoveryInputBlockReason("")).toBeNull();

    expect(canSubmitSmartPayRecoveryInput("fixture-raw-entry https://example.com/not-a-tx")).toBe(true);
    expect(getSmartPayRecoveryInputBlockReason("fixture-raw-entry https://example.com/not-a-tx")).toBeNull();

    expect(canSubmitSmartPayRecoveryInput("https://example.com/not-a-tx badorigin/tx/not-real")).toBe(false);
    expect(
      getSmartPayRecoveryInputBlockReason("https://example.com/not-a-tx badorigin/tx/not-real")
    ).toBe(
      "No valid tx hash or explorer link was parsed from this recovery input. Fix the pasted values or clear the field to run a status-only recovery pass."
    );
  });
});
