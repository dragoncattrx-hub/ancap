import { AcpApiClient } from "@ancap/acp-api-client";

const API_BASE =
  process.env.EXPO_PUBLIC_ANCAP_API_BASE ?? "https://api.ancap.cloud/v1";

let client: AcpApiClient | null = null;

export function getApi(): AcpApiClient {
  if (!client) {
    client = new AcpApiClient({ baseUrl: API_BASE });
  }
  return client;
}
