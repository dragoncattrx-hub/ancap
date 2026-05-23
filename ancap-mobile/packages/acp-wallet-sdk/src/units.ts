/** ACP native decimals (see docs/mobile/WALLET_SPEC.md). */
export const ACP_DECIMALS = 8;
export const UNITS_PER_ACP = 10n ** 8n;

export function parseUnits(amount: string, decimals: number = ACP_DECIMALS): bigint {
  const s = amount.trim();
  if (!s || s === ".") {
    throw new Error("amount is empty");
  }
  const negative = s.startsWith("-");
  if (negative) {
    throw new Error("amount must be non-negative");
  }
  const [whole, frac = ""] = s.split(".");
  const wholePart = whole === "" ? 0n : BigInt(whole);
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const fracPart = fracPadded === "" ? 0n : BigInt(fracPadded);
  const scale = 10n ** BigInt(decimals);
  return wholePart * scale + fracPart;
}

export function formatUnits(units: bigint, decimals: number = ACP_DECIMALS): string {
  if (units < 0n) {
    throw new Error("units must be non-negative");
  }
  const scale = 10n ** BigInt(decimals);
  const whole = units / scale;
  const frac = units % scale;
  let fracStr = frac.toString().padStart(decimals, "0");
  fracStr = fracStr.replace(/0+$/, "");
  return fracStr.length ? `${whole}.${fracStr}` : `${whole}`;
}
