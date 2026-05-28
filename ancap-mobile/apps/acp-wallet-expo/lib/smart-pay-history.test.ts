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
  clearSmartPayHistory,
  loadSmartPayHistory,
  saveSmartPayHistoryEntry,
  type SmartPayHistoryEntry,
} from "./smart-pay-history";

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

  it("clears corrupt payloads instead of throwing", async () => {
    store.set("acp_wallet_smart_pay_history", "{not-json");

    await expect(loadSmartPayHistory()).resolves.toEqual([]);
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(
      "acp_wallet_smart_pay_history",
      expect.objectContaining({ keychainAccessible: "WHEN_UNLOCKED_THIS_DEVICE_ONLY" })
    );
  });
});
