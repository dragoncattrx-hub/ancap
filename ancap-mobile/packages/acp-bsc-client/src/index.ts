/** Read-only wACP (BEP-20) balance via JSON-RPC eth_call — MVP without bundling ethers. */

const BALANCE_OF_SELECTOR = "0x70a08231";

export const WACP_DECIMALS = 18;

export function isValidBscAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test((addr || "").trim());
}

function padAddress(address: string): string {
  const hex = address.toLowerCase().replace(/^0x/, "");
  return hex.padStart(64, "0");
}

export async function fetchWacpBalanceWei(params: {
  rpcUrl: string;
  contract: string;
  holder: string;
  fetchImpl?: typeof fetch;
}): Promise<bigint> {
  const { rpcUrl, contract, holder } = params;
  const f = params.fetchImpl ?? fetch;
  if (!isValidBscAddress(contract) || !isValidBscAddress(holder)) {
    throw new Error("Invalid BSC address or contract");
  }
  const data = BALANCE_OF_SELECTOR + padAddress(holder);
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [
      { to: contract, data },
      "latest",
    ],
  };
  const res = await f(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { result?: string; error?: unknown };
  if (!json.result) {
    throw new Error("BSC RPC eth_call failed");
  }
  return BigInt(json.result);
}

export function formatWacp(wei: bigint): string {
  const scale = 10n ** 18n;
  const whole = wei / scale;
  const frac = wei % scale;
  let fracStr = frac.toString().padStart(18, "0").replace(/0+$/, "");
  return fracStr.length ? `${whole}.${fracStr}` : `${whole}`;
}
