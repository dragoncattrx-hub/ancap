export type StripeCardElement = {
  mount: (element: string | HTMLElement) => void;
  destroy: () => void;
};

export type StripeElements = {
  create: (
    type: "card",
    options?: Record<string, unknown>,
  ) => StripeCardElement;
};

export type StripeConfirmCardPaymentResult = {
  error?: { message?: string };
  paymentIntent?: {
    id?: string;
    status?: string;
    payment_method?: unknown;
  };
};

export type StripeJs = {
  elements: () => StripeElements;
  confirmCardPayment: (
    clientSecret: string,
    data?: {
      payment_method?: string | { card: StripeCardElement };
    },
  ) => Promise<StripeConfirmCardPaymentResult>;
};

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeJs | null;
  }
}

let stripeScriptPromise: Promise<(publishableKey: string) => StripeJs | null> | null = null;

export async function loadStripeJs(): Promise<(publishableKey: string) => StripeJs | null> {
  if (typeof window === "undefined") {
    throw new Error("Stripe.js can only load in the browser");
  }

  if (window.Stripe) {
    return window.Stripe;
  }

  if (!stripeScriptPromise) {
    stripeScriptPromise = new Promise<(publishableKey: string) => StripeJs | null>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-ancap-stripe="true"]');
      if (existing) {
        existing.addEventListener("load", () => {
          if (window.Stripe) {
            resolve(window.Stripe);
          } else {
            reject(new Error("Stripe.js loaded without exposing window.Stripe"));
          }
        });
        existing.addEventListener("error", () => reject(new Error("Failed to load Stripe.js")));
        return;
      }

      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.async = true;
      script.defer = true;
      script.dataset.ancapStripe = "true";
      script.onload = () => {
        if (window.Stripe) {
          resolve(window.Stripe);
        } else {
          reject(new Error("Stripe.js loaded without exposing window.Stripe"));
        }
      };
      script.onerror = () => reject(new Error("Failed to load Stripe.js"));
      document.head.appendChild(script);
    }).catch((error) => {
      stripeScriptPromise = null;
      throw error;
    });
  }

  return stripeScriptPromise;
}
