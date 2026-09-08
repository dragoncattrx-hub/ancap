/**
 * NFC implant factor (Biohax / NTAG-class chips).
 *
 * MVP: physical-presence second factor via NFC UID hash.
 * UID can be cloned on basic NTAG; always combine with PIN.
 * Future: DESFire challenge-response / org-bound credentials.
 */

import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const KEY_NFC_UID_HASH = "acp_wallet_nfc_uid_hash";
const KEY_NFC_ENABLED = "acp_wallet_nfc_enabled";
const NFC_ENABLED_VALUE = "enabled";
const UID_HASH_PREFIX = "sha256:";
const DEVICE_ONLY_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

type NfcTag = { id?: number[] | string | null };
type NfcManagerLike = {
  start: () => Promise<void>;
  isSupported: () => Promise<boolean>;
  requestTechnology: (tech: string) => Promise<void>;
  getTag: () => Promise<NfcTag | null>;
  cancelTechnologyRequest: () => Promise<void>;
};

type NfcModule = {
  default: NfcManagerLike;
  NfcTech: { Ndef: string; NfcA?: string };
};

function loadNfcModule(): NfcModule | null {
  try {
    // Optional native dependency — requires Expo dev build, not Expo Go.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-nfc-manager") as NfcModule;
  } catch {
    return null;
  }
}

function normalizeUid(raw: number[] | string | null | undefined): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9a-fA-F]/g, "").toLowerCase();
    return cleaned.length >= 8 ? cleaned : null;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((b) => (b & 0xff).toString(16).padStart(2, "0")).join("");
  }
  return null;
}

async function hashUid(uid: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `acp-wallet-nfc:v1:biohax:${uid}`
  );
  return `${UID_HASH_PREFIX}${digest}`;
}

export async function canUseNfcUnlock(): Promise<boolean> {
  const mod = loadNfcModule();
  if (!mod) return false;
  try {
    await mod.default.start();
    return await mod.default.isSupported();
  } catch {
    return false;
  }
}

export async function isNfcUnlockEnabled(): Promise<boolean> {
  try {
    const [flag, hash] = await Promise.all([
      SecureStore.getItemAsync(KEY_NFC_ENABLED, DEVICE_ONLY_OPTIONS),
      SecureStore.getItemAsync(KEY_NFC_UID_HASH, DEVICE_ONLY_OPTIONS),
    ]);
    return flag === NFC_ENABLED_VALUE && Boolean(hash);
  } catch {
    return false;
  }
}

export async function readNfcUid(timeoutMs = 15000): Promise<string> {
  const mod = loadNfcModule();
  if (!mod) {
    throw new Error("NFC requires a native Expo dev build with react-native-nfc-manager.");
  }

  await mod.default.start();
  const supported = await mod.default.isSupported();
  if (!supported) {
    throw new Error("NFC is not supported on this device.");
  }

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("NFC scan timed out. Hold the implant near the phone.")), timeoutMs);
  });

  try {
    const uid = await Promise.race([
      (async () => {
        // NfcA is preferred for UID-only NTAG/Biohax implants; fall back to NDEF.
        await mod.default.requestTechnology(mod.NfcTech.NfcA ?? mod.NfcTech.Ndef);
        const tag = await mod.default.getTag();
        const normalized = normalizeUid(tag?.id ?? null);
        if (!normalized) {
          throw new Error("Could not read NFC implant UID.");
        }
        return normalized;
      })(),
      timeout,
    ]);
    return uid;
  } finally {
    try {
      await mod.default.cancelTechnologyRequest();
    } catch {
      // ignore cancel errors
    }
  }
}

export async function enrollNfcUnlock(): Promise<void> {
  const uid = await readNfcUid();
  const hashed = await hashUid(uid);
  await SecureStore.setItemAsync(KEY_NFC_UID_HASH, hashed, DEVICE_ONLY_OPTIONS);
  await SecureStore.setItemAsync(KEY_NFC_ENABLED, NFC_ENABLED_VALUE, DEVICE_ONLY_OPTIONS);
}

export async function disableNfcUnlock(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_NFC_UID_HASH, DEVICE_ONLY_OPTIONS);
  await SecureStore.deleteItemAsync(KEY_NFC_ENABLED, DEVICE_ONLY_OPTIONS);
}

export async function verifyNfcUnlock(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(KEY_NFC_UID_HASH, DEVICE_ONLY_OPTIONS);
  if (!stored) return false;
  try {
    const uid = await readNfcUid();
    const hashed = await hashUid(uid);
    return stored === hashed;
  } catch {
    return false;
  }
}

/** Export hashed enrollment for org binding (never raw UID). */
export async function getEnrolledNfcUidHash(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_NFC_UID_HASH, DEVICE_ONLY_OPTIONS);
}
