import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const KEY_PIN = "acp_wallet_pin";
const KEY_BIOMETRIC_TOKEN = "acp_wallet_biometric_token";
const BIOMETRIC_TOKEN_VALUE = "enabled";
const PIN_HASH_PREFIX = "sha256:";
const DEVICE_ONLY_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

let sessionUnlocked = false;

function normalizePin(pin: string): string {
  return (pin || "").trim();
}

async function hashPin(pin: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `acp-wallet-pin:v1:${normalizePin(pin)}`
  );
  return `${PIN_HASH_PREFIX}${digest}`;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,8}$/.test(normalizePin(pin));
}

export async function hasPinLock(): Promise<boolean> {
  const pin = await SecureStore.getItemAsync(KEY_PIN, DEVICE_ONLY_OPTIONS);
  return Boolean(pin);
}

export async function setPinLock(pin: string): Promise<void> {
  const normalized = normalizePin(pin);
  if (!isValidPin(normalized)) {
    throw new Error("PIN must be 4 to 8 digits.");
  }
  await SecureStore.setItemAsync(KEY_PIN, await hashPin(normalized), DEVICE_ONLY_OPTIONS);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(KEY_PIN, DEVICE_ONLY_OPTIONS);
  if (!stored) {
    return false;
  }

  const normalized = normalizePin(pin);
  const expectedHash = await hashPin(normalized);
  if (stored === expectedHash) {
    return true;
  }

  if (!stored.startsWith(PIN_HASH_PREFIX) && stored === normalized) {
    await SecureStore.setItemAsync(KEY_PIN, expectedHash, DEVICE_ONLY_OPTIONS);
    return true;
  }

  return false;
}

export async function clearPinLock(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_PIN, DEVICE_ONLY_OPTIONS);
  await disableBiometricUnlock();
  sessionUnlocked = false;
}

export function markSessionUnlocked(): void {
  sessionUnlocked = true;
}

export function lockSession(): void {
  sessionUnlocked = false;
}

export function isSessionUnlocked(): boolean {
  return sessionUnlocked;
}

export async function requiresUnlock(): Promise<boolean> {
  return (await hasPinLock()) && !isSessionUnlocked();
}

export async function canUseBiometricUnlock(): Promise<boolean> {
  try {
    const [hasHardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

export async function isBiometricUnlockEnabled(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync(KEY_BIOMETRIC_TOKEN, DEVICE_ONLY_OPTIONS);
    return token === BIOMETRIC_TOKEN_VALUE;
  } catch {
    return false;
  }
}

async function authenticateBiometric(promptMessage: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Cancel",
      fallbackLabel: "Use device passcode",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

export async function enableBiometricUnlock(): Promise<void> {
  if (!(await canUseBiometricUnlock())) {
    throw new Error("Biometric unlock is not available on this device.");
  }
  const ok = await authenticateBiometric("Enable biometric unlock for ACP Wallet");
  if (!ok) {
    throw new Error("Biometric confirmation was cancelled or failed.");
  }
  await SecureStore.setItemAsync(KEY_BIOMETRIC_TOKEN, BIOMETRIC_TOKEN_VALUE, DEVICE_ONLY_OPTIONS);
}

export async function disableBiometricUnlock(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_BIOMETRIC_TOKEN, DEVICE_ONLY_OPTIONS);
}

export async function unlockWithBiometrics(): Promise<boolean> {
  if (!(await canUseBiometricUnlock())) {
    return false;
  }
  const enabled = await isBiometricUnlockEnabled();
  if (!enabled) {
    return false;
  }
  const ok = await authenticateBiometric("Unlock ACP Wallet");
  if (ok) {
    markSessionUnlocked();
  }
  return ok;
}
