import { describe, expect, it } from "vitest";

import { deriveSmartPaySnapshotOrigin } from "./smart-pay-snapshot-origin";

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
});
