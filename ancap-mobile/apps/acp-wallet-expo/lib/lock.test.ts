import { beforeEach, describe, expect, it, vi } from "vitest";

const { digestStringAsync, store, secureStore, localAuth } = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    digestStringAsync: vi.fn(async (_algorithm: string, input: string) => `hash:${input}`),
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
    localAuth: {
      hasHardwareAsync: vi.fn(async () => true),
      isEnrolledAsync: vi.fn(async () => true),
      authenticateAsync: vi.fn(async () => ({ success: true })),
    },
  };
});

vi.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA256" },
  digestStringAsync,
}));

vi.mock("expo-secure-store", () => secureStore);
vi.mock("expo-local-authentication", () => localAuth);

import * as lock from "./lock";

describe("wallet expo lock helpers", () => {
  beforeEach(async () => {
    store.clear();
    digestStringAsync.mockClear();
    secureStore.getItemAsync.mockClear();
    secureStore.setItemAsync.mockClear();
    secureStore.deleteItemAsync.mockClear();
    localAuth.hasHardwareAsync.mockClear();
    localAuth.isEnrolledAsync.mockClear();
    localAuth.authenticateAsync.mockClear();
    lock.lockSession();
    await lock.disableBiometricUnlock();
  });

  it("stores hashed PIN material instead of raw digits", async () => {
    await lock.setPinLock("123456");

    expect(store.get("acp_wallet_pin")).toBe("sha256:hash:acp-wallet-pin:v1:123456");
    expect(store.get("acp_wallet_pin")).not.toBe("123456");
    expect(await lock.verifyPin("123456")).toBe(true);
    expect(await lock.verifyPin("654321")).toBe(false);
  });

  it("migrates a legacy plaintext PIN to hashed storage after successful unlock", async () => {
    store.set("acp_wallet_pin", "4321");

    await expect(lock.verifyPin("4321")).resolves.toBe(true);
    expect(store.get("acp_wallet_pin")).toBe("sha256:hash:acp-wallet-pin:v1:4321");
  });

  it("keeps biometric token in device-only secure storage and marks session unlocked", async () => {
    await lock.enableBiometricUnlock();

    expect(secureStore.setItemAsync).toHaveBeenCalledWith(
      "acp_wallet_biometric_token",
      "enabled",
      expect.objectContaining({ keychainAccessible: "WHEN_UNLOCKED_THIS_DEVICE_ONLY" })
    );
    expect(await lock.unlockWithBiometrics()).toBe(true);
    expect(lock.isSessionUnlocked()).toBe(true);
  });
});
