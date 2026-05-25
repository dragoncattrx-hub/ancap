# ANCAP Mobile — Smart QR Payment Intent Schema

> Status: proposed schema | Updated: 2026-05-25
> Scope: canonical models for scan -> parse -> quote -> execute -> receipt
> Related: `SMART_QR_AUTO_SWAP_PLAN.md`, `SMART_QR_API_SPEC.md`, `SMART_QR_SECURITY.md`

---

## 1. Purpose

This document defines the canonical data model for Smart QR Pay.

Rule: every scan result must become either:
- a validated `PaymentIntent`, or
- an explicit typed error / unsupported result.

AI output is never trusted directly. It must always be normalized into this schema and then validated.

---

## 2. Core principles

1. **Canonical schema before execution**
2. **Deterministic parser first, AI fallback second**
3. **User confirmation required before send/swap/pay**
4. **Non-custodial signing where supported**
5. **Execution state must be resumable**

---

## 3. Main object: PaymentIntent

```ts
export type ParseMethod = "deterministic" | "heuristic" | "ai";
export type InputSource = "camera" | "photo" | "paste" | "share";
export type NetworkId = "acp" | "bsc" | "base" | "ethereum" | "unknown";
export type AssetKind = "native" | "erc20" | "unknown";
export type IntentStatus =
  | "parsed"
  | "unsupported"
  | "needs_review"
  | "rejected";

export interface PaymentIntent {
  id: string;
  createdAt: string;
  source: InputSource;
  rawPayload: string;
  payloadHash: string;
  parseMethod: ParseMethod;
  confidence: number;
  status: IntentStatus;

  network: NetworkId;
  asset: PaymentAsset;
  recipient: PaymentRecipient;
  amount: PaymentAmount | null;
  memo: PaymentMemo | null;
  merchant: MerchantHint | null;

  riskFlags: RiskFlag[];
  warnings: string[];
  unsupportedReasons: string[];
  requiresUserConfirmation: true;

  metadata: {
    detectedStandard: string | null;
    invoiceType: string | null;
    aiModel: string | null;
    aiUsed: boolean;
    parserVersion: string;
  };
}
```

---

## 4. Supporting objects

### 4.1 Asset

```ts
export interface PaymentAsset {
  kind: AssetKind;
  symbol: string | null;
  name: string | null;
  tokenAddress: string | null;
  decimals: number | null;
  isSupported: boolean;
  isAllowlisted: boolean;
}
```

Validation:
- `symbol` may be null only during intermediate parsing
- `tokenAddress` required for ERC-20 assets
- unsupported asset => `status = "unsupported"` or `needs_review`

### 4.2 Recipient

```ts
export interface PaymentRecipient {
  address: string;
  resolvedDisplay: string | null;
  addressType: "acp" | "evm" | "unknown";
  checksumValid: boolean | null;
  ensOrAlias: string | null;
}
```

Validation:
- ACP addresses must pass ACP validator
- EVM addresses must be normalized + checksum-validated when applicable

### 4.3 Amount

```ts
export interface PaymentAmount {
  value: string;
  atomicValue: string | null;
  currencySymbol: string | null;
  isExact: boolean;
  isMax: boolean;
}
```

Rules:
- `value` stored as decimal string
- `atomicValue` filled after asset decimals are known
- `amount = null` means payee provided no amount

### 4.4 Memo / reference

```ts
export interface PaymentMemo {
  value: string;
  type: "memo" | "tag" | "reference" | "note";
  required: boolean;
}
```

### 4.5 Merchant hint

```ts
export interface MerchantHint {
  label: string | null;
  category: string | null;
  website: string | null;
  invoiceId: string | null;
}
```

### 4.6 Risk flags

```ts
export type RiskFlag =
  | "unknown_network"
  | "unknown_asset"
  | "unsupported_asset"
  | "nonstandard_payload"
  | "ai_classified"
  | "missing_amount"
  | "missing_memo"
  | "contract_not_allowlisted"
  | "address_validation_failed"
  | "high_slippage_route"
  | "fee_reserve_low";
```

---

## 5. Scan result envelope

Before normalization into `PaymentIntent`, the client/server may use a raw scan envelope:

```ts
export interface ScanEnvelope {
  source: InputSource;
  imageId?: string | null;
  rawDecodedText: string | null;
  qrFound: boolean;
  decoder: "ios_vision" | "android_mlkit" | "server_fallback";
  extractedAt: string;
}
```

---

## 6. Quote model

