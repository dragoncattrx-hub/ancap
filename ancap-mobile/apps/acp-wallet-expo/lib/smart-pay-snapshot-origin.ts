import type { SmartPayHistorySnapshotOrigin } from "./smart-pay-history";

export type DeriveSmartPaySnapshotOriginInput = {
  hasAccountAuth: boolean;
  sessionToken?: string | null;
  previousOrigin?: SmartPayHistorySnapshotOrigin | null;
  regainedSessionTokenFromBackend?: boolean;
};

export type DeriveSmartPayLiveUpdateSnapshotOriginInput = {
  hasAccountAuth: boolean;
  requestSessionToken?: string | null;
  nextSessionToken?: string | null;
  currentOrigin?: SmartPayHistorySnapshotOrigin | null;
  activeHistoryOrigin?: SmartPayHistorySnapshotOrigin | null;
};

export function normalizeSmartPaySessionToken(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function deriveSmartPaySnapshotOrigin(
  input: DeriveSmartPaySnapshotOriginInput
): SmartPayHistorySnapshotOrigin {
  const previousOrigin = input.previousOrigin ?? null;
  const hadMergedOrigin = previousOrigin === "local+backend";
  const sessionToken = normalizeSmartPaySessionToken(input.sessionToken);

  if (input.regainedSessionTokenFromBackend) {
    return "local+backend";
  }

  if (sessionToken) {
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

export function deriveSmartPayLiveUpdateSnapshotOrigin(
  input: DeriveSmartPayLiveUpdateSnapshotOriginInput
): SmartPayHistorySnapshotOrigin {
  const requestSessionToken = normalizeSmartPaySessionToken(input.requestSessionToken);
  const nextSessionToken = normalizeSmartPaySessionToken(input.nextSessionToken);
  const previousOrigin = input.activeHistoryOrigin ?? input.currentOrigin ?? null;

  return deriveSmartPaySnapshotOrigin({
    hasAccountAuth: input.hasAccountAuth,
    sessionToken: nextSessionToken,
    previousOrigin,
    regainedSessionTokenFromBackend: Boolean(nextSessionToken && !requestSessionToken),
  });
}
