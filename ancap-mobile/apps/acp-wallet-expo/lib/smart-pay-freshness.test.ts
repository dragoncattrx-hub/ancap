import { describe, expect, it } from "vitest";
import type { SmartPayPaymentIntent, SmartPayQuote } from "@ancap/acp-api-client";
import {
  canSmartPayRequestQuote,
  canSmartPayReviewQuote,
  getSmartPayIntentFreshnessWarning,
  getSmartPayQuoteFreshnessWarning,
} from "./smart-pay-freshness";

function makeIntent(overrides: Partial<SmartPayPaymentIntent> = {}): SmartPayPaymentIntent {
  return {
    id: "intent-1",
    createdAt: "2026-05-30T18:00:00.000Z",
    source: "paste",
    rawPayload: "acp:addr1?amount=1.0",
    payloadHash: "hash-1",
    parseMethod: "deterministic",
    confidence: 1,
    status: "parsed",
    network: "acp",
    asset: {
      kind: "native",
      symbol: "ACP",
      name: "Ancap Coin",
      tokenAddress: null,
      decimals: 8,
      isSupported: true,
      isAllowlisted: true,
    },
    recipient: {
      address: "addr1",
      addressType: "acp",
      checksumValid: null,
      ensOrAlias: null,
    },
    amount: {
      value: "1.0",
      atomicValue: "100000000",
      currencySymbol: "ACP",
      isExact: true,
      isMax: false,
    },
    memo: null,
    merchant: null,
    riskFlags: [],
    warnings: [],
    unsupportedReasons: [],
    requiresUserConfirmation: false,
    metadata: {
      detectedStandard: "acp_uri",
      invoiceType: null,
      aiModel: null,
      aiUsed: false,
      parserVersion: "test",
    },
    ...overrides,
  };
}

function makeQuote(overrides: Partial<SmartPayQuote> = {}): SmartPayQuote {
  return {
    quoteId: "quote-1",
    paymentIntentId: "intent-1",
    mode: "direct_send",
    expiresAt: "2026-05-30T19:00:00.000Z",
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
    targetAmount: "0.99",
    requiredSourceAmount: "1.0",
    serviceFeeAcp: "0.01",
    networkFee: [],
    slippageBps: 150,
    route: [],
    warnings: [],
    riskFlags: [],
    ...overrides,
  };
}

describe("smart pay freshness helpers", () => {
  it("accepts matching parsed payloads for quoting", () => {
    const intent = makeIntent();

    expect(getSmartPayIntentFreshnessWarning(intent, "  acp:addr1?amount=1.0 ")).toBeNull();
    expect(canSmartPayRequestQuote(intent, "acp:addr1?amount=1.0")).toBe(true);
  });

  it("blocks quote requests when payload changed after parsing", () => {
    const intent = makeIntent();

    expect(getSmartPayIntentFreshnessWarning(intent, "acp:addr2?amount=1.0")).toBe(
      "Payload changed since the last parse. Parse again before requesting a quote."
    );
    expect(canSmartPayRequestQuote(intent, "acp:addr2?amount=1.0")).toBe(false);
  });

  it("warns when quote is reviewed after payload changed", () => {
    const intent = makeIntent();
    const quote = makeQuote();

    expect(
      getSmartPayQuoteFreshnessWarning({
        intent,
        quote,
        rawPayload: "acp:addr2?amount=1.0",
        selectedAsset: "ACP",
      })
    ).toBe("Payload changed since the last parse. Parse again before reviewing or executing this quote.");
  });

  it("warns when preferred source asset changed after quoting", () => {
    const intent = makeIntent();
    const quote = makeQuote({
      sourceAsset: {
        network: "acp",
        symbol: "ACP",
        tokenAddress: null,
        decimals: 8,
      },
    });

    expect(
      getSmartPayQuoteFreshnessWarning({
        intent,
        quote,
        rawPayload: intent.rawPayload,
        selectedAsset: "USDT",
      })
    ).toBe(
      "Preferred source asset changed from ACP to USDT. Get a fresh quote before reviewing or executing payment."
    );
  });

  it("allows review only when payload, asset, and expiry are still fresh", () => {
    const intent = makeIntent();
    const quote = makeQuote({ expiresAt: "2026-05-30T19:00:00.000Z" });
    const now = Date.parse("2026-05-30T18:30:00.000Z");

    expect(
      canSmartPayReviewQuote(
        {
          intent,
          quote,
          rawPayload: intent.rawPayload,
          selectedAsset: "ACP",
        },
        now
      )
    ).toBe(true);
    expect(
      canSmartPayReviewQuote(
        {
          intent,
          quote,
          rawPayload: intent.rawPayload,
          selectedAsset: "USDT",
        },
        now
      )
    ).toBe(false);
    expect(
      canSmartPayReviewQuote(
        {
          intent,
          quote,
          rawPayload: "acp:addr2?amount=1.0",
          selectedAsset: "ACP",
        },
        now
      )
    ).toBe(false);
    expect(
      canSmartPayReviewQuote(
        {
          intent,
          quote,
          rawPayload: intent.rawPayload,
          selectedAsset: "ACP",
        },
        Date.parse("2026-05-30T19:00:01.000Z")
      )
    ).toBe(false);
  });
});
