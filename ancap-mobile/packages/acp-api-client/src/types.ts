export type MobileConfig = {
  minAppVersion: string;
  maintenance: boolean;
  maintenanceMessage: string | null;
  acpDecimals: number;
  wacpDecimals: number;
  acpRpcStatus: string;
  bridgeStatus: string;
  bridgeEnabled: boolean;
  bridgePaused: boolean;
  bridgeReverseEnabled: boolean;
  wacpContract: string;
  bscChainId: number;
  acpRpcUrl: string;
  bscRpcUrl: string;
  acpExplorerTxBase: string;
  bscExplorerBase: string;
  supportUrl: string;
  docs: {
    bridge: string;
    risks: string;
    reserve: string;
    contracts: string;
    walletSecurity: string;
  };
};

export type AcpNetworkStatus = {
  chain: "acp";
  rpcStatus: string;
  blockHeight: number | null;
  minFeeAcp: string;
};

export type MobileBalance = {
  address: string;
  units: string;
  acp: string;
  utxo_count: number;
};

export type AcpTransaction = {
  txid: string;
  block_height: number;
  block_time: string;
  confirmations: number;
  direction: "in" | "out" | "self";
  sent_units: string;
  sent_acp: string;
  received_units: string;
  received_acp: string;
  net_units: string;
  net_acp: string;
};

export type AcpTransactionIo = {
  address: string | null;
  units: string;
  acp: string;
  vout: number | null;
};

export type AcpTransactionDetails = {
  txid: string;
  block_height: number;
  block_hash: string | null;
  block_time: string;
  confirmations: number;
  total_input_units: string;
  total_input_acp: string;
  total_output_units: string;
  total_output_acp: string;
  fee_units: string;
  fee_acp: string;
  inputs: AcpTransactionIo[];
  outputs: AcpTransactionIo[];
};

export type BroadcastResult = {
  accepted: boolean;
  txid: string | null;
  reason: string | null;
};

export type MobileDevicePlatform = "ios" | "android";

export type MobileDeviceRegisterInput = {
  deviceToken: string;
  platform: MobileDevicePlatform;
  appVersion?: string | null;
};

export type MobileDeviceRegisterResponse = {
  device_id: string;
  registered: boolean;
  message: string;
};

export type MobileDeviceUnregisterResponse = {
  ok: boolean;
  message: string;
};

export type MobileDeviceInfo = {
  device_id: string;
  platform: string;
  app_version: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
};

export type MobileDeviceListResponse = {
  devices: MobileDeviceInfo[];
};

export type SmartPaySupportedAsset = {
  network: string;
  symbol: string;
  tokenAddress?: string | null;
};

export type SmartPayCapabilities = {
  enabled: boolean;
  smartQrParseEnabled: boolean;
  smartQrAiFallbackEnabled: boolean;
  autoSwapEnabled: boolean;
  supportedNetworks: string[];
  supportedAssets: SmartPaySupportedAsset[];
  maxImageBytes: number;
  maxSlippageBps: number;
  minAcpFeeReserve: string;
};

export type SmartQrParseInput = {
  source: "camera" | "photo" | "paste" | "share";
  rawPayload: string;
  hint?: {
    locale?: string | null;
    platform?: "ios" | "android" | null;
  } | null;
};

export type SmartPayPaymentAsset = {
  kind: "native" | "erc20" | "unknown";
  symbol?: string | null;
  name?: string | null;
  tokenAddress?: string | null;
  decimals?: number | null;
  isSupported: boolean;
  isAllowlisted: boolean;
};

export type SmartPayPaymentRecipient = {
  address: string;
  resolvedDisplay?: string | null;
  addressType: "acp" | "evm" | "unknown";
  checksumValid?: boolean | null;
  ensOrAlias?: string | null;
};

export type SmartPayPaymentAmount = {
  value: string;
  atomicValue?: string | null;
  currencySymbol?: string | null;
  isExact: boolean;
  isMax: boolean;
};

export type SmartPayPaymentMemo = {
  value: string;
  type: "memo" | "tag" | "reference" | "note";
  required: boolean;
};

export type SmartPayMerchantHint = {
  label?: string | null;
  category?: string | null;
  website?: string | null;
  invoiceId?: string | null;
};

export type SmartPayPaymentMetadata = {
  detectedStandard?: string | null;
  invoiceType?: string | null;
  aiModel?: string | null;
  aiUsed: boolean;
  parserVersion: string;
};

