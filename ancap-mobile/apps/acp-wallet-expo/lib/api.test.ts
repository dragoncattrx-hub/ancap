import { afterEach, describe, expect, it } from "vitest";

import {
  getApi,
  hasApiAuthHeader,
  resetApiClientForTests,
} from "./api";

const originalApiBase = process.env.EXPO_PUBLIC_ANCAP_API_BASE;
const originalAuthHeader = process.env.EXPO_PUBLIC_ANCAP_API_AUTH_HEADER;

describe("expo api client wiring", () => {
  afterEach(() => {
    if (originalApiBase === undefined) {
      delete process.env.EXPO_PUBLIC_ANCAP_API_BASE;
    } else {
      process.env.EXPO_PUBLIC_ANCAP_API_BASE = originalApiBase;
    }

    if (originalAuthHeader === undefined) {
      delete process.env.EXPO_PUBLIC_ANCAP_API_AUTH_HEADER;
    } else {
      process.env.EXPO_PUBLIC_ANCAP_API_AUTH_HEADER = originalAuthHeader;
    }

    resetApiClientForTests();
  });

  it("reuses the same client when base URL and auth configuration are unchanged", () => {
    delete process.env.EXPO_PUBLIC_ANCAP_API_BASE;
    delete process.env.EXPO_PUBLIC_ANCAP_API_AUTH_HEADER;
    resetApiClientForTests();

    const first = getApi();
    const second = getApi();

    expect(first).toBe(second);
    expect(hasApiAuthHeader()).toBe(false);
  });

  it("attaches the configured auth header for authenticated mobile history", () => {
    process.env.EXPO_PUBLIC_ANCAP_API_AUTH_HEADER = "Bearer wallet-test-token";
    resetApiClientForTests();

    const client = getApi() as unknown as { authHeader?: string };

    expect(hasApiAuthHeader()).toBe(true);
    expect(client.authHeader).toBe("Bearer wallet-test-token");
  });

  it("recreates the client when the configured auth header changes", () => {
    process.env.EXPO_PUBLIC_ANCAP_API_AUTH_HEADER = "Bearer token-one";
    resetApiClientForTests();
    const first = getApi();

    process.env.EXPO_PUBLIC_ANCAP_API_AUTH_HEADER = "Bearer token-two";
    const second = getApi() as unknown as { authHeader?: string };

    expect(second).not.toBe(first);
    expect(second.authHeader).toBe("Bearer token-two");
  });

  it("recreates the client when the configured API base changes", () => {
    process.env.EXPO_PUBLIC_ANCAP_API_BASE = "https://api-one.ancap.cloud/v1";
    resetApiClientForTests();
    const first = getApi();

    process.env.EXPO_PUBLIC_ANCAP_API_BASE = "https://api-two.ancap.cloud/v1";
    const second = getApi() as unknown as { baseUrl?: string };

    expect(second).not.toBe(first);
    expect(second.baseUrl).toBe("https://api-two.ancap.cloud/v1");
  });
});
