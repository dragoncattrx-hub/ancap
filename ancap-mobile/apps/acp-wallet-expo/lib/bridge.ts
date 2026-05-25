import { AcpBridgeClient } from "@ancap/acp-bridge-client";

const API_BASE =
  process.env.EXPO_PUBLIC_ANCAP_API_BASE ?? "https://api.ancap.cloud/v1";

let client: AcpBridgeClient | null = null;

export function getBridgeClient(authHeader?: string): AcpBridgeClient {
  if (!client || authHeader) {
    return new AcpBridgeClient(API_BASE, fetch, authHeader);
  }
  client = new AcpBridgeClient(API_BASE);
  return client;
}
