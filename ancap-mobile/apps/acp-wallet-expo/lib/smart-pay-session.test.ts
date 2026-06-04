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
  clearSmartPaySession,
  loadSmartPaySession,
  saveSmartPaySession,
} from "./smart-pay-session";
import { deriveSmartPaySnapshotOrigin } from "./smart-pay-snapshot-origin";

describe("smart pay session persistence", () => {
  beforeEach(async () => {
    store.clear();
    secureStore.getItemAsync.mockClear();
    secureStore.setItemAsync.mockClear();
    secureStore.deleteItemAsync.mockClear();
    await clearSmartPaySession();
  });

  it("persists and restores the Smart Pay session token plus snapshot provenance", async () => {
    await saveSmartPaySession({
      rawPayload: "acp1test?amount=1",
      payloadSource: "paste",
      selectedAsset: "ACP",
      intent: null,
      quote: null,
      execution: null,
      receipt: null,
      sessionToken: "session-token-123",
      snapshotOrigin: deriveSmartPaySnapshotOrigin({
        hasAccountAuth: true,
        sessionToken: "session-token-123",
        previousOrigin: "backend",
        regainedSessionTokenFromBackend: true,
      }),
      recoveryDraftTxs: "0xabc123\n0xdef456",
    });

    const restored = await loadSmartPaySession();
    expect(restored?.sessionToken).toBe("session-token-123");
    expect(restored?.payloadSource).toBe("paste");
    expect(restored?.snapshotOrigin).toBe("local+backend");
    expect(restored?.recoveryDraftTxs).toBe("0xabc123\n0xdef456");
  });

  it("defaults missing snapshot provenance and recovery drafts for older stored payloads", async () => {
    store.set(
      "acp_wallet_smart_pay_session",
      JSON.stringify({
        version: 1,
        rawPayload: "acp1legacy?amount=1",
        payloadSource: "paste",
        selectedAsset: "ACP",
        intent: null,
        quote: null,
        execution: null,
        receipt: null,
        sessionToken: "legacy-session",
        savedAt: "2026-05-30T00:00:00.000Z",
      })
    );

    const restored = await loadSmartPaySession();
    expect(restored?.sessionToken).toBe("legacy-session");
    expect(restored?.snapshotOrigin).toBe("local");
    expect(restored?.recoveryDraftTxs).toBe("");
  });

  it("normalizes malformed legacy session fields instead of trusting broken values", async () => {
    store.set(
      "acp_wallet_smart_pay_session",
      JSON.stringify({
        version: 1,
        rawPayload: 42,
        payloadSource: "weird-source",
        selectedAsset: "   ",
        intent: undefined,
        quote: undefined,
        execution: undefined,
        receipt: undefined,
        sessionToken: "   ",
        snapshotOrigin: "backend",
        recoveryDraftTxs: 999,
        savedAt: "2026-05-30T00:00:00.000Z",
      })
    );

    const restored = await loadSmartPaySession();
    expect(restored?.rawPayload).toBe("");
    expect(restored?.payloadSource).toBe("paste");
    expect(restored?.selectedAsset).toBe("ACP");
    expect(restored?.intent).toBeNull();
    expect(restored?.quote).toBeNull();
    expect(restored?.execution).toBeNull();
    expect(restored?.receipt).toBeNull();
    expect(restored?.sessionToken).toBeNull();
    expect(restored?.snapshotOrigin).toBe("backend");
    expect(restored?.recoveryDraftTxs).toBe("");
  });

  it("keeps supported share payload sources instead of collapsing them to paste during restore", async () => {
    store.set(
      "acp_wallet_smart_pay_session",
      JSON.stringify({
        version: 1,
        rawPayload: "https://ancap.cloud/pay/demo",
        payloadSource: "share",
        selectedAsset: "USDT",
        intent: null,
        quote: null,
        execution: null,
        receipt: null,
        sessionToken: "session-share",
        snapshotOrigin: "local+backend",
        recoveryDraftTxs: "0xshare123",
        savedAt: "2026-05-30T00:00:00.000Z",
      })
    );

    const restored = await loadSmartPaySession();
    expect(restored?.payloadSource).toBe("share");
    expect(restored?.selectedAsset).toBe("USDT");
    expect(restored?.sessionToken).toBe("session-share");
    expect(restored?.snapshotOrigin).toBe("local+backend");
    expect(restored?.recoveryDraftTxs).toBe("0xshare123");
  });

  it("canonicalizes known selected-asset symbols on restore and save", async () => {
    store.set(
      "acp_wallet_smart_pay_session",
      JSON.stringify({
        version: 1,
        rawPayload: "acp1canonical?amount=4",
        payloadSource: "share",
        selectedAsset: "WACP",
        intent: null,
        quote: null,
        execution: null,
        receipt: null,
        sessionToken: "session-canonical",
        snapshotOrigin: "local",
        recoveryDraftTxs: "",
        savedAt: "2026-05-30T00:00:00.000Z",
      })
    );

    const restored = await loadSmartPaySession();
    expect(restored?.selectedAsset).toBe("wACP");

    await saveSmartPaySession({
      rawPayload: "acp1canonical?amount=4",
      payloadSource: "share",
      selectedAsset: "wacp",
      intent: null,
      quote: null,
      execution: null,
      receipt: null,
      sessionToken: "session-canonical",
      snapshotOrigin: "local",
      recoveryDraftTxs: "",
    });

    const resaved = await loadSmartPaySession();
    expect(resaved?.selectedAsset).toBe("wACP");
  });

  it("normalizes invalid snapshot provenance and omitted recovery drafts on save/load", async () => {
    store.set(
      "acp_wallet_smart_pay_session",
      JSON.stringify({
        version: 1,
        rawPayload: "acp1invalid?amount=1",
        payloadSource: "paste",
        selectedAsset: "ACP",
        intent: null,
        quote: null,
        execution: null,
        receipt: null,
        sessionToken: null,
        snapshotOrigin: "weird-origin",
        savedAt: "2026-05-30T00:00:00.000Z",
      })
    );

    const normalized = await loadSmartPaySession();
    expect(normalized?.snapshotOrigin).toBe("local");
    expect(normalized?.recoveryDraftTxs).toBe("");

    await saveSmartPaySession({
      rawPayload: "acp1fresh?amount=1",
      payloadSource: "paste",
      selectedAsset: "ACP",
      intent: null,
      quote: null,
      execution: null,
      receipt: null,
      sessionToken: null,
    });

    const restored = await loadSmartPaySession();
    expect(restored?.snapshotOrigin).toBe("local");
    expect(restored?.recoveryDraftTxs).toBe("");
  });

  it("preserves an explicit savedAt timestamp instead of silently restamping the session", async () => {
    await saveSmartPaySession({
      rawPayload: "acp1saved?amount=5",
      payloadSource: "paste",
      selectedAsset: "ACP",
      intent: null,
      quote: null,
      execution: null,
      receipt: null,
      sessionToken: "saved-session",
      savedAt: "2026-05-29T12:34:56.000Z",
      snapshotOrigin: "local",
      recoveryDraftTxs: "0xpersisted",
    });

    const restored = await loadSmartPaySession();
    expect(restored?.savedAt).toBe("2026-05-29T12:34:56.000Z");
    expect(restored?.sessionToken).toBe("saved-session");
    expect(restored?.recoveryDraftTxs).toBe("0xpersisted");
  });

  it("derives a stable savedAt from execution or receipt timestamps when the stored value is missing or invalid", async () => {
    store.set(
      "acp_wallet_smart_pay_session",
      JSON.stringify({
        version: 1,
        rawPayload: "acp1restore?amount=3",
        payloadSource: "camera",
        selectedAsset: "ACP",
        intent: {
          id: "intent-derived",
          createdAt: "2026-05-30T00:00:00.000Z",
        },
        quote: null,
        execution: {
          id: "exec-derived",
          paymentIntentId: "intent-derived",
          quoteId: "quote-derived",
          status: "pending_reconciliation",
          createdAt: "2026-05-30T00:01:00.000Z",
          updatedAt: "2026-05-30T00:04:00.000Z",
          recoverable: true,
          nextAction: null,
          txRefs: [],
          error: null,
        },
        receipt: {
          id: "receipt-derived",
          paymentExecutionId: "exec-derived",
          paymentIntentId: "intent-derived",
          completedAt: "2026-05-30T00:05:00.000Z",
          sourceAssetSpent: "ACP",
          sourceAmountSpent: "3.1",
          targetAssetPaid: "ACP",
          targetAmountPaid: "3.0",
          serviceFeeAcp: "0.1",
          networkFees: [],
          recipientAddress: "acp_test_derived",
          merchantLabel: null,
          routeSummary: [],
          txRefs: [],
        },
        sessionToken: "derived-session",
        snapshotOrigin: "local+backend",
        recoveryDraftTxs: "0xderived",
        savedAt: "not-a-date",
      })
    );

    const restored = await loadSmartPaySession();
    expect(restored?.savedAt).toBe("2026-05-30T00:05:00.000Z");
    expect(restored?.payloadSource).toBe("camera");
  });

  it("normalizes outgoing session payload fields before persisting them", async () => {
    await saveSmartPaySession({
      rawPayload: 42 as never,
      payloadSource: "weird-source" as never,
      selectedAsset: "   " as never,
      intent: null,
      quote: null,
      execution: null,
      receipt: null,
      sessionToken: "   " as never,
      snapshotOrigin: "weird-origin" as never,
      recoveryDraftTxs: 999 as never,
      savedAt: "not-a-date",
    });

    const restored = await loadSmartPaySession();
    expect(restored?.rawPayload).toBe("");
    expect(restored?.payloadSource).toBe("paste");
    expect(restored?.selectedAsset).toBe("ACP");
    expect(restored?.sessionToken).toBeNull();
    expect(restored?.snapshotOrigin).toBe("local");
    expect(restored?.recoveryDraftTxs).toBe("");
  });

  it("normalizes malformed nested Smart Pay session snapshots instead of restoring unsafe structures", async () => {
    store.set(
      "acp_wallet_smart_pay_session",
      JSON.stringify({
        version: 1,
        rawPayload: "acp1nested?amount=7",
        payloadSource: "camera",
        selectedAsset: "USDT",
        intent: {
          id: "intent-nested",
          createdAt: "2026-05-30T00:00:00.000Z",
          source: "share",
          rawPayload: "https://ancap.cloud/pay/demo",
          payloadHash: 123,
          parseMethod: "broken-parse-method",
          confidence: "0.7",
          status: "broken-status",
          network: "solana",
          asset: {
            kind: "spl-token",
            symbol: 42,
            name: ["USDT"],
            tokenAddress: 999,
            decimals: "6",
            isSupported: 1,
            isAllowlisted: "yes",
          },
          recipient: {
            address: "0xrecipient",
            resolvedDisplay: 123,
            addressType: "solana",
            checksumValid: "yes",
            ensOrAlias: false,
          },
          amount: {
            value: 7,
            atomicValue: 7000000,
            currencySymbol: true,
            isExact: "yes",
            isMax: 0,
          },
          memo: {
            value: ["INV-7"],
            type: "invoice",
            required: "yes",
          },
          merchant: {
            label: ["Merchant"],
            category: 123,
            website: false,
            invoiceId: { id: 7 },
          },
          riskFlags: ["high_risk", 7, ""],
          warnings: ["needs_review", false],
          unsupportedReasons: [null, "unsupported_network"],
          requiresUserConfirmation: "yes",
          metadata: {
            detectedStandard: 123,
            invoiceType: false,
            aiModel: ["gpt"],
            aiUsed: "yes",
            parserVersion: 99,
          },
        },
        quote: {
          quoteId: "quote-nested",
          paymentIntentId: "intent-nested",
          mode: "broken-mode",
          expiresAt: "2026-05-30T00:10:00.000Z",
          sourceAsset: {
            network: "base",
            symbol: "USDT",
            tokenAddress: 123,
            decimals: "6",
          },
          targetAsset: {
            network: "acp",
            symbol: "ACP",
            tokenAddress: ["token"],
            decimals: 8,
          },
          targetAmount: 7,
          requiredSourceAmount: null,
          serviceFeeAcp: 0.1,
          networkFee: [
            { network: "base", assetSymbol: "USDT", amount: "0.01" },
            { network: "acp", assetSymbol: "ACP" },
          ],
          slippageBps: "75",
          route: [
            {
              kind: "wormhole",
              network: "base",
              dexOrRail: 123,
              fromAsset: "USDT",
              toAsset: "wACP",
              estimatedOut: "6.9",
            },
            {
              kind: "transfer",
              network: "acp",
              fromAsset: "wACP",
              toAsset: "ACP",
            },
          ],
          warnings: ["stale_quote", 5],
          riskFlags: ["bridge_risk", null],
        },
        execution: {
          id: "exec-nested",
          paymentIntentId: "intent-nested",
          quoteId: "quote-nested",
          status: "definitely-done",
          createdAt: "2026-05-30T00:01:00.000Z",
          updatedAt: "2026-05-30T00:02:00.000Z",
          recoverable: "yes",
          nextAction: 42,
          progress: {
            totalRouteSteps: "2",
            observedTxCount: "1",
            remainingRouteSteps: "1",
            pendingRoles: ["swap", 9, "", "merchant_payout"],
          },
          txRefs: [
            {
              role: "swap",
              network: "base",
              txid: " 0xabc123 ",
              explorerUrl: " https://basescan.org/tx/0xabc123 ",
              routeStepIndex: "1",
            },
            {
              role: "swap",
              network: "base",
              txid: "   ",
            },
          ],
          error: 404,
        },
        receipt: {
          id: "receipt-nested",
          paymentExecutionId: "exec-nested",
          paymentIntentId: "intent-nested",
          completedAt: "2026-05-30T00:03:00.000Z",
          sourceAssetSpent: "USDT",
          sourceAmountSpent: "7.01",
          targetAssetPaid: "ACP",
          targetAmountPaid: "7",
          serviceFeeAcp: "0.1",
          networkFees: [
            { network: "base", assetSymbol: "USDT", amount: "0.01" },
            { network: "acp", assetSymbol: "ACP", amount: 5 },
          ],
          recipientAddress: "acp_test_nested",
          merchantLabel: ["Merchant"],
          routeSummary: ["1. swap USDT -> wACP on base", 7],
          txRefs: [
            {
              role: "payment",
              network: "acp",
              txid: " acp_tx_nested ",
              explorerUrl: " https://ancap.cloud/acp/tx/acp_tx_nested ",
              routeStepIndex: "2",
            },
            {
              role: "payment",
              network: "acp",
              txid: "   ",
            },
          ],
        },
        sessionToken: "nested-session",
        snapshotOrigin: "local+backend",
        recoveryDraftTxs: "0xabc123",
        savedAt: "2026-05-30T00:00:00.000Z",
      })
    );

    const restored = await loadSmartPaySession();
    expect(restored?.intent).toEqual({
      id: "intent-nested",
      createdAt: "2026-05-30T00:00:00.000Z",
      source: "share",
      rawPayload: "https://ancap.cloud/pay/demo",
      payloadHash: "",
      parseMethod: "deterministic",
      confidence: 0,
      status: "needs_review",
      network: "unknown",
      asset: {
        kind: "unknown",
        symbol: null,
        name: null,
        tokenAddress: null,
        decimals: 6,
        isSupported: true,
        isAllowlisted: true,
      },
      recipient: {
        address: "0xrecipient",
        resolvedDisplay: null,
        addressType: "unknown",
        checksumValid: null,
        ensOrAlias: null,
      },
      amount: {
        value: "",
        atomicValue: null,
        currencySymbol: null,
        isExact: true,
        isMax: false,
      },
      memo: {
        value: "",
        type: "memo",
        required: true,
      },
      merchant: {
        label: null,
        category: null,
        website: null,
        invoiceId: null,
      },
      riskFlags: ["high_risk", ""],
      warnings: ["needs_review"],
      unsupportedReasons: ["unsupported_network"],
      requiresUserConfirmation: true,
      metadata: {
        detectedStandard: null,
        invoiceType: null,
        aiModel: null,
        aiUsed: true,
        parserVersion: "unknown",
      },
    });
    expect(restored?.quote).toEqual({
      quoteId: "quote-nested",
      paymentIntentId: "intent-nested",
      mode: "direct_send",
      expiresAt: "2026-05-30T00:10:00.000Z",
      sourceAsset: {
        network: "base",
        symbol: "USDT",
        tokenAddress: null,
        decimals: 6,
      },
      targetAsset: {
        network: "acp",
        symbol: "ACP",
        tokenAddress: null,
        decimals: 8,
      },
      targetAmount: "",
      requiredSourceAmount: "",
      serviceFeeAcp: "",
      networkFee: [{ network: "base", assetSymbol: "USDT", amount: "0.01" }],
      slippageBps: 75,
      route: [
        {
          kind: "transfer",
          network: "base",
          dexOrRail: null,
          fromAsset: "USDT",
          toAsset: "wACP",
          estimatedOut: "6.9",
        },
      ],
      warnings: ["stale_quote"],
      riskFlags: ["bridge_risk"],
    });
    expect(restored?.execution).toEqual({
      id: "exec-nested",
      paymentIntentId: "intent-nested",
      quoteId: "quote-nested",
      status: "failed",
      createdAt: "2026-05-30T00:01:00.000Z",
      updatedAt: "2026-05-30T00:02:00.000Z",
      recoverable: true,
      nextAction: null,
      progress: {
        totalRouteSteps: 2,
        observedTxCount: 1,
        remainingRouteSteps: 1,
        pendingRoles: ["swap", "merchant_payout"],
      },
      txRefs: [
        {
          role: "swap",
          network: "base",
          txid: "0xabc123",
          explorerUrl: "https://basescan.org/tx/0xabc123",
          routeStepIndex: 1,
        },
      ],
      error: null,
    });
    expect(restored?.receipt).toEqual({
      id: "receipt-nested",
      paymentExecutionId: "exec-nested",
      paymentIntentId: "intent-nested",
      completedAt: "2026-05-30T00:03:00.000Z",
      sourceAssetSpent: "USDT",
      sourceAmountSpent: "7.01",
      targetAssetPaid: "ACP",
      targetAmountPaid: "7",
      serviceFeeAcp: "0.1",
      networkFees: [{ network: "base", assetSymbol: "USDT", amount: "0.01" }],
      recipientAddress: "acp_test_nested",
      merchantLabel: null,
      routeSummary: ["1. swap USDT -> wACP on base"],
      txRefs: [
        {
          role: "payment",
          network: "acp",
          txid: "acp_tx_nested",
          explorerUrl: "https://ancap.cloud/acp/tx/acp_tx_nested",
          routeStepIndex: 2,
        },
      ],
    });
  });

  it("infers missing tx-ref networks from known explorer urls while restoring persisted sessions", async () => {
    store.set(
      "acp_wallet_smart_pay_session",
      JSON.stringify({
        version: 1,
        rawPayload: "acp1network-restore?amount=1",
        payloadSource: "paste",
        selectedAsset: "ACP",
        intent: null,
        quote: null,
        execution: {
          id: "exec-network-restore",
          paymentIntentId: "intent-network-restore",
          quoteId: "quote-network-restore",
          status: "pending_reconciliation",
          createdAt: "2026-05-30T00:01:00.000Z",
          updatedAt: "2026-05-30T00:02:00.000Z",
          recoverable: true,
          nextAction: null,
          txRefs: [
            {
              role: "swap",
              network: "   ",
              txid: "0xbaseproof",
              explorerUrl: "https://basescan.org/tx/0xbaseproof",
            },
            {
              role: "payment",
              network: "",
              txid: "0xethproof",
              explorerUrl: "https://etherscan.io/tx/0xethproof",
            },
          ],
          error: null,
        },
        receipt: {
          id: "receipt-network-restore",
          paymentExecutionId: "exec-network-restore",
          paymentIntentId: "intent-network-restore",
          completedAt: "2026-05-30T00:03:00.000Z",
          sourceAssetSpent: "ACP",
          sourceAmountSpent: "1.0",
          targetAssetPaid: "ACP",
          targetAmountPaid: "1.0",
          serviceFeeAcp: "0.0",
          networkFees: [],
          recipientAddress: "acp_test_network_restore",
          merchantLabel: null,
          routeSummary: [],
          txRefs: [
            {
              role: "bridge",
              network: "  ",
              txid: "0xacpproof",
              explorerUrl: "https://ancap.cloud/acp/tx/0xacpproof",
            },
          ],
        },
        sessionToken: "network-session",
        snapshotOrigin: "backend",
        recoveryDraftTxs: "",
        savedAt: "2026-05-30T00:00:00.000Z",
      })
    );

    const restored = await loadSmartPaySession();
    expect(restored?.execution?.txRefs).toEqual([
      {
        role: "swap",
        network: "base",
        txid: "0xbaseproof",
        explorerUrl: "https://basescan.org/tx/0xbaseproof",
      },
      {
        role: "payment",
        network: "ethereum",
        txid: "0xethproof",
        explorerUrl: "https://etherscan.io/tx/0xethproof",
      },
    ]);
    expect(restored?.receipt?.txRefs).toEqual([
      {
        role: "bridge",
        network: "acp",
        txid: "0xacpproof",
        explorerUrl: "https://ancap.cloud/acp/tx/0xacpproof",
      },
    ]);
  });

  it("drops malformed execution snapshots instead of restoring broken active sessions", async () => {
    store.set(
      "acp_wallet_smart_pay_session",
      JSON.stringify({
        version: 1,
        rawPayload: "acp1broken-exec?amount=1",
        payloadSource: "paste",
        selectedAsset: "ACP",
        intent: null,
        quote: null,
        execution: {
          id: "exec-broken",
          paymentIntentId: "intent-broken",
          quoteId: "quote-broken",
          status: "completed",
          createdAt: "2026-05-30T00:01:00.000Z",
          updatedAt: "2026-05-30T00:02:00.000Z",
          recoverable: true,
          txRefs: null,
        },
        receipt: {
          id: "receipt-broken",
          paymentExecutionId: "exec-broken",
          paymentIntentId: "intent-broken",
          completedAt: "2026-05-30T00:03:00.000Z",
          sourceAssetSpent: "ACP",
          sourceAmountSpent: "1.0",
          targetAssetPaid: "ACP",
          targetAmountPaid: "1.0",
          serviceFeeAcp: "0.0",
          networkFees: [],
          recipientAddress: "acp_test_broken",
          routeSummary: [],
          txRefs: [],
        },
        sessionToken: "broken-session",
        snapshotOrigin: "backend",
        recoveryDraftTxs: "",
        savedAt: "2026-05-30T00:00:00.000Z",
      })
    );

    const restored = await loadSmartPaySession();
    expect(restored?.execution).toBeNull();
    expect(restored?.receipt?.id).toBe("receipt-broken");
    expect(restored?.sessionToken).toBe("broken-session");
  });

  it("clears corrupt payloads instead of throwing", async () => {
    store.set("acp_wallet_smart_pay_session", "{not-json");

    await expect(loadSmartPaySession()).resolves.toBeNull();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(
      "acp_wallet_smart_pay_session",
      expect.objectContaining({ keychainAccessible: "WHEN_UNLOCKED_THIS_DEVICE_ONLY" })
    );
  });
});
