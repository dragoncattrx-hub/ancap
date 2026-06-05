import { describe, expect, it } from "vitest";

import {
  deriveSmartPayExecuteSnapshotOrigin,
  deriveSmartPayLiveUpdateSnapshotOrigin,
  deriveSmartPaySnapshotOrigin,
} from "./smart-pay-snapshot-origin";

describe("deriveSmartPaySnapshotOrigin", () => {
  it("keeps local-only sessions local when no backend context exists", () => {
    expect(
      deriveSmartPaySnapshotOrigin({
        hasAccountAuth: false,
        sessionToken: "session-token",
      })
    ).toBe("local");
  });

  it("marks backend-only snapshots when auth exists but no live session token is present", () => {
    expect(
      deriveSmartPaySnapshotOrigin({
        hasAccountAuth: true,
        sessionToken: null,
      })
    ).toBe("backend");
  });

  it("preserves merged provenance when a backend-backed session is resumed locally", () => {
    expect(
      deriveSmartPaySnapshotOrigin({
        hasAccountAuth: true,
        sessionToken: "session-token",
        previousOrigin: "local+backend",
      })
    ).toBe("local+backend");
  });

  it("marks provenance as merged when backend refresh/recover re-issues a live session token", () => {
    expect(
      deriveSmartPaySnapshotOrigin({
        hasAccountAuth: true,
        sessionToken: "session-token",
        previousOrigin: "backend",
        regainedSessionTokenFromBackend: true,
      })
    ).toBe("local+backend");
  });

  it("does not upgrade plain local sessions to merged without backend regain evidence", () => {
    expect(
      deriveSmartPaySnapshotOrigin({
        hasAccountAuth: true,
        sessionToken: "session-token",
        previousOrigin: "local",
      })
    ).toBe("local");
  });

  it("keeps fresh execute snapshots local even when the device is signed in", () => {
    expect(
      deriveSmartPayExecuteSnapshotOrigin({
        hasAccountAuth: true,
        nextSessionToken: "session-token",
        currentOrigin: "local",
      })
    ).toBe("local");
  });

  it("preserves merged provenance across live refreshes that reuse an already-known session token", () => {
    expect(
      deriveSmartPayLiveUpdateSnapshotOrigin({
        hasAccountAuth: true,
        requestSessionToken: "session-token",
        nextSessionToken: "session-token",
        currentOrigin: "backend",
        activeHistoryOrigin: "local+backend",
      })
    ).toBe("local+backend");
  });

  it("promotes backend history to merged when a refresh or recover call reissues session access", () => {
    expect(
      deriveSmartPayLiveUpdateSnapshotOrigin({
        hasAccountAuth: true,
        requestSessionToken: null,
        nextSessionToken: "session-token",
        currentOrigin: "backend",
        activeHistoryOrigin: "backend",
      })
    ).toBe("local+backend");
  });

  it("keeps backend-only provenance on auth-only refreshes that still have no live session token", () => {
    expect(
      deriveSmartPayLiveUpdateSnapshotOrigin({
        hasAccountAuth: true,
        requestSessionToken: null,
        nextSessionToken: null,
        currentOrigin: "backend",
        activeHistoryOrigin: "backend",
      })
    ).toBe("backend");
  });

  it("treats blank session-token strings as absent instead of promoting provenance", () => {
    expect(
      deriveSmartPaySnapshotOrigin({
        hasAccountAuth: true,
        sessionToken: "   ",
        previousOrigin: "backend",
      })
    ).toBe("backend");

    expect(
      deriveSmartPayLiveUpdateSnapshotOrigin({
        hasAccountAuth: true,
        requestSessionToken: "   ",
        nextSessionToken: "   ",
        currentOrigin: "backend",
        activeHistoryOrigin: "backend",
      })
    ).toBe("backend");
  });
});
