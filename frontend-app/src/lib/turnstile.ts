export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

/**
 * Turnstile is only enforced when a site key is configured. The backend
 * mirrors this: verification is skipped when TURNSTILE_SECRET_KEY is unset,
 * so local/dev stacks without keys can still log in and register.
 */
export const TURNSTILE_ENABLED = Boolean(TURNSTILE_SITE_KEY);
