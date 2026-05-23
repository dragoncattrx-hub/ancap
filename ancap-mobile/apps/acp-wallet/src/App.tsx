/**
 * Placeholder until React Native native projects are generated.
 * Validates monorepo package wiring at typecheck time.
 */
import { AcpApiClient } from "@ancap/acp-api-client";
import { validateAcpAddress } from "@ancap/acp-wallet-sdk";

const DEFAULT_API = "https://api.ancap.cloud/v1";

export function createAppServices(apiBaseUrl: string = DEFAULT_API) {
  return {
    api: new AcpApiClient({ baseUrl: apiBaseUrl }),
    validateAddress: validateAcpAddress,
  };
}

export type AppServices = ReturnType<typeof createAppServices>;

export const APP_NAME = "ANCAP ACP Wallet";
