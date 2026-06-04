export type StripeSettlementSource = "pending" | "webhook" | "poll_fallback";
export type StripeSettlementVerification = "pending" | "confirmed" | "open";
export type StripePaymentMethodSelection = "saved_method" | "new_card" | "unknown";

export type StripeSettlementSignal = {
  source: StripeSettlementSource;
  label: string;
  hint: string;
  verification: StripeSettlementVerification;
  verificationLabel: string;
  verificationHint: string;
  lastEventType: string;
  lastEventId: string;
  lastEventAt: string;
  lastPolledAt: string;
};

export type StripePaymentMethodEvidence = {
  selection: StripePaymentMethodSelection;
  selectionLabel: string;
  selectionHint: string;
  saveRequested: boolean | null;
  saveRequestedLabel: string;
  requestedPaymentMethodId: string;
};

function readOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
}

export function getStripeSettlementSignal(
  providerPayload: Record<string, unknown> | null | undefined
): StripeSettlementSignal {
  const lastEventType = typeof providerPayload?.stripe_last_event_type === "string"
    ? providerPayload.stripe_last_event_type
    : "";
  const lastEventId = typeof providerPayload?.stripe_last_event_id === "string"
    ? providerPayload.stripe_last_event_id
    : "";
  const lastEventAt = typeof providerPayload?.stripe_last_event_at === "string"
    ? providerPayload.stripe_last_event_at
    : "";
  const lastPolledAt = typeof providerPayload?.stripe_last_polled_at === "string"
    ? providerPayload.stripe_last_polled_at
    : "";

  if (lastEventId === "stripe:poll") {
    return {
      source: "poll_fallback",
      label: "poll fallback",
      hint: "Stripe reported a terminal status via polling, so credits are captured, but this alone does not prove webhook delivery reached ANCAP.",
      verification: "open",
      verificationLabel: "live webhook verification still open",
      verificationHint: "Treat this as resilience proof only until a real Stripe webhook event is delivered to ANCAP.",
      lastEventType,
      lastEventId,
      lastEventAt,
      lastPolledAt,
    };
  }

  if (lastEventType) {
    return {
      source: "webhook",
      label: "webhook",
      hint: "Webhook delivery reached ANCAP and updated this credit top-up state.",
      verification: "confirmed",
      verificationLabel: "webhook delivery confirmed",
      verificationHint: "This run has the webhook-side settlement evidence needed for the Stripe verification runbook.",
      lastEventType,
      lastEventId,
      lastEventAt,
      lastPolledAt,
    };
  }

  return {
    source: "pending",
    label: "pending",
    hint: lastPolledAt
      ? "ANCAP has polled Stripe recently, but no terminal settlement event has been recorded yet."
      : "",
    verification: "pending",
    verificationLabel: "awaiting terminal settlement evidence",
    verificationHint: lastPolledAt
      ? "Polling has started, but there is still no webhook or poll-fallback terminal signal to record as evidence yet."
      : "",
    lastEventType,
    lastEventId,
    lastEventAt,
    lastPolledAt,
  };
}

export function getStripePaymentMethodEvidence(
  providerPayload: Record<string, unknown> | null | undefined
): StripePaymentMethodEvidence {
  const requestedPaymentMethodId = typeof providerPayload?.requested_payment_method_id === "string"
    ? providerPayload.requested_payment_method_id
    : typeof providerPayload?.payment_method_id === "string"
      ? providerPayload.payment_method_id
      : "";
  const rawSelection = typeof providerPayload?.payment_method_selection === "string"
    ? providerPayload.payment_method_selection
    : "";
  const saveRequested = readOptionalBoolean(providerPayload?.save_payment_method_requested);
  const selection: StripePaymentMethodSelection = rawSelection === "saved_method" || (!rawSelection && requestedPaymentMethodId)
    ? "saved_method"
    : rawSelection === "new_card"
      ? "new_card"
      : "unknown";

  if (selection === "saved_method") {
    return {
      selection,
      selectionLabel: "saved card",
      selectionHint: "This top-up intent was created to reuse a saved Stripe payment method.",
      saveRequested,
      saveRequestedLabel: saveRequested === true ? "requested" : saveRequested === false ? "not requested" : "unknown",
      requestedPaymentMethodId,
    };
  }

  if (selection === "new_card") {
    return {
      selection,
      selectionLabel: "new card",
      selectionHint: "This top-up intent was created for fresh Stripe.js card entry.",
      saveRequested,
      saveRequestedLabel: saveRequested === true ? "requested" : saveRequested === false ? "not requested" : "unknown",
      requestedPaymentMethodId,
    };
  }

  return {
    selection: "unknown",
    selectionLabel: "unknown",
    selectionHint: "",
    saveRequested,
    saveRequestedLabel: saveRequested === true ? "requested" : saveRequested === false ? "not requested" : "unknown",
    requestedPaymentMethodId,
  };
}
