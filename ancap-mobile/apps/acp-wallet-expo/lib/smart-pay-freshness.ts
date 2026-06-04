import type { SmartPayPaymentIntent, SmartPayQuote } from "@ancap/acp-api-client";
import { isSmartPayQuoteExpired } from "./smart-pay-quote";

type SmartPayQuoteFreshnessOptions = {
  intent: SmartPayPaymentIntent | null;
  quote: SmartPayQuote | null;
  rawPayload: string;
  selectedAsset: string;
};

function normalizeSmartPayDraftPayload(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function getSmartPayIntentFreshnessWarning(
  intent: SmartPayPaymentIntent | null,
  rawPayload: string
): string | null {
  if (!intent) {
    return null;
  }

  const normalizedDraft = normalizeSmartPayDraftPayload(rawPayload);
  if (!normalizedDraft) {
    return "Payload is empty. Paste or scan a payment payload, then parse again before requesting a quote.";
  }

  if (normalizeSmartPayDraftPayload(intent.rawPayload) !== normalizedDraft) {
    return "Payload changed since the last parse. Parse again before requesting a quote.";
  }

  return null;
}

export function getSmartPayQuoteFreshnessWarning(
  options: SmartPayQuoteFreshnessOptions
): string | null {
  const intentWarning = getSmartPayIntentFreshnessWarning(options.intent, options.rawPayload);
  if (intentWarning) {
    return intentWarning.replace("requesting a quote", "reviewing or executing this quote");
  }

  if (!options.quote) {
    return null;
  }

  if (options.quote.sourceAsset.symbol !== options.selectedAsset) {
    return `Preferred source asset changed from ${options.quote.sourceAsset.symbol} to ${options.selectedAsset}. Get a fresh quote before reviewing or executing payment.`;
  }

  return null;
}

export function canSmartPayRequestQuote(
  intent: SmartPayPaymentIntent | null,
  rawPayload: string
): boolean {
  return Boolean(intent) && !getSmartPayIntentFreshnessWarning(intent, rawPayload);
}

export function canSmartPayReviewQuote(
  options: SmartPayQuoteFreshnessOptions,
  now = Date.now()
): boolean {
  return Boolean(options.intent && options.quote)
    && !getSmartPayQuoteFreshnessWarning(options)
    && !isSmartPayQuoteExpired(options.quote!, now);
}
