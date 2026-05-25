import * as SecureStore from "expo-secure-store";
import type {
  SmartPayExecution,
  SmartPayPaymentIntent,
  SmartPayQuote,
} from "@ancap/acp-api-client";

const KEY_SMART_PAY_SESSION = "acp_wallet_smart_pay_session";

const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export type SmartPayPayloadSource = "camera" | "photo" | "paste" | "share";

export type PersistedSmartPaySession = {
  version: 1;
  rawPayload: string;
  payloadSource: SmartPayPayloadSource;
  selectedAsset: string;
  intent: SmartPayPaymentIntent | null;
  quote: SmartPayQuote | null;
  execution: SmartPayExecution | null;
  savedAt: string;
};

export async function loadSmartPaySession(): Promise<PersistedSmartPaySession | null> {
  const raw = await SecureStore.getItemAsync(KEY_SMART_PAY_SESSION, STORE_OPTIONS);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedSmartPaySession;
    if (parsed?.version !== 1) {
      await clearSmartPaySession();
      return null;
    }
    return parsed;
  } catch {
    await clearSmartPaySession();
    return null;
  }
}

export async function saveSmartPaySession(
  session: Omit<PersistedSmartPaySession, "version" | "savedAt">
): Promise<void> {
  const payload: PersistedSmartPaySession = {
    version: 1,
    savedAt: new Date().toISOString(),
    ...session,
  };
  await SecureStore.setItemAsync(KEY_SMART_PAY_SESSION, JSON.stringify(payload), STORE_OPTIONS);
}

export async function clearSmartPaySession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_SMART_PAY_SESSION, STORE_OPTIONS);
}
