export const ACP_TX_FALLBACK_BASE = "/explorer/tx";

export function sanitizeAcpTxid(raw: string | null | undefined): string {
  return String(raw || "")
    .trim()
    .replace(/^[<\[]+|[>\]]+$/g, "")
    .trim();
}

export function buildAcpTxHref(
  txid: string | null | undefined,
  explorerBase: string | null | undefined = ACP_TX_FALLBACK_BASE,
): string {
  const cleanTxid = sanitizeAcpTxid(txid);
  if (!cleanTxid) return "";
  const base = String(explorerBase || ACP_TX_FALLBACK_BASE).replace(/\/$/, "");
  return `${base}/${cleanTxid}`;
}

export function buildAcpBlockHref(id: string | number | null | undefined): string {
  if (id == null || id === "") return "/explorer";
  return `/explorer/block/${encodeURIComponent(String(id))}`;
}

export function buildAcpAddressHref(address: string | null | undefined): string {
  const addr = String(address || "").trim();
  if (!addr) return "/explorer";
  return `/explorer/address/${encodeURIComponent(addr)}`;
}
