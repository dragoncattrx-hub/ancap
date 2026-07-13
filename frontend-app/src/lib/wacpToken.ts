/** Canonical wACP (BEP-20) metadata for wallet_watchAsset (EIP-747). */
export const WACP_BSC_CONTRACT = "0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402";
export const WACP_SYMBOL = "wACP";
export const WACP_DECIMALS = 18;
export const BSC_CHAIN_ID_HEX = "0x38";
export const BSC_CHAIN_ID = 56;
export const WACP_TOKEN_IMAGE_ORIGIN = "https://ancap.cloud";
export const WACP_LOGO_PATH = "/wacp-logo.png";
export const WACP_BSCSCAN_TOKEN_UPDATE_URL =
  "https://bscscan.com/tokenupdate/0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402";

export type WatchAssetParams = {
  type: "ERC20";
  options: {
    address: string;
    symbol: string;
    decimals: number;
    image: string;
  };
};

export function getWacpLogoUrl(origin?: string): string {
  const base = (origin?.trim() || WACP_TOKEN_IMAGE_ORIGIN).replace(/\/$/, "");
  return `${base}${WACP_LOGO_PATH}`;
}

/** @deprecated Use getWacpLogoUrl — kept for callers expecting this name. */
export function getWacpTokenImageUrl(origin?: string): string {
  return getWacpLogoUrl(origin);
}

export function buildWacpWatchAssetParams(
  contractAddress: string = WACP_BSC_CONTRACT,
  imageUrl?: string,
): WatchAssetParams {
  return {
    type: "ERC20",
    options: {
      address: contractAddress,
      symbol: WACP_SYMBOL,
      decimals: WACP_DECIMALS,
      image: imageUrl || getWacpLogoUrl(),
    },
  };
}
