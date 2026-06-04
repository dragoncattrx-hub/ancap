import { beforeEach, describe, expect, it, vi } from "vitest";

const { store, secureStore } = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    secureStore: {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
      getItemAsync: vi.fn(async (key: string) => store.get(key) ?? null),
      setItemAsync: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      deleteItemAsync: vi.fn(async (key: string) => {
        store.delete(key);
      }),
    },
  };
});

vi.mock("expo-secure-store", () => secureStore);

import {
  buildSmartPayRemoteHistoryEntries,
  clearSmartPayHistory,
  clearSmartPayHistorySnapshots,
  loadSmartPayHistory,
  loadSmartPayHistoryTimeline,
  mergeSmartPayActiveHistoryEntry,
  mergeSmartPayHistoryEntries,
  mergeSmartPayHistoryWithRemotePayments,
  saveSmartPayHistoryEntry,
  type SmartPayHistoryEntry,
} from "./smart-pay-history";
import { extractSmartPayRecoveryTxs, parseSmartPayRecoveryInput } from "./smart-pay-recovery";

function makeEntry(id: string, status: SmartPayHistoryEntry["execution"]["status"] = "completed"): SmartPayHistoryEntry {
  return {
    id: `exec-${id}`,
    savedAt: `2026-05-28T16:4${id}:00.000Z`,
    intent: {
      id: `intent-${id}`,
      createdAt: "2026-05-28T16:40:00.000Z",
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
        value: "12.5",
        atomicValue: "1250000000",
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
      expiresAt: "2026-05-28T16:50:00.000Z",
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
      targetAmount: "12.5",
      requiredSourceAmount: "12.7",
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
      createdAt: "2026-05-28T16:41:00.000Z",
      updatedAt: "2026-05-28T16:42:00.000Z",
      recoverable: status !== "completed",
      nextAction: status === "completed" ? null : "refresh_status",
      txRefs: [
        {
          role: "payment",
          network: "acp",
          txid: `tx-${id}`,
          explorerUrl: null,
        },
      ],
      error: status === "failed" ? "execution_failed" : null,
    },
    sessionToken: `session-${id}`,
    receipt: {
      id: `receipt-${id}`,
      paymentExecutionId: `exec-${id}`,
      paymentIntentId: `intent-${id}`,
      completedAt: "2026-05-28T16:42:00.000Z",
      sourceAssetSpent: "ACP",
      sourceAmountSpent: "12.7",
      targetAssetPaid: "ACP",
      targetAmountPaid: "12.5",
      serviceFeeAcp: "0.2",
      networkFees: [],
      recipientAddress: `acp_test_${id}`,
      merchantLabel: null,
      routeSummary: ["1. transfer ACP -> ACP on acp"],
      txRefs: [
        {
          role: "payment",
          network: "acp",
          txid: `tx-${id}`,
          explorerUrl: null,
        },
      ],
    },
  };
}

