/**
 * API base URL for server-side (SSR/RSC) fetches.
 *
 * Server components cannot use the relative "/api" proxy path, so resolution is:
 * 1. ANCAP_SERVER_API_URL — explicit server-only override
 *    (e.g. http://api:8000 inside the Docker prod stack).
 * 2. Development default: local backend on 127.0.0.1:8001.
 * 3. NEXT_PUBLIC_API_URL when it is absolute.
 * 4. Production fallback: the public ancap.cloud API.
 */
export function getServerApiBase(): string {
  const explicit = (process.env.ANCAP_SERVER_API_URL || "").trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "development") return "http://127.0.0.1:8001";
  const publicUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (/^https?:\/\//.test(publicUrl)) return publicUrl.replace(/\/+$/, "");
  return "https://ancap.cloud/api/v1";
}

/** SSR fetch with User-Agent (Cloudflare blocks bare Node fetch with 403). */
export function serverApiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "ancap-frontend-ssr/1.0");
  }
  return fetch(input, { ...init, headers });
}
