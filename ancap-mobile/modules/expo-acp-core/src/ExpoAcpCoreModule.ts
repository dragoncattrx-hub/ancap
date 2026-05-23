import { NativeModule, requireNativeModule } from "expo-modules-core";

/** Typed native module — implemented in Kotlin/Swift after UniFFI link. */
declare class ExpoAcpCoreModule extends NativeModule {
  createWallet(): Promise<{
    address: string;
    mnemonic: string;
    keystoreJson: string;
  }>;
  validateAddress(address: string): boolean;
  addressFromKeystore(keystoreJson: string): Promise<string>;
  estimateFeeDefault(): Promise<{ feeAcp: string; feeUnits: number }>;
  signTransfer(
    rpcUrl: string,
    keystoreJson: string,
    toAddress: string,
    amountAcp: string,
    feeAcp: string | null
  ): Promise<{ rawTx: string; txid: string }>;
}

export default requireNativeModule<ExpoAcpCoreModule>("ExpoAcpCore");
