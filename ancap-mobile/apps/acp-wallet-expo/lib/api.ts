import { AcpApiClient } from "@ancap/acp-api-client";

let client: AcpApiClient | null = null;
let clientAuthHeader: string | null = null;
let clientBaseUrl: string | null = null;

function getConfiguredApiBase(): string {
  const raw = process.env.EXPO_PUBLIC_ANCAP_API_BASE?.trim();
  return raw || "https://api.ancap.cloud/v1";
}

function getConfiguredAuthHeader(): string | null {
  const raw = process.env.EXPO_PUBLIC_ANCAP_API_AUTH_HEADER?.trim();
  return raw ? raw : null;
}

export function hasApiAuthHeader(): boolean {
  return Boolean(getConfiguredAuthHeader());
}

export function resetApiClientForTests(): void {
  client = null;
  clientAuthHeader = null;
  clientBaseUrl = null;
}

export function getApi(): AcpApiClient {
  const baseUrl = getConfiguredApiBase();
  const authHeader = getConfiguredAuthHeader();
  if (!client || clientBaseUrl !== baseUrl || clientAuthHeader !== authHeader) {
    client = new AcpApiClient({
      baseUrl,
      authHeader: authHeader ?? undefined,
    });
    clientBaseUrl = baseUrl;
    clientAuthHeader = authHeader;
  }
  return client;
}
