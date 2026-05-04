export const ACP_TX_FALLBACK_BASE = "/acp/tx";

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