describe("smart pay history helpers", () => {
  beforeEach(async () => {
    store.clear();
    secureStore.getItemAsync.mockClear();
    secureStore.setItemAsync.mockClear();
    secureStore.deleteItemAsync.mockClear();
    await clearSmartPayHistory();
  });

  it("stores newest execution first and de-duplicates by execution id", async () => {
    await saveSmartPayHistoryEntry(makeEntry("1", "pending_reconciliation"));
    await saveSmartPayHistoryEntry(makeEntry("2", "completed"));
    const afterUpdate = await saveSmartPayHistoryEntry(makeEntry("1", "completed"));

    expect(afterUpdate).toHaveLength(2);
    expect(afterUpdate[0]?.id).toBe("exec-1");
    expect(afterUpdate[0]?.execution.status).toBe("completed");
    expect(afterUpdate[0]?.receipt?.paymentExecutionId).toBe("exec-1");
    expect(afterUpdate[1]?.id).toBe("exec-2");
  });

  it("limits stored history to the most recent entries", async () => {
    for (let index = 0; index < 10; index += 1) {
      await saveSmartPayHistoryEntry(makeEntry(String(index)));
    }

    const loaded = await loadSmartPayHistory();
    expect(loaded).toHaveLength(8);
    expect(loaded[0]?.id).toBe("exec-9");
    expect(loaded[7]?.id).toBe("exec-2");
  });

  it("prefers richer duplicate entries when local and backend history overlap", () => {
    const localPending = makeEntry("4", "pending_reconciliation");
    const remoteCompleted = {
      ...makeEntry("4", "completed"),
      savedAt: "2026-05-28T16:49:00.000Z",
      execution: {
        ...makeEntry("4", "completed").execution,
        updatedAt: "2026-05-28T16:49:00.000Z",
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "tx-4-complete",
            explorerUrl: "https://ancap.cloud/acp/tx/tx-4-complete",
          },
        ],
        progress: {
          totalRouteSteps: 1,
          observedTxCount: 1,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
      },
      receipt: {
        ...makeEntry("4", "completed").receipt!,
        completedAt: "2026-05-28T16:49:00.000Z",
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "tx-4-complete",
            explorerUrl: "https://ancap.cloud/acp/tx/tx-4-complete",
          },
        ],
      },
    };

    const merged = mergeSmartPayHistoryEntries([localPending, remoteCompleted]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.execution.status).toBe("completed");
    expect(merged[0]?.receipt?.txRefs[0]?.txid).toBe("tx-4-complete");
    expect(merged[0]?.savedAt).toBe("2026-05-28T16:49:00.000Z");
    expect(merged[0]?.sessionToken).toBe("session-4");
  });

  it("prefers a local session token when backend history overlaps without one", () => {
    const localPending = makeEntry("5", "pending_reconciliation");
    const remoteCompleted = {
      ...makeEntry("5", "completed"),
      sessionToken: null,
      savedAt: "2026-05-28T16:59:00.000Z",
    };

    const merged = mergeSmartPayHistoryEntries([remoteCompleted, localPending]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.execution.status).toBe("completed");
    expect(merged[0]?.sessionToken).toBe("session-5");
  });

  it("preserves richer local proof refs and receipt context when backend history overlaps with a final execution", () => {
    const localPending = {
      ...makeEntry("5-proof", "pending_reconciliation"),
      execution: {
        ...makeEntry("5-proof", "pending_reconciliation").execution,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "tx-5-proof",
            explorerUrl: "https://ancap.cloud/acp/tx/tx-5-proof",
          },
        ],
        progress: {
          totalRouteSteps: 1,
          observedTxCount: 1,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
      },
      receipt: {
        ...makeEntry("5-proof", "pending_reconciliation").receipt!,
        merchantLabel: "Merchant from local recovery",
        networkFees: [
          {
            network: "acp",
            assetSymbol: "ACP",
            amount: "0.03",
          },
        ],
        routeSummary: [
          "1. transfer ACP -> ACP on acp",
          "2. local recovery proof attached",
        ],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "tx-5-proof",
            explorerUrl: "https://ancap.cloud/acp/tx/tx-5-proof",
          },
        ],
      },
    };
    const remoteCompleted = {
      ...makeEntry("5-proof", "completed"),
      sessionToken: null,
      savedAt: "2026-05-28T16:59:00.000Z",
      execution: {
        ...makeEntry("5-proof", "completed").execution,
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "tx-5-proof",
            explorerUrl: null,
          },
        ],
        progress: {
          totalRouteSteps: 1,
          observedTxCount: 1,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
      },
      receipt: {
        ...makeEntry("5-proof", "completed").receipt!,
        networkFees: [
          {
            network: "bsc",
            assetSymbol: "USDT",
            amount: "0.10",
          },
        ],
        routeSummary: ["1. transfer ACP -> ACP on acp"],
        txRefs: [
          {
            role: "payment",
            network: "acp",
            txid: "tx-5-proof",
            explorerUrl: null,
          },
        ],
      },
    };

    const merged = mergeSmartPayHistoryEntries([remoteCompleted, localPending]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.execution.status).toBe("completed");
    expect(merged[0]?.sessionToken).toBe("session-5-proof");
    expect(merged[0]?.execution.txRefs).toEqual([
      {
        role: "payment",
        network: "acp",
        txid: "tx-5-proof",
        explorerUrl: "https://ancap.cloud/acp/tx/tx-5-proof",
      },
    ]);
    expect(merged[0]?.execution.progress).toEqual({
      totalRouteSteps: 1,
      observedTxCount: 1,
      remainingRouteSteps: 0,
      pendingRoles: [],
    });
    expect(merged[0]?.receipt?.merchantLabel).toBe("Merchant from local recovery");
    expect(merged[0]?.receipt?.networkFees).toEqual([
      {
        network: "acp",
        assetSymbol: "ACP",
        amount: "0.03",
      },
      {
        network: "bsc",
        assetSymbol: "USDT",
        amount: "0.10",
      },
    ]);
    expect(merged[0]?.receipt?.routeSummary).toEqual([
      "1. transfer ACP -> ACP on acp",
      "2. local recovery proof attached",
    ]);
    expect(merged[0]?.receipt?.txRefs).toEqual([
      {
        role: "payment",
        network: "acp",
        txid: "tx-5-proof",
        explorerUrl: "https://ancap.cloud/acp/tx/tx-5-proof",
      },
    ]);
  });

  it("merges distinct tx proof refs from local and backend history when the same execution overlaps", () => {
    const localPending = {
      ...makeEntry("5-merge", "pending_reconciliation"),
      execution: {
        ...makeEntry("5-merge", "pending_reconciliation").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "0xbridge-local",
            explorerUrl: "https://ancap.cloud/acp/tx/0xbridge-local",
          },
        ],
        progress: {
          totalRouteSteps: 2,
          observedTxCount: 1,
          remainingRouteSteps: 1,
          pendingRoles: ["merchant_payout"],
        },
      },
      receipt: {
        ...makeEntry("5-merge", "pending_reconciliation").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "0xbridge-local",
            explorerUrl: "https://ancap.cloud/acp/tx/0xbridge-local",
          },
        ],
      },
    };
    const remoteCompleted = {
      ...makeEntry("5-merge", "completed"),
      sessionToken: null,
      savedAt: "2026-05-28T17:01:00.000Z",
      execution: {
        ...makeEntry("5-merge", "completed").execution,
        txRefs: [
          {
            role: "merchant_payout",
            network: "bsc",
            txid: "0xmerchant-remote",
            explorerUrl: "https://bscscan.com/tx/0xmerchant-remote",
          },
        ],
        progress: {
          totalRouteSteps: 2,
          observedTxCount: 2,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
      },
    };

    const merged = mergeSmartPayHistoryEntries([remoteCompleted, localPending]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.execution.status).toBe("completed");
    expect(merged[0]?.execution.txRefs).toEqual([
      {
        role: "merchant_payout",
        network: "bsc",
        txid: "0xmerchant-remote",
        explorerUrl: "https://bscscan.com/tx/0xmerchant-remote",
      },
      {
        role: "bridge",
        network: "acp",
        txid: "0xbridge-local",
        explorerUrl: "https://ancap.cloud/acp/tx/0xbridge-local",
      },
    ]);
    expect(merged[0]?.execution.progress).toEqual({
      totalRouteSteps: 2,
      observedTxCount: 2,
      remainingRouteSteps: 0,
      pendingRoles: [],
    });
  });

  it("prefers explicit routeStepIndex metadata when overlapping history snapshots merge the same tx ref", () => {
    const localIndexed = {
      ...makeEntry("5-step-index", "pending_reconciliation"),
      execution: {
        ...makeEntry("5-step-index", "pending_reconciliation").execution,
        txRefs: [
          {
            role: "swap",
            network: "bsc",
            txid: "0xswap-indexed",
            explorerUrl: "https://bscscan.com/tx/0xswap-indexed",
            routeStepIndex: 2,
          },
        ],
      },
      receipt: {
        ...makeEntry("5-step-index", "pending_reconciliation").receipt!,
        txRefs: [
          {
            role: "swap",
            network: "bsc",
            txid: "0xswap-indexed",
            explorerUrl: "https://bscscan.com/tx/0xswap-indexed",
            routeStepIndex: 2,
          },
        ],
      },
    };
    const remoteUnindexed = {
      ...makeEntry("5-step-index", "completed"),
      sessionToken: null,
      savedAt: "2026-05-28T17:06:00.000Z",
      execution: {
        ...makeEntry("5-step-index", "completed").execution,
        txRefs: [
          {
            role: "swap",
            network: "bsc",
            txid: "0xswap-indexed",
            explorerUrl: "https://bscscan.com/tx/0xswap-indexed",
          },
        ],
      },
      receipt: {
        ...makeEntry("5-step-index", "completed").receipt!,
        txRefs: [
          {
            role: "swap",
            network: "bsc",
            txid: "0xswap-indexed",
            explorerUrl: "https://bscscan.com/tx/0xswap-indexed",
          },
        ],
      },
    };

    const merged = mergeSmartPayHistoryEntries([remoteUnindexed, localIndexed]);

    expect(merged[0]?.execution.txRefs).toEqual([
      {
        role: "swap",
        network: "bsc",
        txid: "0xswap-indexed",
        explorerUrl: "https://bscscan.com/tx/0xswap-indexed",
        routeStepIndex: 2,
      },
    ]);
    expect(merged[0]?.receipt?.txRefs).toEqual([
      {
        role: "swap",
        network: "bsc",
        txid: "0xswap-indexed",
        explorerUrl: "https://bscscan.com/tx/0xswap-indexed",
        routeStepIndex: 2,
      },
    ]);
  });

  it("normalizes stale completed overlaps back to pending reconciliation when route proof is still missing", () => {
    const localPending: SmartPayHistoryEntry = {
      ...makeEntry("5-stale-complete", "pending_reconciliation"),
      quote: {
        ...makeEntry("5-stale-complete", "pending_reconciliation").quote!,
        mode: "swap_then_send",
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "12.4",
          },
          {
            kind: "swap",
            network: "bsc",
            dexOrRail: "pancakeswap",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "12.3",
          },
        ],
      },
      execution: {
        ...makeEntry("5-stale-complete", "pending_reconciliation").execution,
        status: "pending_reconciliation",
        nextAction: "refresh_status",
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "0xbridge-only",
            explorerUrl: "https://ancap.cloud/acp/tx/0xbridge-only",
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
      receipt: {
        ...makeEntry("5-stale-complete", "pending_reconciliation").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "0xbridge-only",
            explorerUrl: "https://ancap.cloud/acp/tx/0xbridge-only",
            routeStepIndex: 1,
          },
        ],
      },
    };
    const staleRemoteCompleted: SmartPayHistoryEntry = {
      ...makeEntry("5-stale-complete", "completed"),
      sessionToken: null,
      savedAt: "2026-05-28T17:07:00.000Z",
      quote: localPending.quote,
      execution: {
        ...makeEntry("5-stale-complete", "completed").execution,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "0xbridge-only",
            explorerUrl: null,
          },
        ],
        progress: {
          totalRouteSteps: 2,
          observedTxCount: 2,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
      },
      receipt: {
        ...makeEntry("5-stale-complete", "completed").receipt!,
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "0xbridge-only",
            explorerUrl: null,
          },
        ],
      },
    };

    const merged = mergeSmartPayHistoryEntries([staleRemoteCompleted, localPending]);

    expect(merged[0]?.execution.status).toBe("pending_reconciliation");
    expect(merged[0]?.execution.recoverable).toBe(true);
    expect(merged[0]?.execution.nextAction).toBeNull();
    expect(merged[0]?.execution.progress).toEqual({
      totalRouteSteps: 2,
      observedTxCount: 1,
      remainingRouteSteps: 1,
      pendingRoles: ["swap"],
    });
  });

  it("normalizes stored completed snapshots without tx proof back to awaiting local signature", async () => {
    await saveSmartPayHistoryEntry({
      ...makeEntry("5-awaiting-signature", "completed"),
      quote: {
        ...makeEntry("5-awaiting-signature", "completed").quote!,
        mode: "direct_send",
        route: [
          {
            kind: "transfer",
            network: "acp",
            dexOrRail: null,
            fromAsset: "ACP",
            toAsset: "ACP",
            estimatedOut: "12.5",
          },
        ],
      },
      execution: {
        ...makeEntry("5-awaiting-signature", "completed").execution,
        txRefs: [],
        progress: {
          totalRouteSteps: 1,
          observedTxCount: 1,
          remainingRouteSteps: 0,
          pendingRoles: [],
        },
      },
      receipt: null,
    });

    const loaded = await loadSmartPayHistory();

    expect(loaded[0]?.execution.status).toBe("awaiting_local_signature");
    expect(loaded[0]?.execution.recoverable).toBe(true);
    expect(loaded[0]?.execution.nextAction).toBe("sign_direct_send_tx");
    expect(loaded[0]?.execution.progress).toEqual({
      totalRouteSteps: 1,
      observedTxCount: 0,
      remainingRouteSteps: 1,
      pendingRoles: ["payment"],
    });
  });

  it("builds remote history entries without session-token access and preserves backend receipt snapshots", () => {
    const remote = buildSmartPayRemoteHistoryEntries([
      {
        execution: {
          ...makeEntry("7", "completed").execution,
          updatedAt: "2026-05-28T17:00:00.000Z",
        },
        receipt: {
          ...makeEntry("7", "completed").receipt!,
          completedAt: "2026-05-28T17:00:00.000Z",
        },
        paymentIntent: makeEntry("7", "completed").intent,
        quote: makeEntry("7", "completed").quote!,
      },
    ]);

    expect(remote).toHaveLength(1);
    expect(remote[0]?.id).toBe("exec-7");
    expect(remote[0]?.sessionToken).toBeNull();
    expect(remote[0]?.savedAt).toBe("2026-05-28T17:00:00.000Z");
    expect(remote[0]?.receipt?.paymentExecutionId).toBe("exec-7");
  });

  it("merges remote backend history with local snapshots while preserving local session access", () => {
    const localPending = makeEntry("8", "pending_reconciliation");
    const remotePayments = [
      {
        execution: {
          ...makeEntry("8", "completed").execution,
          updatedAt: "2026-05-28T17:05:00.000Z",
          txRefs: [
            {
              role: "payment",
              network: "acp",
              txid: "tx-8-complete",
              explorerUrl: "https://ancap.cloud/acp/tx/tx-8-complete",
            },
          ],
        },
        receipt: {
          ...makeEntry("8", "completed").receipt!,
          completedAt: "2026-05-28T17:05:00.000Z",
          txRefs: [
            {
              role: "payment",
              network: "acp",
              txid: "tx-8-complete",
              explorerUrl: "https://ancap.cloud/acp/tx/tx-8-complete",
            },
          ],
        },
        paymentIntent: makeEntry("8", "completed").intent,
        quote: makeEntry("8", "completed").quote!,
      },
    ];

    const merged = mergeSmartPayHistoryWithRemotePayments([localPending], remotePayments);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.execution.status).toBe("completed");
    expect(merged[0]?.sessionToken).toBe("session-8");
    expect(merged[0]?.receipt?.txRefs[0]?.txid).toBe("tx-8-complete");
  });

  it("merges the active execution snapshot with matching saved history so richer overlap context survives on-screen", () => {
    const savedHistoryEntry: SmartPayHistoryEntry = {
      ...makeEntry("active-merge", "completed"),
      snapshotOrigin: "local+backend" as const,
      sessionToken: "session-active-merge",
      savedAt: "2026-05-28T17:14:00.000Z",
      execution: {
        ...makeEntry("active-merge", "completed").execution,
        updatedAt: "2026-05-28T17:14:00.000Z",
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "0xbridge-active",
            explorerUrl: "https://ancap.cloud/acp/tx/0xbridge-active",
            routeStepIndex: 1,
          },
          {
            role: "merchant_payout",
            network: "bsc",
            txid: "0xmerchant-active",
            explorerUrl: "https://bscscan.com/tx/0xmerchant-active",
            routeStepIndex: 3,
          },
        ],
        progress: {
          totalRouteSteps: 3,
          observedTxCount: 2,
          remainingRouteSteps: 1,
          pendingRoles: ["swap"],
        },
      },
      receipt: {
        ...makeEntry("active-merge", "completed").receipt!,
        merchantLabel: "Merged merchant",
        completedAt: "2026-05-28T17:14:00.000Z",
        routeSummary: [
          "1. bridge ACP -> wACP on acp",
          "2. swap wACP -> USDT on bsc",
          "3. transfer USDT -> USDT on bsc",
        ],
        networkFees: [
          {
            network: "acp",
            assetSymbol: "ACP",
            amount: "0.02",
          },
          {
            network: "bsc",
            assetSymbol: "USDT",
            amount: "0.11",
          },
        ],
        txRefs: [
          {
            role: "bridge",
            network: "acp",
            txid: "0xbridge-active",
            explorerUrl: "https://ancap.cloud/acp/tx/0xbridge-active",
            routeStepIndex: 1,
          },
          {
            role: "merchant_payout",
            network: "bsc",
            txid: "0xmerchant-active",
            explorerUrl: "https://bscscan.com/tx/0xmerchant-active",
            routeStepIndex: 3,
          },
        ],
      },
      quote: {
        ...makeEntry("active-merge", "completed").quote!,
        route: [
          {
            kind: "bridge",
            network: "acp",
            dexOrRail: "ancap_bridge_v1",
            fromAsset: "ACP",
            toAsset: "wACP",
            estimatedOut: "12.4",
          },
          {
            kind: "swap",
            network: "bsc",
            dexOrRail: "pancakeswap",
            fromAsset: "wACP",
            toAsset: "USDT",
            estimatedOut: "12.3",
          },
          {
            kind: "transfer",
            network: "bsc",
            dexOrRail: null,
            fromAsset: "USDT",
            toAsset: "USDT",
            estimatedOut: "12.2",
          },
        ],
      },
    };

    const currentScreenSnapshot: SmartPayHistoryEntry = {
      ...makeEntry("active-merge", "pending_reconciliation"),
      snapshotOrigin: "local" as const,
      sessionToken: "session-active-merge",
      savedAt: "2026-05-28T17:12:00.000Z",
      execution: {
        ...makeEntry("active-merge", "pending_reconciliation").execution,
        updatedAt: "2026-05-28T17:12:00.000Z",
        txRefs: [
          {
            role: "swap",
            network: "bsc",
            txid: "0xswap-screen",
            explorerUrl: "https://bscscan.com/tx/0xswap-screen",
            routeStepIndex: 2,
          },
        ],
        progress: {
          totalRouteSteps: 3,
          observedTxCount: 1,
          remainingRouteSteps: 2,
          pendingRoles: ["swap", "merchant_payout"],
        },
      },
      receipt: {
        ...makeEntry("active-merge", "pending_reconciliation").receipt!,
        completedAt: "2026-05-28T17:12:00.000Z",
        routeSummary: ["2. local refresh captured swap proof"],
        txRefs: [
          {
            role: "swap",
            network: "bsc",
            txid: "0xswap-screen",
            explorerUrl: "https://bscscan.com/tx/0xswap-screen",
            routeStepIndex: 2,
          },
        ],
      },
      quote: savedHistoryEntry.quote,
    };

    const merged = mergeSmartPayActiveHistoryEntry(savedHistoryEntry, currentScreenSnapshot);

    expect(merged.snapshotOrigin).toBe("local+backend");
    expect(merged.sessionToken).toBe("session-active-merge");
    expect(merged.execution.status).toBe("completed");
    expect(merged.execution.txRefs).toEqual([
      {
        role: "bridge",
        network: "acp",
        txid: "0xbridge-active",
        explorerUrl: "https://ancap.cloud/acp/tx/0xbridge-active",
        routeStepIndex: 1,
      },
      {
        role: "merchant_payout",
        network: "bsc",
        txid: "0xmerchant-active",
        explorerUrl: "https://bscscan.com/tx/0xmerchant-active",
        routeStepIndex: 3,
      },
      {
        role: "swap",
        network: "bsc",
        txid: "0xswap-screen",
        explorerUrl: "https://bscscan.com/tx/0xswap-screen",
        routeStepIndex: 2,
      },
    ]);
    expect(merged.execution.progress).toEqual({
      totalRouteSteps: 3,
      observedTxCount: 3,
      remainingRouteSteps: 0,
      pendingRoles: [],
    });
    expect(merged.receipt?.routeSummary).toEqual([
      "1. bridge ACP -> wACP on acp",
      "2. swap wACP -> USDT on bsc",
      "3. transfer USDT -> USDT on bsc",
      "2. local refresh captured swap proof",
    ]);
    expect(merged.receipt?.txRefs).toEqual([
      {
        role: "bridge",
        network: "acp",
        txid: "0xbridge-active",
        explorerUrl: "https://ancap.cloud/acp/tx/0xbridge-active",
        routeStepIndex: 1,
      },
      {
        role: "merchant_payout",
        network: "bsc",
        txid: "0xmerchant-active",
        explorerUrl: "https://bscscan.com/tx/0xmerchant-active",
        routeStepIndex: 3,
      },
      {
        role: "swap",
        network: "bsc",
        txid: "0xswap-screen",
        explorerUrl: "https://bscscan.com/tx/0xswap-screen",
        routeStepIndex: 2,
      },
    ]);
    expect(merged.receipt?.networkFees).toEqual([
      {
        network: "acp",
        assetSymbol: "ACP",
        amount: "0.02",
      },
      {
        network: "bsc",
        assetSymbol: "USDT",
        amount: "0.11",
      },
    ]);
  });

  it("loads a merged history timeline from local snapshots plus backend history when available", async () => {
    await saveSmartPayHistoryEntry(makeEntry("timeline", "pending_reconciliation"));

    const remoteList = vi.fn(async () => [
      {
        execution: {
          ...makeEntry("timeline", "completed").execution,
          updatedAt: "2026-05-28T17:10:00.000Z",
          txRefs: [
            {
              role: "payment",
              network: "acp",
              txid: "tx-timeline-complete",
              explorerUrl: "https://ancap.cloud/acp/tx/tx-timeline-complete",
            },
          ],
        },
        receipt: {
          ...makeEntry("timeline", "completed").receipt!,
          completedAt: "2026-05-28T17:10:00.000Z",
          txRefs: [
            {
              role: "payment",
              network: "acp",
              txid: "tx-timeline-complete",
              explorerUrl: "https://ancap.cloud/acp/tx/tx-timeline-complete",
            },
          ],
        },
        paymentIntent: makeEntry("timeline", "completed").intent,
        quote: makeEntry("timeline", "completed").quote!,
      },
      {
        execution: {
          ...makeEntry("remote", "completed").execution,
          id: "exec-remote",
          paymentIntentId: "intent-remote",
          quoteId: "quote-remote",
          updatedAt: "2026-05-28T17:11:00.000Z",
        },
        receipt: {
          ...makeEntry("remote", "completed").receipt!,
          paymentExecutionId: "exec-remote",
          paymentIntentId: "intent-remote",
          completedAt: "2026-05-28T17:11:00.000Z",
        },
        paymentIntent: {
          ...makeEntry("remote", "completed").intent,
          id: "intent-remote",
        },
        quote: {
          ...makeEntry("remote", "completed").quote!,
          quoteId: "quote-remote",
          paymentIntentId: "intent-remote",
        },
      },
    ]);

    const mergedTimeline = await loadSmartPayHistoryTimeline({
      hasAccountAuth: true,
      listRemoteHistory: remoteList,
    });

    expect(remoteList).toHaveBeenCalledOnce();
    expect(mergedTimeline).toHaveLength(2);
    expect(mergedTimeline[0]?.id).toBe("exec-remote");
    expect(mergedTimeline[1]?.id).toBe("exec-timeline");
    expect(mergedTimeline[1]?.execution.status).toBe("completed");
    expect(mergedTimeline[1]?.sessionToken).toBe("session-timeline");
    expect(mergedTimeline[1]?.snapshotOrigin).toBe("local+backend");
    await expect(loadSmartPayHistory()).resolves.toHaveLength(1);
  });

  it("falls back to local history when merged timeline backend fetch fails", async () => {
    await saveSmartPayHistoryEntry(makeEntry("fallback", "pending_reconciliation"));

    const remoteList = vi.fn(async () => {
      throw new Error("backend unavailable");
    });

    const mergedTimeline = await loadSmartPayHistoryTimeline({
      hasAccountAuth: true,
      listRemoteHistory: remoteList,
    });

    expect(remoteList).toHaveBeenCalledOnce();
    expect(mergedTimeline).toHaveLength(1);
    expect(mergedTimeline[0]?.id).toBe("exec-fallback");
    expect(mergedTimeline[0]?.execution.status).toBe("pending_reconciliation");
    expect(mergedTimeline[0]?.snapshotOrigin).toBe("local");
  });

  it("clears only local snapshots and preserves signed-in backend history when available", async () => {
    await saveSmartPayHistoryEntry(makeEntry("9", "completed"));

    const remoteList = vi.fn(async () => [
      {
        execution: {
          ...makeEntry("remote", "completed").execution,
          id: "exec-remote",
          paymentIntentId: "intent-remote",
          quoteId: "quote-remote",
          updatedAt: "2026-05-28T17:10:00.000Z",
        },
        receipt: {
          ...makeEntry("remote", "completed").receipt!,
          paymentExecutionId: "exec-remote",
          paymentIntentId: "intent-remote",
          completedAt: "2026-05-28T17:10:00.000Z",
        },
        paymentIntent: {
          ...makeEntry("remote", "completed").intent,
          id: "intent-remote",
        },
        quote: {
          ...makeEntry("remote", "completed").quote!,
          quoteId: "quote-remote",
          paymentIntentId: "intent-remote",
        },
      },
    ]);

    const cleared = await clearSmartPayHistorySnapshots({
      hasAccountAuth: true,
      listRemoteHistory: remoteList,
    });

    expect(remoteList).toHaveBeenCalledOnce();
    expect(cleared).toHaveLength(1);
    expect(cleared[0]?.id).toBe("exec-remote");
    expect(cleared[0]?.sessionToken).toBeNull();
    await expect(loadSmartPayHistory()).resolves.toEqual([]);
  });

  it("clears corrupt payloads instead of throwing", async () => {
    store.set("acp_wallet_smart_pay_history", "{not-json");

    await expect(loadSmartPayHistory()).resolves.toEqual([]);
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(
      "acp_wallet_smart_pay_history",
      expect.objectContaining({ keychainAccessible: "WHEN_UNLOCKED_THIS_DEVICE_ONLY" })
    );
  });

  it("normalizes malformed legacy stored history entries instead of trusting broken snapshot fields", async () => {
    store.set(
      "acp_wallet_smart_pay_history",
      JSON.stringify({
        version: 1,
        entries: [
          {
            ...makeEntry("legacy", "pending_reconciliation"),
            sessionToken: "   ",
            snapshotOrigin: "weird-origin",
            quote: {
              ...makeEntry("legacy", "pending_reconciliation").quote!,
              route: null,
              networkFee: null,
              warnings: null,
              riskFlags: null,
            },
            execution: {
              ...makeEntry("legacy", "pending_reconciliation").execution,
              nextAction: 42,
              progress: {
                totalRouteSteps: "2",
                observedTxCount: "1",
                remainingRouteSteps: "1",
                pendingRoles: ["swap", 123, "merchant_payout", ""],
              },
              txRefs: [
                {
                  role: "payment",
                  network: "acp",
                  txid: " tx-legacy ",
                  explorerUrl: " https://ancap.cloud/acp/tx/tx-legacy ",
                  routeStepIndex: "2",
                },
                {
                  role: "payment",
                  network: "acp",
                  txid: "   ",
                },
              ],
              error: 999,
            },
            receipt: {
              ...makeEntry("legacy", "pending_reconciliation").receipt!,
              routeSummary: ["1. transfer ACP -> ACP on acp", 123],
              networkFees: [
                {
                  network: "acp",
                  assetSymbol: "ACP",
                  amount: "0.01",
                },
                {
                  network: "acp",
                  assetSymbol: "ACP",
                },
              ],
              txRefs: [
                {
                  role: "payment",
                  network: "acp",
                  txid: " tx-legacy ",
                  explorerUrl: " https://ancap.cloud/acp/tx/tx-legacy ",
                  routeStepIndex: "2",
                },
              ],
            },
          },
        ],
      })
    );

    const loaded = await loadSmartPayHistory();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.sessionToken).toBeNull();
    expect(loaded[0]?.snapshotOrigin).toBe("local");
    expect(loaded[0]?.quote?.route).toEqual([]);
    expect(loaded[0]?.quote?.networkFee).toEqual([]);
    expect(loaded[0]?.quote?.warnings).toEqual([]);
    expect(loaded[0]?.quote?.riskFlags).toEqual([]);
    expect(loaded[0]?.execution.nextAction).toBeNull();
    expect(loaded[0]?.execution.error).toBeNull();
    expect(loaded[0]?.execution.progress).toEqual({
      totalRouteSteps: 2,
      observedTxCount: 1,
      remainingRouteSteps: 1,
      pendingRoles: ["swap", "merchant_payout"],
    });
    expect(loaded[0]?.execution.txRefs).toEqual([
      {
        role: "payment",
        network: "acp",
        txid: "tx-legacy",
        explorerUrl: "https://ancap.cloud/acp/tx/tx-legacy",
        routeStepIndex: 2,
      },
    ]);
    expect(loaded[0]?.receipt?.routeSummary).toEqual(["1. transfer ACP -> ACP on acp"]);
    expect(loaded[0]?.receipt?.networkFees).toEqual([
      {
        network: "acp",
        assetSymbol: "ACP",
        amount: "0.01",
      },
    ]);
    expect(loaded[0]?.receipt?.txRefs).toEqual([
      {
        role: "payment",
        network: "acp",
        txid: "tx-legacy",
        explorerUrl: "https://ancap.cloud/acp/tx/tx-legacy",
        routeStepIndex: 2,
      },
    ]);
  });

  it("infers missing tx-ref networks from known explorer urls while normalizing stored history", async () => {
    store.set(
      "acp_wallet_smart_pay_history",
      JSON.stringify({
        version: 1,
        entries: [
          {
            ...makeEntry("network-infer", "completed"),
            execution: {
              ...makeEntry("network-infer", "completed").execution,
              txRefs: [
                {
                  role: "swap",
                  network: "   ",
                  txid: "0xbase-history",
                  explorerUrl: " https://basescan.org/tx/0xbase-history ",
                  routeStepIndex: "1",
                },
              ],
            },
            receipt: {
              ...makeEntry("network-infer", "completed").receipt!,
              txRefs: [
                {
                  role: "payment",
                  network: "",
                  txid: "0xeth-history",
                  explorerUrl: "https://etherscan.io/tx/0xeth-history",
                  routeStepIndex: "2",
                },
              ],
            },
          },
        ],
      })
    );

    const loaded = await loadSmartPayHistory();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.execution.txRefs).toEqual([
      {
        role: "swap",
        network: "base",
        txid: "0xbase-history",
        explorerUrl: "https://basescan.org/tx/0xbase-history",
        routeStepIndex: 1,
      },
    ]);
    expect(loaded[0]?.receipt?.txRefs).toEqual([
      {
        role: "payment",
        network: "ethereum",
        txid: "0xeth-history",
        explorerUrl: "https://etherscan.io/tx/0xeth-history",
        routeStepIndex: 2,
      },
    ]);
  });

  it("drops legacy history entries that are missing required execution or intent structure", async () => {
    store.set(
      "acp_wallet_smart_pay_history",
      JSON.stringify({
        version: 1,
        entries: [
          {
            ...makeEntry("invalid-intent", "completed"),
            intent: null,
          },
          {
            ...makeEntry("invalid-execution", "completed"),
            execution: {
              ...makeEntry("invalid-execution", "completed").execution,
              txRefs: null,
            },
          },
          makeEntry("valid", "completed"),
        ],
      })
    );

    const loaded = await loadSmartPayHistory();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe("exec-valid");
  });

  it("falls back to the incoming active snapshot when the saved overlap payload is malformed", () => {
    const merged = mergeSmartPayActiveHistoryEntry(
      {
        ...makeEntry("broken-active", "completed"),
        execution: {
          ...makeEntry("broken-active", "completed").execution,
          txRefs: null,
        },
      } as unknown as SmartPayHistoryEntry,
      {
        ...makeEntry("broken-active", "pending_reconciliation"),
        snapshotOrigin: "local",
      }
    );

    expect(merged.execution.status).toBe("pending_reconciliation");
    expect(merged.snapshotOrigin).toBe("local");
  });

  it("extracts recovery tx ids from raw hashes and explorer links", () => {
    expect(
      extractSmartPayRecoveryTxs(
        "0xabc123 https://bscscan.com/tx/0xdef456 https://example.com/?txHash=0xfeedbeef 0xABC123"
      )
    ).toEqual(["0xabc123", "0xdef456", "0xfeedbeef"]);
  });

  it("reports invalid and duplicate recovery tokens separately from parsed tx ids", () => {
    expect(
      parseSmartPayRecoveryInput(
        "0xabc123 bscscan.com/tx/0xdef456 https://example.com/not-a-tx 0xABC123"
      )
    ).toEqual({
      refs: [
        {
          txid: "0xabc123",
          network: null,
          explorerUrl: null,
        },
        {
          txid: "0xdef456",
          network: "bsc",
          explorerUrl: "https://bscscan.com/tx/0xdef456",
        },
      ],
      txids: ["0xabc123", "0xdef456"],
      duplicateTokens: ["0xABC123"],
      invalidTokens: ["https://example.com/not-a-tx"],
    });
  });

  it("keeps the richer explorer-linked recovery ref when duplicates overlap", () => {
    expect(
      parseSmartPayRecoveryInput(
        "0xabc123 https://ancap.cloud/acp/tx/0xABC123"
      )
    ).toEqual({
      refs: [
        {
          txid: "0xABC123",
          network: "acp",
          explorerUrl: "https://ancap.cloud/acp/tx/0xABC123",
        },
      ],
      txids: ["0xABC123"],
      duplicateTokens: ["https://ancap.cloud/acp/tx/0xABC123"],
      invalidTokens: [],
    });
  });

  it("preserves base and ethereum network metadata when recovery input uses known explorer links", () => {
    expect(
      parseSmartPayRecoveryInput(
        "https://basescan.org/tx/0xbase123 https://etherscan.io/tx/0xeth456"
      )
    ).toEqual({
      refs: [
        {
          txid: "0xbase123",
          network: "base",
          explorerUrl: "https://basescan.org/tx/0xbase123",
        },
        {
          txid: "0xeth456",
          network: "ethereum",
          explorerUrl: "https://etherscan.io/tx/0xeth456",
        },
      ],
      txids: ["0xbase123", "0xeth456"],
      duplicateTokens: [],
      invalidTokens: [],
    });
  });
});
