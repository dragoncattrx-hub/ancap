import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addressFromKeystore,
  createWallet,
  estimateFeeDefault,
  setNativeWalletModule,
  signAndPrepareTransfer,
  validateAddressWithNative,
} from "./wallet-service.js";
import type { NativeWalletModule } from "./wallet-service.js";

const FROM = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9";
const TO = "acp1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqnpz";

function makeNativeModule(): NativeWalletModule {
  return {
    createWallet: vi.fn().mockResolvedValue({
      address: FROM,
      mnemonic: "one two three four five six seven eight nine ten eleven twelve",
      keystoreJson: '{"version":3}',
    }),
    validateAddress: vi.fn().mockResolvedValue(true),
    addressFromKeystore: vi.fn().mockResolvedValue(FROM),
    estimateFeeDefault: vi.fn().mockResolvedValue({
      feeAcp: "0.00000100",
      feeUnits: 100,
    }),
    signTransfer: vi.fn().mockResolvedValue({
      rawTx: "deadbeef",
      txid: "tx-123",
    }),
  };
}

describe("wallet-service native bridge", () => {
  beforeEach(() => {
    setNativeWalletModule(null);
  });

  it("throws a clear error when the native module is missing", async () => {
    await expect(createWallet()).rejects.toThrow("ACP native module is not linked");
    await expect(validateAddressWithNative(FROM)).rejects.toThrow("ACP native module is not linked");
    await expect(addressFromKeystore('{"version":3}')).rejects.toThrow("ACP native module is not linked");
    await expect(estimateFeeDefault()).rejects.toThrow("ACP native module is not linked");
    await expect(
      signAndPrepareTransfer("https://acp1.ancap.cloud/rpc", '{"version":3}', {
        from: FROM,
        to: TO,
        amountAcp: "1.25",
      })
    ).rejects.toThrow("ACP native module is not linked");
  });

  it("proxies createWallet results from the native module", async () => {
    const native = makeNativeModule();
    setNativeWalletModule(native);

    await expect(createWallet()).resolves.toEqual({
      address: FROM,
      mnemonic: "one two three four five six seven eight nine ten eleven twelve",
      keystoreJson: '{"version":3}',
    });
    expect(native.createWallet).toHaveBeenCalledTimes(1);
  });

  it("trims addresses before validating them natively", async () => {
    const native = makeNativeModule();
    setNativeWalletModule(native);

    await expect(validateAddressWithNative(`  ${FROM}  `)).resolves.toBe(true);
    expect(native.validateAddress).toHaveBeenCalledWith(FROM);
  });

  it("forwards keystore lookups and fee estimates", async () => {
    const native = makeNativeModule();
    setNativeWalletModule(native);

    await expect(addressFromKeystore('{"version":3}')).resolves.toBe(FROM);
    await expect(estimateFeeDefault()).resolves.toEqual({
      feeAcp: "0.00000100",
      feeUnits: 100,
    });
    expect(native.addressFromKeystore).toHaveBeenCalledWith('{"version":3}');
    expect(native.estimateFeeDefault).toHaveBeenCalledTimes(1);
  });

  it("validates addresses and forwards signing params without the from field", async () => {
    const native = makeNativeModule();
    setNativeWalletModule(native);

    await expect(
      signAndPrepareTransfer("https://acp1.ancap.cloud/rpc", '{"version":3}', {
        from: FROM,
        to: TO,
        amountAcp: "2.5",
        feeAcp: "0.00000100",
      })
    ).resolves.toEqual({
      rawTx: "deadbeef",
      txid: "tx-123",
    });

    expect(native.signTransfer).toHaveBeenCalledWith({
      rpcUrl: "https://acp1.ancap.cloud/rpc",
      keystoreJson: '{"version":3}',
      to: TO,
      amountAcp: "2.5",
      feeAcp: "0.00000100",
    });
  });

  it("rejects invalid ACP addresses before calling native signing", async () => {
    const native = makeNativeModule();
    setNativeWalletModule(native);

    await expect(
      signAndPrepareTransfer("https://acp1.ancap.cloud/rpc", '{"version":3}', {
        from: "not-an-address",
        to: TO,
        amountAcp: "1",
      })
    ).rejects.toThrow("from is invalid");
    expect(native.signTransfer).not.toHaveBeenCalled();
  });
});
