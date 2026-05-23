/** Matches backend `wallet_acp._ACP_ADDRESS_RE`. */
const ACP_ADDRESS_RE = /^acp1[a-z0-9]{20,100}$/;

export function validateAcpAddress(address: string): boolean {
  return ACP_ADDRESS_RE.test((address || "").trim());
}

export function assertAcpAddress(address: string, field = "address"): string {
  const out = (address || "").trim();
  if (!validateAcpAddress(out)) {
    throw new Error(
      `${field} is invalid; expected ACP address starting with acp1`
    );
  }
  return out;
}
