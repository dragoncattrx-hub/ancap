import { describe, expect, it } from "vitest";

import {
  getSmartPaySharedDraft,
  shouldApplySmartPaySharedDraft,
} from "./smart-pay-share";

describe("smart pay shared payload draft parsing", () => {
  it("returns null when no share payload is present", () => {
    expect(getSmartPaySharedDraft({})).toBeNull();
    expect(getSmartPaySharedDraft({ rawPayload: "   ", payload: ["", "   "] })).toBeNull();
  });

  it("prefers an explicit rawPayload param and trims/canonicalizes the selected asset", () => {
    expect(
      getSmartPaySharedDraft({
        rawPayload: "  https://ancap.cloud/pay/demo  ",
        payload: "acp:ignored",
        selectedAsset: "  USDT  ",
      })
    ).toEqual({
      rawPayload: "https://ancap.cloud/pay/demo",
      payloadSource: "share",
      selectedAsset: "USDT",
      dedupeKey: JSON.stringify({
        rawPayload: "https://ancap.cloud/pay/demo",
        selectedAsset: "USDT",
      }),
    });

    expect(
      getSmartPaySharedDraft({
        payload: "acp:merchant?amount=5",
        selectedAsset: "  wacp  ",
      })
    ).toEqual({
      rawPayload: "acp:merchant?amount=5",
      payloadSource: "share",
      selectedAsset: "wACP",
      dedupeKey: JSON.stringify({
        rawPayload: "acp:merchant?amount=5",
        selectedAsset: "wACP",
      }),
    });
  });

  it("falls back to payload and first non-empty array values", () => {
    expect(
      getSmartPaySharedDraft({
        payload: ["", "  acp:merchant?amount=5  ", "acp:ignored"],
        asset: ["", " ACP "],
      })
    ).toEqual({
      rawPayload: "acp:merchant?amount=5",
      payloadSource: "share",
      selectedAsset: "ACP",
      dedupeKey: JSON.stringify({
        rawPayload: "acp:merchant?amount=5",
        selectedAsset: "ACP",
      }),
    });
  });

  it("keeps the draft asset nullable when no non-empty asset hint is provided", () => {
    expect(
      getSmartPaySharedDraft({
        payload: "acp:merchant?amount=7",
        selectedAsset: "   ",
        asset: undefined,
      })
    ).toEqual({
      rawPayload: "acp:merchant?amount=7",
      payloadSource: "share",
      selectedAsset: null,
      dedupeKey: JSON.stringify({
        rawPayload: "acp:merchant?amount=7",
        selectedAsset: null,
      }),
    });
  });

  it("reapplies a shared draft after local state drifted away from the shared payload", () => {
    const draft = getSmartPaySharedDraft({
      payload: "acp:merchant?amount=7",
      asset: "USDT",
    });

    expect(
      shouldApplySmartPaySharedDraft(draft, {
        rawPayload: "acp:merchant?amount=7",
        payloadSource: "share",
        selectedAsset: "USDT",
      })
    ).toBe(false);

    expect(
      shouldApplySmartPaySharedDraft(draft, {
        rawPayload: "acp:merchant?amount=7",
        payloadSource: "paste",
        selectedAsset: "USDT",
      })
    ).toBe(true);

    expect(
      shouldApplySmartPaySharedDraft(draft, {
        rawPayload: "acp:merchant?amount=9",
        payloadSource: "share",
        selectedAsset: "USDT",
      })
    ).toBe(true);

    expect(
      shouldApplySmartPaySharedDraft(draft, {
        rawPayload: "acp:merchant?amount=7",
        payloadSource: "share",
        selectedAsset: "ACP",
      })
    ).toBe(true);
  });

  it("treats asset casing differences as the same shared draft so share reentry does not reset state unnecessarily", () => {
    const draft = getSmartPaySharedDraft({
      payload: "acp:merchant?amount=11",
      asset: "usdt",
    });

    expect(draft?.selectedAsset).toBe("USDT");
    expect(
      shouldApplySmartPaySharedDraft(draft, {
        rawPayload: "acp:merchant?amount=11",
        payloadSource: "share",
        selectedAsset: "usdt",
      })
    ).toBe(false);
  });

  it("keeps canonical mixed-case symbols stable for share dedupe and reapply checks", () => {
    const draft = getSmartPaySharedDraft({
      payload: "acp:merchant?amount=13",
      asset: "WACP",
    });

    expect(draft?.selectedAsset).toBe("wACP");
    expect(
      shouldApplySmartPaySharedDraft(draft, {
        rawPayload: "acp:merchant?amount=13",
        payloadSource: "share",
        selectedAsset: "wACP",
      })
    ).toBe(false);

    expect(
      shouldApplySmartPaySharedDraft(draft, {
        rawPayload: "acp:merchant?amount=13",
        payloadSource: "share",
        selectedAsset: "WACP",
      })
    ).toBe(false);
  });
});
