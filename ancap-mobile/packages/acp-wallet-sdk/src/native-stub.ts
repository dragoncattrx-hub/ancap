import type { WalletMeta } from "./types.js";

/**
 * Placeholder until `ACP-crypto/acp-mobile-ffi` is linked (UniFFI → iOS/Android).
 * Do not use in production — generates deterministic fake addresses for UI dev only.
 */
export const nativeCore = {
  async createWallet(): Promise<WalletMeta> {
    throw new Error(
      "Native ACP core not linked. Build acp-mobile-ffi (see docs/mobile/ROADMAP.md Phase 1)."
    );
  },

  async importMnemonic(_words: string[]): Promise<WalletMeta> {
    throw new Error("Native ACP core not linked.");
  },

  async signTransfer(_params: {
    mnemonic: string;
    to: string;
    amountAcp: string;
    feeAcp?: string;
  }): Promise<{ rawTx: string; txid: string }> {
    throw new Error("Native ACP core not linked.");
  },
};
