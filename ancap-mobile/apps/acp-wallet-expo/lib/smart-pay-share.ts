export type SmartPayShareParamValue = string | string[] | undefined;

export type SmartPayShareParams = {
  rawPayload?: SmartPayShareParamValue;
  payload?: SmartPayShareParamValue;
  selectedAsset?: SmartPayShareParamValue;
  asset?: SmartPayShareParamValue;
};

export type SmartPaySharedDraft = {
  rawPayload: string;
  payloadSource: "share";
  selectedAsset: string | null;
  dedupeKey: string;
};

export type SmartPaySharedDraftApplicationState = {
  rawPayload: string;
  payloadSource: "camera" | "photo" | "paste" | "share";
  selectedAsset: string;
};

function pickFirstNonEmptyParam(value: SmartPayShareParamValue): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = pickFirstNonEmptyParam(item);
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

const SMART_PAY_SHARED_ASSET_CANONICALS = new Map<string, string>([
  ["acp", "ACP"],
  ["wacp", "wACP"],
  ["usdt", "USDT"],
]);

function normalizeSelectedAssetParam(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return SMART_PAY_SHARED_ASSET_CANONICALS.get(trimmed.toLowerCase()) ?? trimmed;
}

export function getSmartPaySharedDraft(params: SmartPayShareParams): SmartPaySharedDraft | null {
  const rawPayload = pickFirstNonEmptyParam(params.rawPayload) ?? pickFirstNonEmptyParam(params.payload);
  if (!rawPayload) {
    return null;
  }

  const selectedAsset = normalizeSelectedAssetParam(
    pickFirstNonEmptyParam(params.selectedAsset) ?? pickFirstNonEmptyParam(params.asset)
  );

  return {
    rawPayload,
    payloadSource: "share",
    selectedAsset,
    dedupeKey: JSON.stringify({
      rawPayload,
      selectedAsset,
    }),
  };
}

export function shouldApplySmartPaySharedDraft(
  draft: SmartPaySharedDraft | null,
  current: SmartPaySharedDraftApplicationState
): boolean {
  if (!draft) {
    return false;
  }

  if (current.payloadSource !== "share") {
    return true;
  }

  if (current.rawPayload.trim() !== draft.rawPayload) {
    return true;
  }

  if (
    draft.selectedAsset
    && normalizeSelectedAssetParam(current.selectedAsset) !== draft.selectedAsset
  ) {
    return true;
  }

  return false;
}
