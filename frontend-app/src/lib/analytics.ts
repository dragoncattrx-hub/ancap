type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;
  const detail = { name, ...payload, ts: new Date().toISOString() };
  window.dispatchEvent(new CustomEvent("ancap:analytics", { detail }));
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", detail);
  }
}

export const commerceEvents = {
  workflowView: (slug: string) => trackEvent("workflow_view", { slug }),
  checkoutStart: (context: string, amount?: string, currency?: string) =>
    trackEvent("checkout_start", { context, amount, currency }),
  paymentCaptured: (context: string, paymentIntentId?: string) =>
    trackEvent("payment_captured", { context, payment_intent_id: paymentIntentId }),
  receiptReady: (context: string, proofUrl?: string) =>
    trackEvent("receipt_ready", { context, proof_url: proofUrl }),
};
