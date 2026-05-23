export type WalletMeta = {
  address: string;
  /** Present only during onboarding before vault save — never persist plaintext. */
  mnemonic?: string;
};

export type TransferRequest = {
  from: string;
  to: string;
  amountAcp: string;
  feeAcp?: string;
};

export type SignedTransaction = {
  rawTx: string;
  txid: string;
};

export interface SecureVault {
  hasWallet(): Promise<boolean>;
  saveMnemonic(mnemonic: string): Promise<void>;
  loadMnemonic(): Promise<string>;
  wipe(): Promise<void>;
}
