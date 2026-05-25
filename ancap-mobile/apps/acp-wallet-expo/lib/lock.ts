import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const KEY_PIN = "acp_wallet_pin";
const KEY_BIOMETRIC_TOKEN = "acp_wallet_biometric_token";
const BIOMETRIC_TOKEN_VALUE = "enabled";

let sessionUnlocked = false;

function normalizePin(pin: string): string {
  return (pin || "").trim();
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,8}$/.test(normalizePin(pin));
}

export async function hasPinLock(): Promise<boolean> {
  const pin = await SecureStore.getItemAsync(KEY_PIN);
  return Boolean(pin);
}

export async function setPinLock(pin: string): Promise<void> {
  const normalized = normalizePin(pin);
  if (!isValidPin(normalized)) {
    throw new Error("PIN must be 4 to 8 digits.");
  }
  await SecureStore.setItemAsync(KEY_PIN, normalized);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(KEY_PIN);
  return Boolean(stored && stored === normalizePin(pin));
}

export async function clearPinLock(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_PIN);
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
    const token = await SecureStore.getItemAsync(KEY_BIOMETRIC_TOKEN);
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
  await SecureStore.setItemAsync(KEY_BIOMETRIC_TOKEN, BIOMETRIC_TOKEN_VALUE);
}

export async function disableBiometricUnlock(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_BIOMETRIC_TOKEN);
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
