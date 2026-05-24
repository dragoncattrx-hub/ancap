import { assertAcpAddress } from "./address.js";
import type { SignedTransaction, TransferRequest } from "./types.js";

export type CreatedWalletResult = {
  address: string;
  mnemonic: string;
  keystoreJson: string;
};

export type FeeEstimateResult = {
  feeAcp: string;
  feeUnits: number;
};

export type NativeWalletModule = {
  createWallet(): Promise<CreatedWalletResult>;
  validateAddress(address: string): Promise<boolean>;
  addressFromKeystore(keystoreJson: string): Promise<string>;
  estimateFeeDefault(): Promise<FeeEstimateResult>;
  signTransfer(params: {
    rpcUrl: string;
    keystoreJson: string;
    to: string;
    amountAcp: string;
    feeAcp?: string;
  }): Promise<SignedTransaction>;
};

let nativeModule: NativeWalletModule | null | undefined;

export function setNativeWalletModule(mod: NativeWalletModule | null): void {
  nativeModule = mod;
}

function requireNative(): NativeWalletModule {
  if (!nativeModule) {
    throw new Error(
      "ACP native module is not linked. Use a dev build with expo-acp-core or import via walletd."
    );
  }
  return nativeModule;
}

export async function createWallet(): Promise<CreatedWalletResult> {
  const w = await requireNative().createWallet();
  return {
    address: w.address,
    mnemonic: w.mnemonic,
    keystoreJson: w.keystoreJson,
  };
}

export async function validateAddressWithNative(address: string): Promise<boolean> {
  return requireNative().validateAddress(address.trim());
}

export async function addressFromKeystore(keystoreJson: string): Promise<string> {
  return requireNative().addressFromKeystore(keystoreJson);
}

export async function estimateFeeDefault(): Promise<FeeEstimateResult> {
  const fee = await requireNative().estimateFeeDefault();
  return {
    feeAcp: fee.feeAcp,
    feeUnits: fee.feeUnits,
  };
}

export async function signAndPrepareTransfer(
  rpcUrl: string,
  keystoreJson: string,
  req: TransferRequest
): Promise<SignedTransaction> {
  assertAcpAddress(req.from, "from");
  assertAcpAddress(req.to, "to");
  return requireNative().signTransfer({
    rpcUrl,
    keystoreJson,
    to: req.to,
    amountAcp: req.amountAcp,
    feeAcp: req.feeAcp,
  });
}
