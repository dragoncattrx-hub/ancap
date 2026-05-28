import * as SecureStore from "expo-secure-store";
import type {
  SmartPayExecution,
  SmartPayPaymentIntent,
  SmartPayQuote,
} from "@ancap/acp-api-client";

const KEY_SMART_PAY_HISTORY = "acp_wallet_smart_pay_history";
const MAX_HISTORY_ITEMS = 8;

const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export type SmartPayHistoryEntry = {
  id: string;
  savedAt: string;
  intent: SmartPayPaymentIntent;
  quote: SmartPayQuote | null;
  execution: SmartPayExecution;
};

export type PersistedSmartPayHistory = {
  version: 1;
  entries: SmartPayHistoryEntry[];
};

function normalizeHistory(payload: PersistedSmartPayHistory | null): PersistedSmartPayHistory {
  if (!payload || payload.version !== 1 || !Array.isArray(payload.entries)) {
    return { version: 1, entries: [] };
  }
  return {
    version: 1,
    entries: payload.entries.filter(
      (entry) => !!entry && !!entry.id && !!entry.savedAt && !!entry.intent && !!entry.execution
    ),
  };
}

export async function loadSmartPayHistory(): Promise<SmartPayHistoryEntry[]> {
  const raw = await SecureStore.getItemAsync(KEY_SMART_PAY_HISTORY, STORE_OPTIONS);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as PersistedSmartPayHistory;
    return normalizeHistory(parsed).entries;
  } catch {
    await clearSmartPayHistory();
    return [];
  }
}

export async function saveSmartPayHistoryEntry(entry: SmartPayHistoryEntry): Promise<SmartPayHistoryEntry[]> {
  const existing = await loadSmartPayHistory();
  const next = [entry, ...existing.filter((item) => item.id !== entry.id)].slice(0, MAX_HISTORY_ITEMS);
  const payload: PersistedSmartPayHistory = {
    version: 1,
    entries: next,
  };
  await SecureStore.setItemAsync(KEY_SMART_PAY_HISTORY, JSON.stringify(payload), STORE_OPTIONS);
  return next;
}

export async function clearSmartPayHistory(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_SMART_PAY_HISTORY, STORE_OPTIONS);
}
