import { buildWacpWatchAssetParams, getWacpTokenImageUrl, WACP_BSC_CONTRACT } from "@/lib/wacpToken";

describe("wacpToken", () => {
  it("builds EIP-747 watchAsset params with logo URL", () => {
    const params = buildWacpWatchAssetParams(
      WACP_BSC_CONTRACT,
      "https://ancap.cloud/icons/icon-512.svg",
    );
    expect(params).toEqual({
      type: "ERC20",
      options: {
        address: WACP_BSC_CONTRACT,
        symbol: "wACP",
        decimals: 18,
        image: "https://ancap.cloud/icons/icon-512.svg",
      },
    });
  });

  it("uses site origin for token image when provided", () => {
    expect(getWacpTokenImageUrl("http://localhost:3000")).toBe(
      "http://localhost:3000/icons/icon-512.svg",
    );
  });
});