export type SmartPayPaymentIntent = {
  id: string;
  createdAt: string;
  source: "camera" | "photo" | "paste" | "share";
  rawPayload: string;
  payloadHash: string;
  parseMethod: "deterministic" | "heuristic" | "ai";
  confidence: number;
  status: "parsed" | "unsupported" | "needs_review" | "rejected";
  network: "acp" | "bsc" | "base" | "ethereum" | "unknown";
  asset: SmartPayPaymentAsset;
  recipient: SmartPayPaymentRecipient;
  amount?: SmartPayPaymentAmount | null;
  memo?: SmartPayPaymentMemo | null;
  merchant?: SmartPayMerchantHint | null;
  riskFlags: string[];
  warnings: string[];
  unsupportedReasons: string[];
  requiresUserConfirmation: boolean;
  metadata: SmartPayPaymentMetadata;
};

export type SmartQrParseResponse = {
  paymentIntent: SmartPayPaymentIntent;
};

export type SmartPaySourcePreference = {
  preferredAsset: string;
  allowedAssets: string[];
  maxSlippageBps?: number;
  minAcpFeeReserve?: string;
};

export type SmartPayQuoteInput = {
  paymentIntentId: string;
  sourcePreference: SmartPaySourcePreference;
};

export type SmartPayQuoteAsset = {
  network: string;
  symbol: string;
  tokenAddress?: string | null;
  decimals?: number | null;
};

export type SmartPayNetworkFeeItem = {
  network: string;
  assetSymbol: string;
  amount: string;
};

export type SmartPayRouteStep = {
  kind: "bridge" | "swap" | "transfer";
  network: string;
  dexOrRail?: string | null;
  fromAsset: string;
  toAsset: string;
  estimatedOut: string;
};

export type SmartPayQuote = {
  quoteId: string;
  paymentIntentId: string;
  mode: "direct_send" | "swap_then_send";
  expiresAt: string;
  sourceAsset: SmartPayQuoteAsset;
  targetAsset: SmartPayQuoteAsset;
  targetAmount: string;
  requiredSourceAmount: string;
  serviceFeeAcp: string;
  networkFee: SmartPayNetworkFeeItem[];
  slippageBps: number;
  route: SmartPayRouteStep[];
  warnings: string[];
  riskFlags: string[];
};

export type SmartPayQuoteResponse = {
  quote: SmartPayQuote;
};

export type SmartPayExecuteInput = {
  paymentIntentId: string;
  quoteId: string;
  confirmationAccepted: boolean;
  deviceContext?: {
    platform: "ios" | "android";
    appVersion?: string | null;
  } | null;
};

export type SmartPayTxRef = {
  role: string;
  network: string;
  txid: string;
  explorerUrl?: string | null;
  routeStepIndex?: number | null;
};

export type SmartPayExecutionProgress = {
  totalRouteSteps: number;
  observedTxCount: number;
  remainingRouteSteps: number;
  pendingRoles: string[];
};

export type SmartPayExecution = {
  id: string;
  paymentIntentId: string;
  quoteId: string;
  status: "awaiting_local_signature" | "pending_reconciliation" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  recoverable: boolean;
  nextAction?: string | null;
  progress?: SmartPayExecutionProgress | null;
  txRefs: SmartPayTxRef[];
  error?: string | null;
};

export type SmartPayExecutionResponse = {
  execution: SmartPayExecution;
  sessionToken?: string | null;
};

export type SmartPayReceipt = {
  id: string;
  paymentExecutionId: string;
  paymentIntentId: string;
  completedAt: string;
  sourceAssetSpent: string;
  sourceAmountSpent: string;
  targetAssetPaid: string;
  targetAmountPaid: string;
  serviceFeeAcp: string;
  networkFees: SmartPayNetworkFeeItem[];
  recipientAddress: string;
  merchantLabel?: string | null;
  routeSummary: string[];
  txRefs: SmartPayTxRef[];
};

export type SmartPayHistoryEntry = {
  execution: SmartPayExecution;
  receipt: SmartPayReceipt;
  paymentIntent: SmartPayPaymentIntent;
  quote: SmartPayQuote;
};

export type SmartPayHistoryResponse = {
  payments: SmartPayHistoryEntry[];
};

export type SmartPayClientKnownRef = {
  txid: string;
  network?: string | null;
  role?: string | null;
  explorerUrl?: string | null;
  routeStepIndex?: number | null;
};

export type SmartPayRecoverInput = {
  clientKnownTxs: string[];
  clientKnownRefs?: SmartPayClientKnownRef[];
};
