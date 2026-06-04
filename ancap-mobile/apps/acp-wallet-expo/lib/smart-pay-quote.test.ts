import { describe, expect, it } from "vitest";
import type { SmartPayQuote } from "@ancap/acp-api-client";
import {
  getSmartPayQuoteExpiryHint,
  getSmartPayQuoteExpiryLabel,
  isSmartPayQuoteExpired,
} from "./smart-pay-quote";

function makeQuote(expiresAt: string): SmartPayQuote {
  return {
    quoteId: "quote-1",
    paymentIntentId: "intent-1",
    mode: "direct_send",
    expiresAt,
    sourceAsset: {
      network: "acp",
      symbol: "ACP",
      tokenAddress: null,
      decimals: 8,
    },
    targetAsset: {
      network: "acp",
      symbol: "ACP",
      tokenAddress: null,
      decimals: 8,
    },
    targetAmount: "14.8",
    requiredSourceAmount: "15.0",
    serviceFeeAcp: "0.2",
    networkFee: [],
    slippageBps: 0,
    route: [],
    warnings: [],
    riskFlags: [],
  };
}

describe("smart pay quote helpers", () => {
  it("formats quote expiry labels with stable UTC output", () => {
    expect(getSmartPayQuoteExpiryLabel(makeQuote("2026-05-28T18:10:00.000Z"))).toBe(
      "Expires: 2026-05-28 18:10 UTC"
    );
  });

  it("marks expired quotes and tells the user to re-quote", () => {
    const now = Date.parse("2026-05-28T18:11:00.000Z");
    const quote = makeQuote("2026-05-28T18:10:00.000Z");

    expect(isSmartPayQuoteExpired(quote, now)).toBe(true);
    expect(getSmartPayQuoteExpiryHint(quote, now)).toBe(
      "Quote expired; refresh pricing before reviewing or executing payment."
    );
  });

  it("shows short countdown hints for fresh quotes", () => {
    const now = Date.parse("2026-05-28T18:09:15.000Z");
    const quote = makeQuote("2026-05-28T18:10:45.000Z");

    expect(isSmartPayQuoteExpired(quote, now)).toBe(false);
    expect(getSmartPayQuoteExpiryHint(quote, now)).toBe(
      "Quote expires in 1m 30s; execute soon or refresh pricing."
    );
  });

  it("handles invalid timestamps without treating the quote as expired", () => {
    const quote = makeQuote("not-a-date");

    expect(isSmartPayQuoteExpired(quote, Date.parse("2026-05-28T18:11:00.000Z"))).toBe(false);
    expect(getSmartPayQuoteExpiryHint(quote)).toBe(
      "Quote expiry is unavailable; refresh the quote if timing is uncertain."
    );
  });
});
