export { ACP_DECIMALS, UNITS_PER_ACP, parseUnits, formatUnits } from "./units.js";
export { validateAcpAddress, assertAcpAddress } from "./address.js";
export { nativeCore } from "./native-stub.js";
export {
  createWallet,
  setNativeWalletModule,
  signAndPrepareTransfer,
} from "./wallet-service.js";
export type { CreatedWalletResult, NativeWalletModule } from "./wallet-service.js";
export type {
  WalletMeta,
  TransferRequest,
  SignedTransaction,
  SecureVault,
} from "./types.js";