```ts
export type PaymentMode =
  | "direct_send"
  | "swap_then_send"
  | "bridge_then_swap_then_send";

export interface PaymentQuote {
  quoteId: string;
  paymentIntentId: string;
  mode: PaymentMode;
  expiresAt: string;

  sourceAsset: RouteAsset;
  targetAsset: RouteAsset;
  targetAmount: string;
  requiredSourceAmount: string;

  serviceFeeAcp: string;
  networkFee: NetworkFee[];
  slippageBps: number;
  route: RouteStep[];

  warnings: string[];
  riskFlags: RiskFlag[];
}
```

Supporting objects:

```ts
export interface RouteAsset {
  network: NetworkId;
  symbol: string;
  tokenAddress: string | null;
  decimals: number;
}

export interface NetworkFee {
  network: NetworkId;
  assetSymbol: string;
  amount: string;
}

export interface RouteStep {
  kind: "swap" | "bridge" | "transfer";
  network: NetworkId;
  dexOrRail: string | null;
  fromAsset: string | null;
  toAsset: string | null;
  estimatedOut: string | null;
}
```

Rules:
- all quotes expire
- every quote shows ACP fee separately
- route must be explicit for user confirmation

---

## 7. Execution request model

```ts
export interface PaymentExecutionRequest {
  paymentIntentId: string;
  quoteId: string;
  sourceAssetPreference: SourceAssetPreference;
  confirmationAccepted: true;
  deviceContext: {
    appVersion: string;
    platform: "ios" | "android";
  };
}

export interface SourceAssetPreference {
  preferredAsset: string;
  allowedAssets: string[];
  maxSlippageBps: number;
  minAcpFeeReserve: string;
}
```

---

## 8. Execution session state

```ts
export type ExecutionStatus =
  | "created"
  | "awaiting_confirmation"
  | "awaiting_local_signature"
  | "swap_submitted"
  | "swap_confirmed"
  | "payout_submitted"
  | "completed"
  | "failed_parse"
  | "failed_quote"
  | "failed_swap"
  | "failed_payout"
  | "needs_recovery"
  | "cancelled";

export interface PaymentExecutionSession {
  id: string;
  paymentIntentId: string;
  quoteId: string;
  status: ExecutionStatus;
  createdAt: string;
  updatedAt: string;
  recoverable: boolean;
  nextAction: string | null;
  txRefs: TxReference[];
  error: PaymentExecutionError | null;
}
```

Supporting objects:

```ts
export interface TxReference {
  role: "swap" | "bridge" | "merchant_payout" | "fee";
  network: NetworkId;
  txid: string;
  explorerUrl: string | null;
}

export interface PaymentExecutionError {
  code: string;
  message: string;
  retryable: boolean;
}
```

---

## 9. Receipt model

```ts
export interface SmartPayReceipt {
  id: string;
  paymentExecutionId: string;
  paymentIntentId: string;
  completedAt: string;

  sourceAssetSpent: string;
  sourceAmountSpent: string;
  targetAssetPaid: string;
  targetAmountPaid: string;

  serviceFeeAcp: string;
  networkFees: NetworkFee[];
  recipientAddress: string;
  merchantLabel: string | null;
  routeSummary: string[];
  txRefs: TxReference[];
}
```

---

## 10. Settings schema

```ts
export interface SmartPaySettings {
  preferredSpendAsset: string;
  allowedSourceAssets: string[];
  autoSwapEnabled: boolean;
  requireConfirmationAlways: boolean;
  maxSlippageBps: number;
  minAcpFeeReserve: string;
  saveScanHistory: boolean;
  allowAiFallback: boolean;
}
```

Defaults:
- `autoSwapEnabled = false`
- `requireConfirmationAlways = true`
- `allowAiFallback = true` only if user consented to server classification where needed

---

## 11. Validation rules

### 11.1 Hard validation failures
A `PaymentIntent` must be rejected if:
- recipient address invalid
- network unknown and cannot be resolved
- asset unsupported for current release
- amount malformed
- required memo/tag missing
- AI confidence below threshold and no deterministic confirmation exists

### 11.2 Needs-review state
Use `needs_review` if:
- payload is parseable but unusual
- contract is not yet allowlisted
- merchant metadata is incomplete
- amount missing and app can still allow manual input

### 11.3 AI confidence thresholds
Recommended:
- `>= 0.95` high confidence
- `0.80–0.94` medium, show stronger warnings
- `< 0.80` do not auto-prepare payment route

---

## 12. Release-scope guidance

For first release of Smart QR Pay:
- support `acp` and `bsc` only
- support `native` and a small allowlist of ERC-20 assets only
- require confirmation for every payment
- disallow invisible or background execution

---

## 13. Bottom line

This schema is the contract that keeps Smart QR Pay safe.

The wallet should not execute on “best guess”. It should execute only after a scanned payload becomes a validated `PaymentIntent`, then a bounded `PaymentQuote`, then a tracked `PaymentExecutionSession`.
