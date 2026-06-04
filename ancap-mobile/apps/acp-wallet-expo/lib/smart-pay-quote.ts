import type { SmartPayQuote } from "@ancap/acp-api-client";
import { formatSmartPayTimestamp } from "./smart-pay-history-view";

function parseQuoteExpiry(quote: SmartPayQuote): number | null {
  const timestamp = Date.parse(quote.expiresAt);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function isSmartPayQuoteExpired(quote: SmartPayQuote, now = Date.now()): boolean {
  const timestamp = parseQuoteExpiry(quote);
  if (timestamp === null) return false;
  return timestamp <= now;
}

export function getSmartPayQuoteExpiryLabel(quote: SmartPayQuote): string {
  return `Expires: ${formatSmartPayTimestamp(quote.expiresAt)}`;
}

export function getSmartPayQuoteExpiryHint(quote: SmartPayQuote, now = Date.now()): string {
  const timestamp = parseQuoteExpiry(quote);
  if (timestamp === null) {
    return "Quote expiry is unavailable; refresh the quote if timing is uncertain.";
  }

  const diffMs = timestamp - now;
  if (diffMs <= 0) {
    return "Quote expired; refresh pricing before reviewing or executing payment.";
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) {
    return `Quote expires in ${diffSeconds}s; refresh pricing if you need more review time.`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  const remainingSeconds = diffSeconds % 60;
  if (remainingSeconds === 0) {
    return `Quote expires in ${diffMinutes}m; execute soon or refresh pricing.`;
  }

  return `Quote expires in ${diffMinutes}m ${remainingSeconds}s; execute soon or refresh pricing.`;
}
