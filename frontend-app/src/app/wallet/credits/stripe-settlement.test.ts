import { describe, expect, it } from "vitest";

import { getStripePaymentMethodEvidence, getStripeSettlementSignal } from "./stripe-settlement";

describe("getStripeSettlementSignal", () => {
  it("marks webhook-backed settlement explicitly", () => {
    expect(
      getStripeSettlementSignal({
        stripe_last_event_type: "payment_intent.succeeded",
        stripe_last_event_id: "evt_test_123",
        stripe_last_event_at: "2026-05-31T18:03:00.000Z",
      })
    ).toMatchObject({
      source: "webhook",
      label: "webhook",
      verification: "confirmed",
      verificationLabel: "webhook delivery confirmed",
      lastEventType: "payment_intent.succeeded",
      lastEventId: "evt_test_123",
      lastEventAt: "2026-05-31T18:03:00.000Z",
    });
  });

  it("marks poll fallback separately from webhook delivery", () => {
    expect(
      getStripeSettlementSignal({
        stripe_last_event_type: "payment_intent.succeeded",
        stripe_last_event_id: "stripe:poll",
        stripe_last_event_at: "2026-05-31T18:01:00.000Z",
        stripe_last_polled_at: "2026-05-31T18:00:00.000Z",
      })
    ).toMatchObject({
      source: "poll_fallback",
      label: "poll fallback",
      verification: "open",
      verificationLabel: "live webhook verification still open",
      lastEventType: "payment_intent.succeeded",
      lastEventId: "stripe:poll",
      lastEventAt: "2026-05-31T18:01:00.000Z",
      lastPolledAt: "2026-05-31T18:00:00.000Z",
    });
    const signal = getStripeSettlementSignal({
      stripe_last_event_type: "payment_intent.succeeded",
      stripe_last_event_id: "stripe:poll",
    });
    expect(signal.hint).toContain("does not prove webhook delivery");
    expect(signal.verificationHint).toContain("resilience proof only");
  });

  it("keeps pending state honest when no settlement event exists yet", () => {
    expect(getStripeSettlementSignal(null)).toEqual({
      source: "pending",
      label: "pending",
      hint: "",
      verification: "pending",
      verificationLabel: "awaiting terminal settlement evidence",
      verificationHint: "",
      lastEventType: "",
      lastEventId: "",
      lastEventAt: "",
      lastPolledAt: "",
    });
  });

  it("surfaces saved-card evidence from provider payload", () => {
    expect(
      getStripePaymentMethodEvidence({
        payment_method_selection: "saved_method",
        save_payment_method_requested: true,
        requested_payment_method_id: "pm_saved_123",
      })
    ).toMatchObject({
      selection: "saved_method",
      selectionLabel: "saved card",
      saveRequested: true,
      saveRequestedLabel: "requested",
      requestedPaymentMethodId: "pm_saved_123",
    });
  });

  it("surfaces new-card evidence from provider payload", () => {
    expect(
      getStripePaymentMethodEvidence({
        payment_method_selection: "new_card",
        save_payment_method_requested: false,
      })
    ).toMatchObject({
      selection: "new_card",
      selectionLabel: "new card",
      saveRequested: false,
      saveRequestedLabel: "not requested",
      requestedPaymentMethodId: "",
    });
  });
});
