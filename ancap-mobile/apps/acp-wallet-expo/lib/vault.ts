import * as SecureStore from "expo-secure-store";
import {
  clearPinLock,
  isBiometricUnlockEnabled,
  lockSession,
  markSessionUnlocked,
} from "@/lib/lock";

const KEY_ADDRESS = "acp_wallet_address";
const KEY_KEYSTORE = "acp_wallet_keystore";
const KEY_MNEMONIC = "acp_wallet_mnemonic";
const KEY_KEYSTORE_AUTH = "acp_wallet_keystore_auth";
const KEY_MNEMONIC_AUTH = "acp_wallet_mnemonic_auth";
const KEY_VAULT_MODE = "acp_wallet_vault_mode";
const VAULT_AUTH_PROMPT = "Unlock ACP Wallet secrets";

const DEVICE_ONLY_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const BIOMETRIC_SECRET_OPTIONS: SecureStore.SecureStoreOptions = {
  ...DEVICE_ONLY_OPTIONS,
  requireAuthentication: true,
  authenticationPrompt: VAULT_AUTH_PROMPT,
};

export type VaultPayload = {
  address: string;
  keystoreJson: string;
  mnemonic: string;
  protectedByBiometrics?: boolean;
};

type VaultMode = "plain" | "biometric";

type VaultSecrets = {
  keystoreJson: string;
  mnemonic: string;
  protectedByBiometrics: boolean;
};

async function getVaultMode(): Promise<VaultMode | null> {
  const mode = await SecureStore.getItemAsync(KEY_VAULT_MODE, DEVICE_ONLY_OPTIONS);
  return mode === "plain" || mode === "biometric" ? mode : null;
}

async function setVaultMode(mode: VaultMode): Promise<void> {
  await SecureStore.setItemAsync(KEY_VAULT_MODE, mode, DEVICE_ONLY_OPTIONS);
}

async function hasPlainSecrets(): Promise<boolean> {
  const [keystoreJson, mnemonic] = await Promise.all([
    SecureStore.getItemAsync(KEY_KEYSTORE, DEVICE_ONLY_OPTIONS),
    SecureStore.getItemAsync(KEY_MNEMONIC, DEVICE_ONLY_OPTIONS),
  ]);
  return Boolean(keystoreJson && mnemonic);
}

async function hasProtectedSecrets(): Promise<boolean> {
  return (await getVaultMode()) === "biometric";
}

async function writePlainSecrets(keystoreJson: string, mnemonic: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_KEYSTORE, keystoreJson, DEVICE_ONLY_OPTIONS);
  await SecureStore.setItemAsync(KEY_MNEMONIC, mnemonic, DEVICE_ONLY_OPTIONS);
}

async function writeProtectedSecrets(keystoreJson: string, mnemonic: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_KEYSTORE_AUTH, keystoreJson, BIOMETRIC_SECRET_OPTIONS);
  await SecureStore.setItemAsync(KEY_MNEMONIC_AUTH, mnemonic, BIOMETRIC_SECRET_OPTIONS);
}

async function deletePlainSecrets(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_KEYSTORE),
    SecureStore.deleteItemAsync(KEY_MNEMONIC),
  ]);
}

async function deleteProtectedSecrets(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_KEYSTORE_AUTH),
    SecureStore.deleteItemAsync(KEY_MNEMONIC_AUTH),
  ]);
}

async function readVaultSecrets(): Promise<VaultSecrets | null> {
  const mode = await getVaultMode();
  if (mode === "biometric") {
    const [keystoreJson, mnemonic] = await Promise.all([
      SecureStore.getItemAsync(KEY_KEYSTORE_AUTH, BIOMETRIC_SECRET_OPTIONS),
      SecureStore.getItemAsync(KEY_MNEMONIC_AUTH, BIOMETRIC_SECRET_OPTIONS),
    ]);
    if (!keystoreJson || !mnemonic) {
      throw new Error(
        "Secure vault secrets are unavailable. Device biometrics may have changed. Re-import the wallet from your backup on this device."
      );
    }
    return { keystoreJson, mnemonic, protectedByBiometrics: true };
  }

  const [keystoreJson, mnemonic] = await Promise.all([
    SecureStore.getItemAsync(KEY_KEYSTORE, DEVICE_ONLY_OPTIONS),
    SecureStore.getItemAsync(KEY_MNEMONIC, DEVICE_ONLY_OPTIONS),
  ]);
  if (!keystoreJson || !mnemonic) {
    return null;
  }
  return { keystoreJson, mnemonic, protectedByBiometrics: false };
}

export async function hasVault(): Promise<boolean> {
  const [address, mode, plainSecrets] = await Promise.all([
    SecureStore.getItemAsync(KEY_ADDRESS, DEVICE_ONLY_OPTIONS),
    getVaultMode(),
    hasPlainSecrets(),
  ]);
  if (!address) {
    return false;
  }
  if (mode === "biometric") {
    return true;
  }
  return plainSecrets;
}

export async function loadVaultAddress(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_ADDRESS, DEVICE_ONLY_OPTIONS);
}

export async function isVaultBiometricProtected(): Promise<boolean> {
  return hasProtectedSecrets();
}

export async function saveVault(payload: VaultPayload): Promise<void> {
  await SecureStore.setItemAsync(KEY_ADDRESS, payload.address, DEVICE_ONLY_OPTIONS);
  const protectSecrets = payload.protectedByBiometrics ?? (await isBiometricUnlockEnabled());
  if (protectSecrets) {
    await writeProtectedSecrets(payload.keystoreJson, payload.mnemonic);
    await deletePlainSecrets();
    await setVaultMode("biometric");
  } else {
    await writePlainSecrets(payload.keystoreJson, payload.mnemonic);
    await deleteProtectedSecrets();
    await setVaultMode("plain");
  }
  markSessionUnlocked();
}

export async function enableVaultBiometricProtection(): Promise<boolean> {
  const address = await loadVaultAddress();
  if (!address) {
    return false;
  }
  const secrets = await readVaultSecrets();
  if (!secrets) {
    return false;
  }
  if (secrets.protectedByBiometrics) {
    return true;
  }
  await writeProtectedSecrets(secrets.keystoreJson, secrets.mnemonic);
  await deletePlainSecrets();
  await setVaultMode("biometric");
  return true;
}

export async function disableVaultBiometricProtection(): Promise<boolean> {
  const address = await loadVaultAddress();
  if (!address) {
    return false;
  }
  const secrets = await readVaultSecrets();
  if (!secrets) {
    return false;
  }
  if (!secrets.protectedByBiometrics) {
    return true;
  }
  await writePlainSecrets(secrets.keystoreJson, secrets.mnemonic);
  await deleteProtectedSecrets();
  await setVaultMode("plain");
  return true;
}

export async function loadVault(): Promise<VaultPayload | null> {
  const address = await loadVaultAddress();
  if (!address) {
    return null;
  }
  const secrets = await readVaultSecrets();
  if (!secrets) {
    return null;
  }
  return {
    address,
    keystoreJson: secrets.keystoreJson,
    mnemonic: secrets.mnemonic,
    protectedByBiometrics: secrets.protectedByBiometrics,
  };
}

export async function wipeVault(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_ADDRESS),
    SecureStore.deleteItemAsync(KEY_VAULT_MODE),
    deletePlainSecrets(),
    deleteProtectedSecrets(),
  ]);
  await clearPinLock();
  lockSession();
}
