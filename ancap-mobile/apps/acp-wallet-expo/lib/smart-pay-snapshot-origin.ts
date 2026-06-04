import type { SmartPayHistorySnapshotOrigin } from "./smart-pay-history";

export type DeriveSmartPaySnapshotOriginInput = {
  hasAccountAuth: boolean;
  sessionToken?: string | null;
  previousOrigin?: SmartPayHistorySnapshotOrigin | null;
  regainedSessionTokenFromBackend?: boolean;
};

export function deriveSmartPaySnapshotOrigin(
  input: DeriveSmartPaySnapshotOriginInput
): SmartPayHistorySnapshotOrigin {
  const previousOrigin = input.previousOrigin ?? null;
  const hadMergedOrigin = previousOrigin === "local+backend";

  if (input.regainedSessionTokenFromBackend) {
    return "local+backend";
  }

  if (input.sessionToken) {
    if (hadMergedOrigin) {
      return "local+backend";
    }
    return previousOrigin === "backend" ? "local+backend" : "local";
  }

  if (hadMergedOrigin) {
    return "local+backend";
  }

  if (previousOrigin === "backend") {
    return "backend";
  }

  if (previousOrigin === "local") {
    return "local";
  }

  if (input.hasAccountAuth) {
    return "backend";
  }

  return "local";
}
