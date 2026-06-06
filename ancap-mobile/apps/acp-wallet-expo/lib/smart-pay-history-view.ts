import type {
  SmartPayExecution,
  SmartPayPaymentIntent,
  SmartPayQuote,
  SmartPayReceipt,
} from "@ancap/acp-api-client";
import type { SmartPayHistoryEntry, SmartPayHistorySnapshotOrigin } from "./smart-pay-history";

export type SmartPayHistoryBucket = "in_flight" | "needs_attention" | "completed";

export type SmartPayActiveHistoryEntryInput = {
  snapshotSavedAt?: string | null;
  intent: SmartPayPaymentIntent | null;
  quote: SmartPayQuote | null;
  execution: SmartPayExecution | null;
  receipt: SmartPayReceipt | null;
  sessionToken?: string | null;
  snapshotOrigin?: SmartPayHistorySnapshotOrigin;
};

export type SmartPayHistorySection = {
  key: SmartPayHistoryBucket;
  title: string;
  entries: SmartPayHistoryEntry[];
};

function pickLatestSmartPayTimestamp(...values: Array<string | null | undefined>): string {
  const best = values.reduce<{ value: string | null; timestamp: number | null }>(
    (current, value) => {
      const parsed = parseSmartPayTimestamp(value);
      if (parsed === null || !value) {
        return current;
      }
      if (current.timestamp === null || parsed > current.timestamp) {
        return { value, timestamp: parsed };
      }
      return current;
    },
    { value: null, timestamp: null }
  );

  return best.value ?? new Date(0).toISOString();
}

function bucketForStatus(status: SmartPayExecution["status"]): SmartPayHistoryBucket {
  switch (status) {
    case "awaiting_local_signature":
    case "pending_reconciliation":
      return "in_flight";
    case "failed":
      return "needs_attention";
    case "completed":
    default:
      return "completed";
  }
}

const SECTION_ORDER: Array<{ key: SmartPayHistoryBucket; title: string }> = [
  { key: "in_flight", title: "In flight" },
  { key: "needs_attention", title: "Needs attention" },
  { key: "completed", title: "Completed" },
];

export function buildSmartPayHistorySections(entries: SmartPayHistoryEntry[]): SmartPayHistorySection[] {
  const grouped = new Map<SmartPayHistoryBucket, SmartPayHistoryEntry[]>();

  for (const entry of entries) {
    const bucket = bucketForStatus(entry.execution.status);
    const list = grouped.get(bucket) ?? [];
    list.push(entry);
    grouped.set(bucket, list);
  }

  return SECTION_ORDER.map((section) => ({
    key: section.key,
    title: section.title,
    entries: grouped.get(section.key) ?? [],
  })).filter((section) => section.entries.length > 0);
}

export function formatSmartPayTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export function getSmartPayExecutionStatusLabel(status: SmartPayExecution["status"]): string {
  switch (status) {
    case "awaiting_local_signature":
      return "Awaiting local signature";
    case "pending_reconciliation":
      return "Pending reconciliation";
    case "failed":
      return "Needs attention";
    case "completed":
    default:
      return "Completed";
  }
}

function parseSmartPayTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatSmartPayRelativeAge(diffMs: number): string {
  const totalSeconds = Math.max(Math.floor(diffMs / 1000), 0);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (totalMinutes < 60) {
    return seconds === 0 ? `${totalMinutes}m` : `${totalMinutes}m ${seconds}s`;
  }

  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (totalHours < 48) {
    return minutes === 0 ? `${totalHours}h` : `${totalHours}h ${minutes}m`;
  }

  const totalDays = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours === 0 ? `${totalDays}d` : `${totalDays}d ${hours}h`;
}

export function buildSmartPayActiveHistoryEntry(
  input: SmartPayActiveHistoryEntryInput
): SmartPayHistoryEntry | null {
  if (!input.execution || !input.intent) {
    return null;
  }

  return {
    id: input.execution.id,
    savedAt: pickLatestSmartPayTimestamp(
      input.snapshotSavedAt,
      input.execution.updatedAt,
      input.receipt?.completedAt,
      input.execution.createdAt,
      input.intent.createdAt
    ),
    intent: input.intent,
    quote: input.quote,
    execution: input.execution,
    receipt: input.receipt,
    sessionToken: input.sessionToken ?? null,
    snapshotOrigin: input.snapshotOrigin ?? (input.sessionToken ? "local" : "local"),
  };
}

export function getSmartPayActiveExecutionView(
  activeHistoryEntry: SmartPayHistoryEntry | null | undefined,
  execution: SmartPayExecution | null | undefined
): SmartPayExecution | null {
  return activeHistoryEntry?.execution ?? execution ?? null;
}

export function getSmartPayActiveExecutionTxRefs(
  activeHistoryEntry: SmartPayHistoryEntry | null | undefined,
  execution: SmartPayExecution | null | undefined
): SmartPayExecution["txRefs"] {
  if (activeHistoryEntry) {
    return getSmartPayHistoryProofTxRefs(activeHistoryEntry);
  }
  return execution?.txRefs ?? [];
}

function getSmartPayHistoryFreshnessTimestamp(entry: SmartPayHistoryEntry): number | null {
  const snapshotTimestamp = [entry.execution.updatedAt, entry.savedAt].reduce<number | null>((best, value) => {
    const parsed = parseSmartPayTimestamp(value);
    if (parsed === null) {
      return best;
    }
    if (best === null || parsed > best) {
      return parsed;
    }
    return best;
  }, null);

  const receiptTimestamp = parseSmartPayTimestamp(entry.receipt?.completedAt);

  if (receiptTimestamp !== null && (snapshotTimestamp === null || receiptTimestamp > snapshotTimestamp)) {
    return receiptTimestamp;
  }

  if (snapshotTimestamp !== null) {
    return snapshotTimestamp;
  }

  return [entry.receipt?.completedAt, entry.execution.createdAt, entry.intent.createdAt].reduce<number | null>((best, value) => {
    const parsed = parseSmartPayTimestamp(value);
    if (parsed === null) {
      return best;
    }
    if (best === null || parsed > best) {
      return parsed;
    }
    return best;
  }, null);
}

export function getSmartPayHistoryAmountLabel(entry: SmartPayHistoryEntry): string {
  const amount =
    entry.receipt?.targetAmountPaid ?? entry.quote?.targetAmount ?? entry.intent.amount?.value ?? "—";
  const symbol =
    entry.receipt?.targetAssetPaid ?? entry.quote?.targetAsset.symbol ?? entry.intent.asset.symbol ?? "asset";
  return `${amount} ${symbol}`;
}

export function getSmartPayHistorySnapshotTitle(entry: SmartPayHistoryEntry): string {
  return entry.receipt ? "Receipt snapshot" : "Execution snapshot";
}

export function getSmartPayHistorySnapshotStatusLabel(entry: SmartPayHistoryEntry): string {
  return entry.receipt ? "Receipt status" : "Execution status";
}

export type SmartPayHistoryNetworkFeesSource = "receipt" | "quote" | "quote_fallback" | "none";

export type SmartPayHistoryReceiptDisplay = {
  recipientAddress: string;
  sourceAsset: string;
  sourceAmount: string;
  targetAsset: string;
  targetAmount: string;
  serviceFeeAcp: string;
  completedAt: string | null;
  merchantLabel: string | null;
  merchantLabelSource: "receipt" | "intent" | "none";
  merchantCategory: string | null;
  merchantWebsite: string | null;
  merchantInvoiceId: string | null;
  merchantDetailsSource: "intent" | "none";
  routeSummary: string[];
  networkFees: SmartPayReceipt["networkFees"];
  networkFeesSource: SmartPayHistoryNetworkFeesSource;
};

function formatSmartPayRouteStepRail(step: { dexOrRail?: string | null }): string {
  const value = step.dexOrRail?.trim();
  return value ? ` via ${value}` : "";
}

function formatSmartPayRouteStepLabel(
  step: NonNullable<SmartPayHistoryEntry["quote"]>["route"][number],
  stepIndex: number
): string {
  return `Step ${stepIndex}: ${step.kind} ${step.fromAsset} → ${step.toAsset} via ${step.network}${formatSmartPayRouteStepRail(step)}`;
}

export function formatSmartPayRouteStepIndexLabel(routeStepIndex: number | null | undefined): string | null {
  if (!Number.isInteger(routeStepIndex) || routeStepIndex === undefined || routeStepIndex === null) {
    return null;
  }
  if (routeStepIndex < 1) {
    return null;
  }
  return `route step ${routeStepIndex}`;
}

export function formatSmartPayTxRefLabel(ref: SmartPayExecution["txRefs"][number]): string {
  const routeStepLabel = formatSmartPayRouteStepIndexLabel(ref.routeStepIndex);
  return routeStepLabel
    ? `${ref.role} tx on ${ref.network}: ${ref.txid} (${routeStepLabel})`
    : `${ref.role} tx on ${ref.network}: ${ref.txid}`;
}

export function getSmartPayHistoryReceiptDisplay(entry: SmartPayHistoryEntry): SmartPayHistoryReceiptDisplay {
  const receiptNetworkFees = entry.receipt?.networkFees ?? [];
  const quoteNetworkFees = entry.quote?.networkFee ?? [];
  const hasReceiptSnapshot = Boolean(entry.receipt);
  const networkFees = receiptNetworkFees.length ? receiptNetworkFees : quoteNetworkFees;
  const networkFeesSource: SmartPayHistoryNetworkFeesSource = receiptNetworkFees.length
    ? "receipt"
    : quoteNetworkFees.length
      ? hasReceiptSnapshot
        ? "quote_fallback"
        : "quote"
      : "none";
  const receiptMerchantLabel = entry.receipt?.merchantLabel?.trim() ?? "";
  const intentMerchantLabel = entry.intent.merchant?.label?.trim() ?? "";
  const merchantLabel = receiptMerchantLabel || intentMerchantLabel || null;
  const merchantLabelSource = receiptMerchantLabel
    ? "receipt"
    : intentMerchantLabel
      ? "intent"
      : "none";
  const merchantCategory = entry.intent.merchant?.category?.trim() ?? null;
  const merchantWebsite = entry.intent.merchant?.website?.trim() ?? null;
  const merchantInvoiceId = entry.intent.merchant?.invoiceId?.trim() ?? null;
  const merchantDetailsSource = merchantCategory || merchantWebsite || merchantInvoiceId ? "intent" : "none";

  return {
    recipientAddress: entry.receipt?.recipientAddress ?? entry.intent.recipient.address,
    sourceAsset: entry.receipt?.sourceAssetSpent ?? entry.quote?.sourceAsset.symbol ?? entry.intent.asset.symbol ?? "asset",
    sourceAmount: entry.receipt?.sourceAmountSpent ?? entry.quote?.requiredSourceAmount ?? "—",
    targetAsset: entry.receipt?.targetAssetPaid ?? entry.quote?.targetAsset.symbol ?? entry.intent.asset.symbol ?? "asset",
    targetAmount: entry.receipt?.targetAmountPaid ?? entry.quote?.targetAmount ?? entry.intent.amount?.value ?? "—",
    serviceFeeAcp: entry.receipt?.serviceFeeAcp ?? entry.quote?.serviceFeeAcp ?? "—",
    completedAt: entry.receipt?.completedAt ?? null,
    merchantLabel,
    merchantLabelSource,
    merchantCategory,
    merchantWebsite,
    merchantInvoiceId,
    merchantDetailsSource,
    routeSummary: entry.receipt?.routeSummary?.length
      ? entry.receipt.routeSummary
      : (entry.quote?.route ?? []).map((step, index) => formatSmartPayRouteStepLabel(step, index + 1)),
    networkFees,
    networkFeesSource,
  };
}

export function getSmartPayHistoryMerchantHint(display: SmartPayHistoryReceiptDisplay): string | null {
  switch (display.merchantLabelSource) {
    case "receipt":
      return display.merchantDetailsSource === "intent"
        ? "Merchant label comes from the stored receipt snapshot. Website/category/invoice details still come from the parsed payment intent."
        : "Merchant label comes from the stored receipt snapshot.";
    case "intent":
      return "Merchant label comes from the parsed payment intent until a receipt snapshot confirms it.";
    case "none":
      return display.merchantDetailsSource === "intent"
        ? "Merchant details come from the parsed payment intent until a receipt snapshot confirms them."
        : null;
    default:
      return null;
  }
}

export function getSmartPayHistoryNetworkFeesLabel(display: SmartPayHistoryReceiptDisplay): string {
  switch (display.networkFeesSource) {
    case "receipt":
      return "Network fees";
    case "quote":
    case "quote_fallback":
      return "Estimated network fees";
    case "none":
    default:
      return "Network fees";
  }
}

export function getSmartPayHistoryNetworkFeesHint(display: SmartPayHistoryReceiptDisplay): string | null {
  switch (display.networkFeesSource) {
    case "receipt":
      return "Final network fee amounts come from the stored receipt snapshot.";
    case "quote":
      return "Quoted fee estimates are shown until execution stores final receipt-side network fee values.";
    case "quote_fallback":
      return "This receipt snapshot does not yet include final network fee values, so quoted estimates are shown for context only.";
    case "none":
    default:
      return null;
  }
}

function pluralize(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function getSmartPayHistoryFallbackRouteProgress(entry: SmartPayHistoryEntry): {
  trackedSteps: number;
  linkedSteps: number;
  pendingSteps: number;
  routeContextLabel: string;
} | null {
  const { hasQuotedRoute, hasRouteProofContext } = getSmartPayHistoryProofRouteContext(entry);
  if (!hasRouteProofContext) {
    return null;
  }

  const routeSteps = getSmartPayHistoryProofRouteSteps(entry);
  if (routeSteps.length === 0) {
    return null;
  }

  const linkedSteps = routeSteps.filter((step) => Boolean(step.txRef)).length;
  const pendingSteps = routeSteps.length - linkedSteps;

  return {
    trackedSteps: routeSteps.length,
    linkedSteps,
    pendingSteps,
    routeContextLabel: hasQuotedRoute ? "quoted route" : "stored receipt route",
  };
}

function formatSmartPayFallbackRouteProgressSummary(
  fallbackRouteProgress: NonNullable<ReturnType<typeof getSmartPayHistoryFallbackRouteProgress>>
): string {
  return `This saved snapshot tracks ${pluralize(fallbackRouteProgress.trackedSteps, `${fallbackRouteProgress.routeContextLabel} step`, `${fallbackRouteProgress.routeContextLabel} steps`)}, with ${pluralize(fallbackRouteProgress.linkedSteps, "linked proof ref", "linked proof refs")} and ${pluralize(fallbackRouteProgress.pendingSteps, "pending proof link", "pending proof links")}.`;
}

function shouldPreferFallbackRouteProgress(
  entry: SmartPayHistoryEntry,
  progress: NonNullable<SmartPayExecution["progress"]>,
  fallbackRouteProgress: NonNullable<ReturnType<typeof getSmartPayHistoryFallbackRouteProgress>> | null
): boolean {
  if (!fallbackRouteProgress) {
    return false;
  }

  if (entry.execution.status === "completed" || entry.execution.status === "failed") {
    return true;
  }

  return progress.totalRouteSteps !== fallbackRouteProgress.trackedSteps
    || progress.remainingRouteSteps !== fallbackRouteProgress.pendingSteps
    || progress.observedTxCount !== fallbackRouteProgress.linkedSteps;
}

export function getSmartPayHistoryProgressLabel(entry: SmartPayHistoryEntry): string | null {
  const progress = entry.execution.progress;
  const fallbackRouteProgress = getSmartPayHistoryFallbackRouteProgress(entry);
  const preferFallbackRouteProgress = progress
    ? shouldPreferFallbackRouteProgress(entry, progress, fallbackRouteProgress)
    : false;

  if (progress && !preferFallbackRouteProgress) {
    const remaining = pluralize(progress.remainingRouteSteps, "route step", "route steps");
    return `Route progress: ${progress.observedTxCount}/${progress.totalRouteSteps} tx observed · ${remaining} remaining`;
  }

  if (fallbackRouteProgress) {
    return `Route progress: ${fallbackRouteProgress.linkedSteps}/${fallbackRouteProgress.trackedSteps} route steps linked · ${pluralize(fallbackRouteProgress.pendingSteps, "pending proof link", "pending proof links")}`;
  }

  if (entry.execution.txRefs.length) {
    return `Execution references: ${pluralize(entry.execution.txRefs.length, "tx", "txs")} recorded`;
  }
  switch (entry.execution.status) {
    case "awaiting_local_signature":
      return "Route progress: waiting for local signature";
    case "pending_reconciliation":
      return "Route progress: reconciliation pending";
    case "failed":
      return "Route progress: execution needs attention";
    case "completed":
      return "Route progress: completed snapshot";
    default:
      return null;
  }
}

export function getSmartPayHistoryExecutionProgressDetailLines(entry: SmartPayHistoryEntry): string[] {
  const progress = entry.execution.progress;
  if (!progress) {
    return [];
  }

  const fallbackRouteProgress = getSmartPayHistoryFallbackRouteProgress(entry);
  if (shouldPreferFallbackRouteProgress(entry, progress, fallbackRouteProgress)) {
    return [];
  }

  const lines = [
    `Route progress detail: ${progress.observedTxCount}/${progress.totalRouteSteps} tx observed`,
    `Remaining route steps: ${progress.remainingRouteSteps}`,
  ];

  if (progress.pendingRoles.length) {
    lines.push(`Pending roles: ${progress.pendingRoles.join(" → ")}`);
  }

  return lines;
}

export function getSmartPayHistoryExecutionProgressDisplayLines(entry: SmartPayHistoryEntry): string[] {
  const detailLines = getSmartPayHistoryExecutionProgressDetailLines(entry);
  if (detailLines.length > 0) {
    return detailLines;
  }

  const progressLabel = getSmartPayHistoryProgressLabel(entry);
  return progressLabel ? [progressLabel] : [];
}

export function getSmartPayHistoryProgressHint(entry: SmartPayHistoryEntry): string | null {
  const progress = entry.execution.progress;
  const fallbackRouteProgress = getSmartPayHistoryFallbackRouteProgress(entry);
  const preferFallbackRouteProgress = progress
    ? shouldPreferFallbackRouteProgress(entry, progress, fallbackRouteProgress)
    : false;
  switch (entry.execution.status) {
    case "awaiting_local_signature": {
      const nextAction = entry.execution.nextAction?.replace(/_/g, " ") ?? "local signature";
      if (progress?.pendingRoles.length && !preferFallbackRouteProgress) {
        return `Waiting for ${nextAction}; pending route roles: ${progress.pendingRoles.join(" → ")}.`;
      }
      if (fallbackRouteProgress) {
        const routeRolePrefix = progress?.pendingRoles.length
          ? `Waiting for ${nextAction}; pending route roles: ${progress.pendingRoles.join(" → ")}.`
          : `Waiting for ${nextAction} before route progress can continue.`;
        return `${routeRolePrefix} ${formatSmartPayFallbackRouteProgressSummary(fallbackRouteProgress)}`;
      }
      return `Waiting for ${nextAction} before route progress can continue.`;
    }
    case "pending_reconciliation":
      if (progress?.pendingRoles.length && !preferFallbackRouteProgress) {
        return `Route submitted; pending roles: ${progress.pendingRoles.join(" → ")}.`;
      }
      if (fallbackRouteProgress) {
        const routeRolePrefix = progress?.pendingRoles.length
          ? `Route submitted; pending roles: ${progress.pendingRoles.join(" → ")}.`
          : "Route submitted;";
        return `${routeRolePrefix} ${formatSmartPayFallbackRouteProgressSummary(fallbackRouteProgress)}`;
      }
      return "Route submitted; waiting for reconciliation updates.";
    case "failed":
      if (entry.execution.error) {
        return fallbackRouteProgress
          ? `Execution needs attention: ${entry.execution.error}. ${formatSmartPayFallbackRouteProgressSummary(fallbackRouteProgress)}`
          : `Execution needs attention: ${entry.execution.error}.`;
      }
      return fallbackRouteProgress
        ? `Execution needs attention before route completion. ${formatSmartPayFallbackRouteProgressSummary(fallbackRouteProgress)}`
        : "Execution needs attention before route completion.";
    case "completed": {
      const completionPrefix = entry.receipt?.completedAt
        ? `Receipt snapshot completed at ${formatSmartPayTimestamp(entry.receipt.completedAt)}.`
        : "Execution completed; receipt snapshot is available.";
      if (fallbackRouteProgress) {
        return `${completionPrefix} ${formatSmartPayFallbackRouteProgressSummary(fallbackRouteProgress)}`;
      }
      return completionPrefix;
    }
    default:
      return null;
  }
}

function pickRicherTxRef(
  current: SmartPayExecution["txRefs"][number],
  incoming: SmartPayExecution["txRefs"][number]
): SmartPayExecution["txRefs"][number] {
  const currentExplorer = current.explorerUrl?.trim() ?? "";
  const incomingExplorer = incoming.explorerUrl?.trim() ?? "";
  const currentRouteStepIndex = current.routeStepIndex ?? null;
  const incomingRouteStepIndex = incoming.routeStepIndex ?? null;

  if (currentRouteStepIndex === null && incomingRouteStepIndex !== null) {
    return incoming;
  }
  if (!currentExplorer && incomingExplorer) {
    return incoming;
  }
  return current;
}

function getSmartPayTxRefIdentityKey(ref: SmartPayExecution["txRefs"][number]): string {
  return `${ref.role}|${ref.network}|${ref.txid.trim().toLowerCase()}`;
}

function isSmartPayProofTxRefCompatibleWithRouteStep(
  candidate: SmartPayExecution["txRefs"][number],
  role: string,
  network: string
): boolean {
  const candidateRole = candidate.role?.trim();
  const candidateNetwork = candidate.network?.trim();

  if (candidateRole && candidateRole !== role) {
    return false;
  }
  if (candidateNetwork && candidateNetwork !== network) {
    return false;
  }

  return true;
}

function getSmartPayHistoryRouteProofRole(
  step: NonNullable<SmartPayHistoryEntry["quote"]>["route"][number],
  index: number,
  totalSteps: number
): string {
  if (step.kind === "bridge") {
    return "bridge";
  }
  if (step.kind === "swap") {
    return "swap";
  }
  if (step.kind === "transfer" && totalSteps > 1 && index === totalSteps) {
    return "merchant_payout";
  }
  if (step.kind === "transfer") {
    return "payment";
  }
  return step.kind;
}

function normalizeSmartPayTxRefRole(role: string | null | undefined): string {
  return role?.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ") ?? "";
}

function isLikelyReceiptRouteProofRole(normalizedRole: string): boolean {
  return normalizedRole === "bridge"
    || normalizedRole === "swap"
    || normalizedRole === "payment"
    || normalizedRole === "merchant payout"
    || normalizedRole === "transfer";
}

function getNormalizedSmartPayReceiptRouteSummaryLine(summaryLine: string | undefined): string {
  return summaryLine?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function getSmartPayReceiptRouteProofRoleAliases(normalizedRole: string): string[] {
  switch (normalizedRole) {
    case "payment":
      return ["payment", "transfer", "merchant payout", "payout"];
    case "merchant payout":
      return ["merchant payout", "payout", "transfer", "payment"];
    case "transfer":
      return ["transfer", "payment", "merchant payout", "payout"];
    default:
      return [normalizedRole];
  }
}

function isSmartPayReceiptRouteProofTxRefCompatible(
  ref: SmartPayExecution["txRefs"][number],
  summaryLine: string | undefined,
  stepIndex: number
): boolean {
  if (ref.routeStepIndex != null && ref.routeStepIndex !== stepIndex) {
    return false;
  }

  const normalizedRole = normalizeSmartPayTxRefRole(ref.role);
  if (!normalizedRole) {
    return true;
  }

  const normalizedSummaryLine = getNormalizedSmartPayReceiptRouteSummaryLine(summaryLine);
  if (!normalizedSummaryLine) {
    return isLikelyReceiptRouteProofRole(normalizedRole);
  }

  return getSmartPayReceiptRouteProofRoleAliases(normalizedRole).some((alias) => normalizedSummaryLine.includes(alias));
}

function isLikelyReceiptRouteProofTxRef(ref: SmartPayExecution["txRefs"][number]): boolean {
  if (ref.routeStepIndex != null) {
    return true;
  }

  return isLikelyReceiptRouteProofRole(normalizeSmartPayTxRefRole(ref.role));
}

function formatSmartPayReceiptRouteStepLabel(summaryLine: string | undefined, stepIndex: number): string {
  const trimmed = summaryLine?.trim();
  if (!trimmed) {
    return `Receipt step ${stepIndex}`;
  }

  const normalized = trimmed.replace(new RegExp(`^${stepIndex}[.)]\\s*`), "").trim();
  return `Receipt step ${stepIndex}: ${normalized || trimmed}`;
}

function getSmartPayReceiptRouteStepCount(entry: SmartPayHistoryEntry): number {
  const receiptRouteSummaryCount = entry.receipt?.routeSummary.length ?? 0;
  if (receiptRouteSummaryCount === 0) {
    return 0;
  }

  return Math.max(
    entry.execution.progress?.totalRouteSteps ?? 0,
    receiptRouteSummaryCount
  );
}

export function getSmartPayHistoryProofTxRefs(entry: SmartPayHistoryEntry): SmartPayExecution["txRefs"] {
  const refs = [...(entry.receipt?.txRefs ?? []), ...entry.execution.txRefs];
  const merged = new Map<string, SmartPayExecution["txRefs"][number]>();

  for (const ref of refs) {
    const key = getSmartPayTxRefIdentityKey(ref);
    const existing = merged.get(key);
    merged.set(key, existing ? pickRicherTxRef(existing, ref) : ref);
  }

  return [...merged.values()];
}

export type SmartPayHistoryProofRouteStep = {
  key: string;
  stepIndex: number;
  role: string;
  network: string;
  kind: string;
  fromAsset: string;
  toAsset: string;
  label: string;
  status: "linked" | "pending";
  txRef: SmartPayExecution["txRefs"][number] | null;
};

export function getSmartPayHistoryProofRouteSteps(
  entry: SmartPayHistoryEntry
): SmartPayHistoryProofRouteStep[] {
  const refs = getSmartPayHistoryProofTxRefs(entry);
  const route = entry.quote?.route ?? [];

  if (route.length === 0) {
    const receiptRouteSummary = entry.receipt?.routeSummary ?? [];
    const receiptRouteSteps = getSmartPayReceiptRouteStepCount(entry);
    if (receiptRouteSteps > 0) {
      const unmatchedRefs = refs.filter((ref) => isLikelyReceiptRouteProofTxRef(ref));

      return Array.from({ length: receiptRouteSteps }, (_, index) => {
        const stepIndex = index + 1;
        const summaryLine = receiptRouteSummary[index];
        const directIndexMatch = unmatchedRefs.findIndex(
          (candidate) => isSmartPayReceiptRouteProofTxRefCompatible(candidate, summaryLine, stepIndex)
            && candidate.routeStepIndex === stepIndex
        );
        const sequentialMatch = unmatchedRefs.findIndex(
          (candidate) => candidate.routeStepIndex == null
            && isSmartPayReceiptRouteProofTxRefCompatible(candidate, summaryLine, stepIndex)
        );
        const matchIndex = directIndexMatch >= 0 ? directIndexMatch : sequentialMatch;
        const txRef = matchIndex >= 0 ? unmatchedRefs.splice(matchIndex, 1)[0] ?? null : null;

        return {
          key: `receipt_route|${stepIndex}`,
          stepIndex,
          role: txRef?.role ?? "receipt_route",
          network: txRef?.network ?? "unknown",
          kind: "receipt_route",
          fromAsset: "—",
          toAsset: "—",
          label: formatSmartPayReceiptRouteStepLabel(receiptRouteSummary[index], stepIndex),
          status: txRef ? "linked" : "pending",
          txRef,
        };
      });
    }

    return refs.map((txRef, index) => ({
      key: `${txRef.role}|${txRef.network}|${txRef.txid}|${index + 1}`,
      stepIndex: txRef.routeStepIndex ?? index + 1,
      role: txRef.role,
      network: txRef.network,
      kind: txRef.role,
      fromAsset: "—",
      toAsset: "—",
      label: `Observed tx ${index + 1}: ${txRef.role} on ${txRef.network}`,
      status: "linked",
      txRef,
    }));
  }

  const unmatchedRefs = [...refs];

  return route.map((step, index) => {
    const stepIndex = index + 1;
    const role = getSmartPayHistoryRouteProofRole(step, stepIndex, route.length);
    const directIndexMatch = unmatchedRefs.findIndex(
      (candidate) =>
        candidate.routeStepIndex === stepIndex
        && isSmartPayProofTxRefCompatibleWithRouteStep(candidate, role, step.network)
    );
    const roleNetworkMatch = unmatchedRefs.findIndex(
      (candidate) => candidate.routeStepIndex == null && candidate.role === role && candidate.network === step.network
    );
    const matchIndex = directIndexMatch >= 0 ? directIndexMatch : roleNetworkMatch;
    const txRef = matchIndex >= 0 ? unmatchedRefs.splice(matchIndex, 1)[0] ?? null : null;

    return {
      key: `${role}|${step.network}|${stepIndex}`,
      stepIndex,
      role,
      network: step.network,
      kind: step.kind,
      fromAsset: step.fromAsset,
      toAsset: step.toAsset,
      label: formatSmartPayRouteStepLabel(step, stepIndex),
      status: txRef ? "linked" : "pending",
      txRef,
    };
  });
}

export function getSmartPayHistoryAdditionalProofTxRefs(entry: SmartPayHistoryEntry): SmartPayExecution["txRefs"] {
  const refs = getSmartPayHistoryProofTxRefs(entry);
  const proofRouteSteps = getSmartPayHistoryProofRouteSteps(entry);

  if (proofRouteSteps.length === 0) {
    return [];
  }

  const matched = new Set(
    proofRouteSteps
      .filter((step) => Boolean(step.txRef))
      .map((step) => getSmartPayTxRefIdentityKey(step.txRef!))
  );

  return refs.filter((ref) => !matched.has(getSmartPayTxRefIdentityKey(ref)));
}

export function getSmartPayHistoryProofCounts(entry: SmartPayHistoryEntry): {
  linkedTxCount: number;
  explorerLinkedTxCount: number;
  expectedRouteSteps: number;
  additionalTxCount: number;
} {
  const refs = getSmartPayHistoryProofTxRefs(entry);
  const routeSteps = getSmartPayHistoryProofRouteSteps(entry);
  const additionalRefs = getSmartPayHistoryAdditionalProofTxRefs(entry);
  const hasQuotedRoute = (entry.quote?.route.length ?? 0) > 0;
  const hasReceiptRouteSummary = (entry.receipt?.routeSummary.length ?? 0) > 0;
  const expectedRouteSteps = hasQuotedRoute
    ? routeSteps.length
    : hasReceiptRouteSummary
      ? getSmartPayReceiptRouteStepCount(entry)
      : 0;
  const linkedRouteSteps = routeSteps.filter((step) => Boolean(step.txRef));
  const explorerLinkedRouteSteps = linkedRouteSteps.filter((step) => Boolean(step.txRef?.explorerUrl?.trim()));
  const linkedTxCount = expectedRouteSteps > 0
    ? linkedRouteSteps.length
    : refs.length;
  const explorerLinkedTxCount = expectedRouteSteps > 0
    ? explorerLinkedRouteSteps.length
    : refs.filter((ref) => Boolean(ref.explorerUrl?.trim())).length;

  return {
    linkedTxCount,
    explorerLinkedTxCount,
    expectedRouteSteps,
    additionalTxCount: additionalRefs.length,
  };
}

function getSmartPayHistoryProofRouteContext(entry: SmartPayHistoryEntry): {
  hasQuotedRoute: boolean;
  hasRouteProofContext: boolean;
  linkedStepsLabel: string;
  fullCoverageLabel: string;
  zeroCoverageLabel: string;
} {
  const hasQuotedRoute = (entry.quote?.route.length ?? 0) > 0;
  const hasRouteProofContext = hasQuotedRoute
    || (entry.receipt?.routeSummary.length ?? 0) > 0;

  if (hasQuotedRoute) {
    return {
      hasQuotedRoute,
      hasRouteProofContext,
      linkedStepsLabel: "route steps",
      fullCoverageLabel: "quoted route steps",
      zeroCoverageLabel: "route steps",
    };
  }

  return {
    hasQuotedRoute,
    hasRouteProofContext,
    linkedStepsLabel: "receipt route steps",
    fullCoverageLabel: "stored receipt route steps",
    zeroCoverageLabel: "receipt route steps",
  };
}

function getSmartPayHistoryProofRouteLinkageCounts(entry: SmartPayHistoryEntry): {
  hasQuotedRoute: boolean;
  hasRouteProofContext: boolean;
  expectedRouteSteps: number;
  explicitLinkedSteps: number;
  inferredLinkedSteps: number;
  pendingSteps: number;
} {
  const { hasQuotedRoute, hasRouteProofContext } = getSmartPayHistoryProofRouteContext(entry);
  const routeSteps = getSmartPayHistoryProofRouteSteps(entry);

  let explicitLinkedSteps = 0;
  let inferredLinkedSteps = 0;
  let pendingSteps = 0;

  for (const step of routeSteps) {
    if (!step.txRef) {
      pendingSteps += 1;
      continue;
    }

    if (step.txRef.routeStepIndex === step.stepIndex) {
      explicitLinkedSteps += 1;
      continue;
    }

    inferredLinkedSteps += 1;
  }

  return {
    hasQuotedRoute,
    hasRouteProofContext,
    expectedRouteSteps: routeSteps.length,
    explicitLinkedSteps,
    inferredLinkedSteps,
    pendingSteps,
  };
}

export function getSmartPayHistoryProofLabel(entry: SmartPayHistoryEntry): string {
  const { linkedTxCount, expectedRouteSteps } = getSmartPayHistoryProofCounts(entry);
  const { hasRouteProofContext, linkedStepsLabel } = getSmartPayHistoryProofRouteContext(entry);

  if (hasRouteProofContext && expectedRouteSteps > 0) {
    return `On-chain proof: ${linkedTxCount}/${expectedRouteSteps} ${linkedStepsLabel} linked`;
  }
  if (linkedTxCount > 0) {
    return `On-chain proof: ${pluralize(linkedTxCount, "tx reference", "tx references")} linked`;
  }
  if (entry.receipt) {
    return "On-chain proof: receipt snapshot saved; tx links pending";
  }
  return "On-chain proof: no tx references linked yet";
}

function getSmartPayHistoryProofRouteStepContextLabel(
  entry: SmartPayHistoryEntry,
  step: SmartPayHistoryProofRouteStep
): string {
  const { hasQuotedRoute } = getSmartPayHistoryProofRouteContext(entry);
  const routeStepLabel = formatSmartPayRouteStepIndexLabel(step.stepIndex) ?? `route step ${step.stepIndex}`;
  return hasQuotedRoute ? `quoted ${routeStepLabel}` : `stored receipt ${routeStepLabel}`;
}

function getSmartPayHistoryProofRouteStepPendingDetail(
  entry: SmartPayHistoryEntry,
  step: SmartPayHistoryProofRouteStep
): string | null {
  const { hasQuotedRoute } = getSmartPayHistoryProofRouteContext(entry);

  if (hasQuotedRoute) {
    return formatSmartPayExpectedRouteStepTarget(entry, step.stepIndex);
  }

  const summaryLine = entry.receipt?.routeSummary[step.stepIndex - 1]?.trim();
  if (!summaryLine) {
    return null;
  }

  return summaryLine.replace(new RegExp(`^${step.stepIndex}[.)]\\s*`), "").trim() || summaryLine;
}

export function getSmartPayHistoryProofRouteStepHint(
  entry: SmartPayHistoryEntry,
  step: SmartPayHistoryProofRouteStep
): string {
  const { hasQuotedRoute } = getSmartPayHistoryProofRouteContext(entry);
  const contextLabel = getSmartPayHistoryProofRouteStepContextLabel(entry, step);
  const txRef = step.txRef;

  if (txRef) {
    if (txRef.routeStepIndex === step.stepIndex) {
      return `Linked via explicit ${contextLabel} proof ref.`;
    }

    if (hasQuotedRoute) {
      return `Linked by ${step.role.replace(/_/g, " ")} on ${step.network} because this saved proof ref does not carry an explicit quoted route-step index.`;
    }

    return `Linked by stored receipt proof matching ${step.role.replace(/_/g, " ")} on ${step.network} because this saved ref does not carry an explicit stored route-step index.`;
  }

  const pendingDetail = getSmartPayHistoryProofRouteStepPendingDetail(entry, step);
  if (pendingDetail) {
    return hasQuotedRoute
      ? `Awaiting proof ref for ${contextLabel}; this step expects ${pendingDetail}.`
      : `Awaiting proof ref for ${contextLabel}: ${pendingDetail}.`;
  }

  return `Awaiting proof ref for ${contextLabel}.`;
}

export function getSmartPayHistoryProofHint(entry: SmartPayHistoryEntry): string {
  const { linkedTxCount, explorerLinkedTxCount, expectedRouteSteps, additionalTxCount } = getSmartPayHistoryProofCounts(entry);
  const { hasQuotedRoute, hasRouteProofContext, fullCoverageLabel, zeroCoverageLabel } = getSmartPayHistoryProofRouteContext(entry);

  if (hasRouteProofContext && expectedRouteSteps > 0) {
    const explorerPart = explorerLinkedTxCount > 0
      ? `${pluralize(explorerLinkedTxCount, "explorer link", "explorer links")} available`
      : "explorer links pending";
    const unmatchedStepLabel = hasQuotedRoute ? "quoted route step" : "stored receipt route step";
    const extraPart = additionalTxCount > 0
      ? ` ${pluralize(additionalTxCount, "additional tx ref", "additional tx refs")} ${additionalTxCount === 1 ? "is" : "are"} stored separately because ${additionalTxCount === 1 ? "it does" : "they do"} not map to a ${unmatchedStepLabel} yet.`
      : "";
    if (linkedTxCount >= expectedRouteSteps && linkedTxCount > 0) {
      return `Linked proof covers all ${fullCoverageLabel}; ${explorerPart}.${extraPart}`;
    }
    if (linkedTxCount > 0) {
      return `Linked proof currently covers ${linkedTxCount}/${expectedRouteSteps} ${fullCoverageLabel}; ${explorerPart}.${extraPart}`;
    }
    if (entry.receipt) {
      return `Receipt data is stored, but 0/${expectedRouteSteps} ${zeroCoverageLabel} are linked to tx proof refs so far.${extraPart}`;
    }
  }

  if (linkedTxCount > 0) {
    return explorerLinkedTxCount > 0
      ? `Linked proof refs are available for ${pluralize(explorerLinkedTxCount, "explorer link", "explorer links")} and can be opened from the receipt view.`
      : "Linked proof refs are stored, but explorer URLs are not attached yet.";
  }

  if (entry.receipt) {
    return "Receipt data is stored, but no route-linked tx proof refs are attached yet.";
  }

  switch (entry.execution.status) {
    case "awaiting_local_signature":
      return "Proof links appear after route execution starts and tx refs are observed.";
    case "pending_reconciliation":
      return "Refresh this session or recover with observed tx hashes/explorer links after route activity to attach tx proof refs.";
    case "failed":
      return "Proof refs may remain partial until the route is retried or reconciled.";
    case "completed":
      return "Execution completed, but route-linked proof refs were not attached to this snapshot.";
    default:
      return "Route-linked proof refs are not attached to this snapshot yet.";
  }
}

export function getSmartPayHistoryProofRouteDetailLabel(entry: SmartPayHistoryEntry): string | null {
  const counts = getSmartPayHistoryProofRouteLinkageCounts(entry);
  if (!counts.hasRouteProofContext || counts.expectedRouteSteps === 0) {
    return null;
  }

  return `Proof linkage detail: ${counts.explicitLinkedSteps} explicit · ${counts.inferredLinkedSteps} inferred · ${counts.pendingSteps} pending`;
}

export function getSmartPayHistoryProofRouteDetailHint(entry: SmartPayHistoryEntry): string | null {
  const counts = getSmartPayHistoryProofRouteLinkageCounts(entry);
  if (!counts.hasRouteProofContext || counts.expectedRouteSteps === 0) {
    return null;
  }

  const routeStepLabel = counts.hasQuotedRoute ? "quoted route step" : "stored receipt route step";
  const routeStepLabelPlural = `${routeStepLabel}s`;
  const segments: string[] = [];

  if (counts.explicitLinkedSteps > 0) {
    segments.push(
      `${pluralize(counts.explicitLinkedSteps, routeStepLabel, routeStepLabelPlural)} linked via explicit route-step indexes`
    );
  }

  if (counts.inferredLinkedSteps > 0) {
    segments.push(
      `${pluralize(counts.inferredLinkedSteps, routeStepLabel, routeStepLabelPlural)} linked by role/network matching without explicit route-step indexes`
    );
  }

  if (counts.pendingSteps > 0) {
    segments.push(`${pluralize(counts.pendingSteps, routeStepLabel, routeStepLabelPlural)} still pending`);
  }

  if (segments.length === 0) {
    return null;
  }

  return `${segments.join("; ")}.`;
}

function formatSmartPayHistoryProofStepSummary(step: SmartPayHistoryProofRouteStep): string {
  const normalizedRole = step.role.replace(/_/g, " ");
  const normalizedKind = step.kind.replace(/_/g, " ");
  const roleDetail = normalizedRole !== normalizedKind ? ` (${normalizedRole})` : "";
  const route = step.label
    .replace(/^Step \d+: /, "")
    .replace(/^Receipt step \d+: /, "");
  return `step ${step.stepIndex} ${route}${roleDetail}`;
}

function formatSmartPayAdditionalProofRefSubject(ref: SmartPayExecution["txRefs"][number]): string {
  return `${ref.role} on ${ref.network}`;
}

function formatSmartPayExpectedRouteStepTarget(
  entry: SmartPayHistoryEntry,
  stepIndex: number
): string | null {
  const route = entry.quote?.route ?? [];
  const step = route[stepIndex - 1];
  if (!step) {
    return null;
  }

  const expectedRole = getSmartPayHistoryRouteProofRole(step, stepIndex, route.length).replace(/_/g, " ");
  return `${expectedRole} on ${step.network}${formatSmartPayRouteStepRail(step)}`;
}

export function getSmartPayHistoryAdditionalProofTxRefHint(
  entry: SmartPayHistoryEntry,
  ref: SmartPayExecution["txRefs"][number]
): string | null {
  const route = entry.quote?.route ?? [];
  if (route.length === 0) {
    const receiptRouteSteps = getSmartPayReceiptRouteStepCount(entry);
    if (receiptRouteSteps === 0) {
      return null;
    }

    if (ref.routeStepIndex != null) {
      if (ref.routeStepIndex > receiptRouteSteps) {
        return `Claims stored receipt ${formatSmartPayRouteStepIndexLabel(ref.routeStepIndex) ?? `route step ${ref.routeStepIndex}`}, but this snapshot only tracks ${pluralize(receiptRouteSteps, "step", "steps")}.`;
      }

      const matchedStep = getSmartPayHistoryProofRouteSteps(entry).find(
        (step) => step.stepIndex === ref.routeStepIndex && Boolean(step.txRef)
      );
      if (matchedStep?.txRef && getSmartPayTxRefIdentityKey(matchedStep.txRef) !== getSmartPayTxRefIdentityKey(ref)) {
        return `Claims stored receipt ${formatSmartPayRouteStepIndexLabel(ref.routeStepIndex) ?? `route step ${ref.routeStepIndex}`}, but that step is already linked to ${matchedStep.txRef.role} on ${matchedStep.txRef.network} in this snapshot.`;
      }

      const summaryLine = entry.receipt?.routeSummary[ref.routeStepIndex - 1];
      if (!isSmartPayReceiptRouteProofTxRefCompatible(ref, summaryLine, ref.routeStepIndex)) {
        return `Claims stored receipt ${formatSmartPayRouteStepIndexLabel(ref.routeStepIndex) ?? `route step ${ref.routeStepIndex}`}, but that stored step summary does not match ${formatSmartPayAdditionalProofRefSubject(ref)}.`;
      }
    }

    return `${formatSmartPayAdditionalProofRefSubject(ref)} is stored separately because it does not map to any stored receipt route step yet.`;
  }

  if (ref.routeStepIndex != null) {
    const routeStepLabel = formatSmartPayRouteStepIndexLabel(ref.routeStepIndex) ?? `route step ${ref.routeStepIndex}`;
    const expectedTarget = formatSmartPayExpectedRouteStepTarget(entry, ref.routeStepIndex);
    if (!expectedTarget) {
      return `Claims quoted ${routeStepLabel}, but this quote only has ${pluralize(route.length, "step", "steps")}.`;
    }

    const matchedStep = getSmartPayHistoryProofRouteSteps(entry).find(
      (step) => step.stepIndex === ref.routeStepIndex && Boolean(step.txRef)
    );
    if (matchedStep?.txRef && getSmartPayTxRefIdentityKey(matchedStep.txRef) !== getSmartPayTxRefIdentityKey(ref)) {
      return `Claims quoted ${routeStepLabel}, but that step is already linked to ${matchedStep.txRef.role} on ${matchedStep.txRef.network} in this snapshot.`;
    }

    return `Claims quoted ${routeStepLabel}, but that step expects ${expectedTarget}.`;
  }

  return `${formatSmartPayAdditionalProofRefSubject(ref)} is stored separately because it does not map to any quoted route step yet.`;
}

export function getSmartPayHistoryProofTxRefHint(
  entry: SmartPayHistoryEntry,
  ref: SmartPayExecution["txRefs"][number]
): string | null {
  const { hasRouteProofContext } = getSmartPayHistoryProofRouteContext(entry);
  if (!hasRouteProofContext) {
    return `Observed ${formatSmartPayAdditionalProofRefSubject(ref)} proof ref; no quoted or stored route-step metadata is available in this snapshot.`;
  }

  const matchedStep = getSmartPayHistoryProofRouteSteps(entry).find(
    (step) => step.txRef && getSmartPayTxRefIdentityKey(step.txRef) === getSmartPayTxRefIdentityKey(ref)
  );
  if (matchedStep) {
    return getSmartPayHistoryProofRouteStepHint(entry, matchedStep);
  }

  return getSmartPayHistoryAdditionalProofTxRefHint(entry, ref);
}

export function getSmartPayHistoryAdditionalProofHint(entry: SmartPayHistoryEntry): string | null {
  const additionalRefs = getSmartPayHistoryAdditionalProofTxRefs(entry);
  if (additionalRefs.length === 0) {
    return null;
  }

  return `Additional observed tx refs: ${additionalRefs
    .map((ref) => `${formatSmartPayAdditionalProofRefSubject(ref)} — ${getSmartPayHistoryAdditionalProofTxRefHint(entry, ref) ?? "stored separately."}`)
    .join(" ")}`;
}

export function getSmartPayHistoryPendingProofHint(entry: SmartPayHistoryEntry): string | null {
  const { hasQuotedRoute, hasRouteProofContext } = getSmartPayHistoryProofRouteContext(entry);
  if (!hasRouteProofContext) {
    return null;
  }

  const routeSteps = getSmartPayHistoryProofRouteSteps(entry);
  if (routeSteps.length === 0) {
    return null;
  }

  const pendingSteps = routeSteps.filter((step) => !step.txRef);
  if (pendingSteps.length === 0) {
    return null;
  }

  const prefix = hasQuotedRoute ? "Pending quoted route proof" : "Pending stored receipt route proof";
  return `${prefix} (${pluralize(pendingSteps.length, "step", "steps")}): ${pendingSteps
    .map((step) => formatSmartPayHistoryProofStepSummary(step))
    .join(" → ")}.`;
}

export function getSmartPayHistoryProofEmptyStateHint(
  entry: SmartPayHistoryEntry | null | undefined
): string {
  if (!entry) {
    return "No tx references observed yet.";
  }

  const { hasRouteProofContext } = getSmartPayHistoryProofRouteContext(entry);
  if (!hasRouteProofContext) {
    return "No tx references observed yet.";
  }

  const additionalRefs = getSmartPayHistoryAdditionalProofTxRefs(entry);
  if (additionalRefs.length > 0) {
    return "No route-linked tx refs observed yet. Additional observed tx refs are listed separately below.";
  }

  return "No route-linked tx refs observed yet.";
}

export type SmartPayHistoryAccessOptions = {
  hasAccountAuth?: boolean;
};

export type SmartPayHistoryFreshnessOptions = SmartPayHistoryAccessOptions;
export type SmartPayHistoryActionOptions = SmartPayHistoryAccessOptions;
export type SmartPayHistoryNextStepOptions = SmartPayHistoryAccessOptions;

export type SmartPayExecutionAccessOptions = {
  sessionToken?: string | null;
  hasAccountAuth?: boolean;
};

export type SmartPayRecoveryAccessOptions = SmartPayExecutionAccessOptions & {
  recoverable?: boolean | null;
};

export function getSmartPayHistorySourceLabel(entry: SmartPayHistoryEntry): string {
  switch (entry.snapshotOrigin) {
    case "backend":
      return "Authenticated backend history";
    case "local+backend":
      return "Merged local + backend snapshot";
    case "local":
    default:
      return "Device-local secure snapshot";
  }
}

export function getSmartPayHistorySourceHint(entry: SmartPayHistoryEntry): string {
  switch (entry.snapshotOrigin) {
    case "backend":
      return "This entry came from authenticated ANCAP backend payment history and receipt data. It does not include the original device-local session token unless that token was also saved on this device.";
    case "local+backend":
      return "This entry merges the device-local secure snapshot with authenticated backend payment history so newer receipt/progress data and locally saved resume access can survive together.";
    case "local":
    default:
      return "This entry is stored only in secure device-local history on this phone right now.";
  }
}

export function getSmartPayHistoryFreshnessLabel(
  entry: SmartPayHistoryEntry,
  now = Date.now()
): string {
  const timestamp = getSmartPayHistoryFreshnessTimestamp(entry);
  if (timestamp === null) {
    return "Snapshot freshness: timestamp unavailable";
  }

  const ageMs = Math.max(now - timestamp, 0);
  if (ageMs < 5_000) {
    return "Snapshot freshness: updated just now";
  }

  return `Snapshot freshness: updated ${formatSmartPayRelativeAge(ageMs)} ago`;
}

export function getSmartPayHistoryFreshnessHint(
  entry: SmartPayHistoryEntry,
  options: SmartPayHistoryFreshnessOptions = {},
  now = Date.now()
): string {
  const timestamp = getSmartPayHistoryFreshnessTimestamp(entry);
  if (timestamp === null) {
    return "Snapshot age is unavailable for this entry. Refresh it when possible before relying on saved route/proof state.";
  }

  const ageMs = Math.max(now - timestamp, 0);
  const refreshAvailable = canSmartPayRefreshOrRecover({
    sessionToken: entry.sessionToken,
    hasAccountAuth: options.hasAccountAuth,
  });
  const finalized = !entry.execution.recoverable || entry.execution.status === "completed";

  if (ageMs < 5 * 60_000) {
    return finalized
      ? "This saved receipt/proof snapshot is recent."
      : "This saved execution snapshot is recent; refresh only if route activity continued elsewhere.";
  }

  if (ageMs < 30 * 60_000) {
    if (refreshAvailable) {
      return finalized
        ? "This saved receipt/proof snapshot may be slightly behind newer backend/device updates. Refresh status to confirm final proof coverage."
        : "This saved execution snapshot may be slightly stale; refresh status if route activity continued after this device saved it.";
    }

    return "This restored snapshot may already be behind live route activity. Sign in or restore the original device session to refresh it; otherwise treat it as saved context only.";
  }

  if (refreshAvailable) {
    return finalized
      ? "This saved receipt/proof snapshot is getting stale. Refresh status/receipt before relying on final proof coverage or fee details."
      : "This saved execution snapshot is getting stale. Refresh status or recover before relying on remaining route steps or proof coverage.";
  }

  return finalized
    ? "This restored final snapshot may be stale and cannot be refreshed anonymously from this device. Sign in or restore the original device session for newer receipt/proof data, or treat it as historical context only."
    : "This restored in-flight snapshot may be stale and cannot be refreshed anonymously from this device. Sign in or restore the original device session before relying on current route progress.";
}

export function hasSmartPayLiveSessionAccess(entry: SmartPayHistoryEntry): boolean {
  return Boolean(entry.sessionToken?.trim());
}

export function resolveSmartPayExecutionSessionToken(
  entry: SmartPayHistoryEntry | null | undefined,
  fallbackSessionToken?: string | null
): string | null {
  const entrySessionToken = entry?.sessionToken?.trim();
  if (entrySessionToken) {
    return entrySessionToken;
  }

  const fallback = fallbackSessionToken?.trim();
  return fallback ? fallback : null;
}

export function canSmartPayRefreshOrRecover(
  options: SmartPayExecutionAccessOptions = {}
): boolean {
  return Boolean(options.sessionToken?.trim() || options.hasAccountAuth);
}

export function getSmartPayRefreshOrRecoverHint(
  options: SmartPayExecutionAccessOptions = {}
): string {
  if (options.sessionToken?.trim()) {
    return "Refresh and recovery can continue from the original device-local session token.";
  }
  if (options.hasAccountAuth) {
    return "This snapshot does not include the original device-local session token, but the signed-in ANCAP account can still refresh status/receipt and attempt recovery through backend history ownership.";
  }
  return "This device only has a restored receipt/history snapshot for this execution. Anonymous refresh/recover requires the original device-local session token; authenticated backend history can still be used after sign-in when the execution belongs to the same account.";
}

export function canSmartPayRecoverExecution(
  options: SmartPayRecoveryAccessOptions = {}
): boolean {
  return Boolean(options.recoverable && canSmartPayRefreshOrRecover(options));
}

export function getSmartPayRecoverHint(
  options: SmartPayRecoveryAccessOptions = {}
): string {
  if (!options.recoverable) {
    if (options.sessionToken?.trim() || options.hasAccountAuth) {
      return "This execution is already in a final state, so recovery is no longer available. You can still refresh status and receipt data from the latest saved session or backend snapshot.";
    }
    return "This execution is already in a final state, and this device also lacks the live session or backend access needed to refresh it.";
  }
  return getSmartPayRefreshOrRecoverHint(options);
}

export function getSmartPayHistoryAccessLabel(
  entry: SmartPayHistoryEntry,
  options: SmartPayHistoryAccessOptions = {}
): string {
  if (hasSmartPayLiveSessionAccess(entry)) {
    return "Live resume available on this device";
  }
  if (options.hasAccountAuth) {
    return "Backend resume available for signed-in ANCAP account";
  }
  return "Snapshot restored — auth or original device session required for live resume";
}

export function getSmartPayHistoryAccessHint(
  entry: SmartPayHistoryEntry,
  options: SmartPayHistoryAccessOptions = {}
): string {
  if (hasSmartPayLiveSessionAccess(entry)) {
    return "Refresh and recovery can continue from this device-local session token.";
  }
  if (options.hasAccountAuth) {
    return "This snapshot does not include the original device-local session token, but authenticated backend history on this signed-in device can still refresh status/receipt and attempt recovery for executions owned by the same ANCAP account.";
  }
  return "This snapshot does not include the original device-local session token. If this device is signed into the same ANCAP account, backend history can still refresh status/receipt and attempt recovery; otherwise only the saved snapshot is available.";
}

export function getSmartPayHistoryActionLabel(
  entry: SmartPayHistoryEntry,
  options: SmartPayHistoryActionOptions = {}
): string {
  const refreshAvailable = canSmartPayRefreshOrRecover({
    sessionToken: entry.sessionToken,
    hasAccountAuth: options.hasAccountAuth,
  });
  const recoverAvailable = canSmartPayRecoverExecution({
    sessionToken: entry.sessionToken,
    hasAccountAuth: options.hasAccountAuth,
    recoverable: entry.execution.recoverable,
  });

  if (entry.execution.status === "awaiting_local_signature") {
    if (hasSmartPayLiveSessionAccess(entry)) {
      return "Restore original session";
    }
    return refreshAvailable ? "Refresh status only" : "Snapshot only";
  }

  if (refreshAvailable && recoverAvailable) {
    return "Refresh status + recover available";
  }
  if (refreshAvailable) {
    switch (entry.execution.status) {
      case "completed":
        return "Refresh receipt only";
      case "failed":
        return "Refresh failure details";
      default:
        return "Refresh status only";
    }
  }
  return "Snapshot only";
}

export function getSmartPayHistoryActionHint(
  entry: SmartPayHistoryEntry,
  options: SmartPayHistoryActionOptions = {}
): string {
  const refreshOptions = {
    sessionToken: entry.sessionToken,
    hasAccountAuth: options.hasAccountAuth,
  };

  if (entry.execution.status === "awaiting_local_signature") {
    if (hasSmartPayLiveSessionAccess(entry)) {
      return "Restore the original device-local session first. This payment still needs the pending local signature before route progress can continue. Refresh status can confirm whether the signing device already advanced the route, and recovery only helps after you have observed a broadcast tx to reconcile.";
    }
    if (options.hasAccountAuth) {
      return "Backend history can refresh ownership-linked status, but it cannot create the missing local signature. Open the original signing device session before this payment can continue.";
    }
    return getSmartPayHistoryAccessHint(entry, options);
  }

  if (!canSmartPayRefreshOrRecover(refreshOptions)) {
    return getSmartPayHistoryAccessHint(entry, options);
  }

  if (
    canSmartPayRecoverExecution({
      ...refreshOptions,
      recoverable: entry.execution.recoverable,
    })
  ) {
    return getSmartPayRefreshOrRecoverHint(refreshOptions);
  }

  return getSmartPayRecoverHint({
    ...refreshOptions,
    recoverable: entry.execution.recoverable,
  });
}

function hasIncompleteSmartPayHistoryProof(entry: SmartPayHistoryEntry): boolean {
  const { linkedTxCount, expectedRouteSteps } = getSmartPayHistoryProofCounts(entry);

  if (expectedRouteSteps > 0) {
    return linkedTxCount < expectedRouteSteps;
  }

  return Boolean(entry.receipt && linkedTxCount === 0);
}

function isSmartPayHistoryStale(
  entry: SmartPayHistoryEntry,
  now = Date.now(),
  thresholdMs = 30 * 60_000
): boolean {
  const timestamp = getSmartPayHistoryFreshnessTimestamp(entry);
  if (timestamp === null) {
    return true;
  }
  return Math.max(now - timestamp, 0) >= thresholdMs;
}

export function getSmartPayHistoryNextStepLabel(
  entry: SmartPayHistoryEntry,
  options: SmartPayHistoryNextStepOptions = {},
  now = Date.now()
): string {
  const refreshOptions = {
    sessionToken: entry.sessionToken,
    hasAccountAuth: options.hasAccountAuth,
  };
  const refreshAvailable = canSmartPayRefreshOrRecover(refreshOptions);
  const recoverAvailable = canSmartPayRecoverExecution({
    ...refreshOptions,
    recoverable: entry.execution.recoverable,
  });
  const stale = isSmartPayHistoryStale(entry, now);
  const incompleteProof = hasIncompleteSmartPayHistoryProof(entry);

  switch (entry.execution.status) {
    case "awaiting_local_signature":
      return hasSmartPayLiveSessionAccess(entry)
        ? "Next step: sign on the original device"
        : "Next step: restore the original device session";
    case "pending_reconciliation":
      if (!refreshAvailable) {
        return "Next step: sign in or restore the original device";
      }
      return stale ? "Next step: refresh or recover now" : "Next step: monitor or refresh";
    case "failed":
      if (recoverAvailable) {
        return "Next step: recover with observed tx refs";
      }
      if (refreshAvailable) {
        return "Next step: refresh failure details";
      }
      return "Next step: inspect the saved failure snapshot";
    case "completed":
      if (incompleteProof && refreshAvailable) {
        return "Next step: refresh final proof";
      }
      if (incompleteProof) {
        return "Next step: inspect the saved receipt snapshot";
      }
      if (refreshAvailable && stale) {
        return "Next step: refresh the receipt snapshot";
      }
      return "Next step: inspect receipt details";
    default:
      return refreshAvailable ? "Next step: refresh status" : "Next step: inspect the saved snapshot";
  }
}

export function getSmartPayHistoryNextStepHint(
  entry: SmartPayHistoryEntry,
  options: SmartPayHistoryNextStepOptions = {},
  now = Date.now()
): string {
  const refreshOptions = {
    sessionToken: entry.sessionToken,
    hasAccountAuth: options.hasAccountAuth,
  };
  const refreshAvailable = canSmartPayRefreshOrRecover(refreshOptions);
  const recoverAvailable = canSmartPayRecoverExecution({
    ...refreshOptions,
    recoverable: entry.execution.recoverable,
  });
  const stale = isSmartPayHistoryStale(entry, now);
  const incompleteProof = hasIncompleteSmartPayHistoryProof(entry);

  switch (entry.execution.status) {
    case "awaiting_local_signature":
      if (hasSmartPayLiveSessionAccess(entry)) {
        return "This route has not started yet. Restore the original device-local session and complete the required signature before route progress can continue.";
      }
      return options.hasAccountAuth
        ? "Backend history can refresh ownership-linked status, but it cannot create the missing local signature. Open the original signing device session before this payment can continue."
        : "This snapshot cannot create the missing local signature by itself. Restore the original signing device session before this payment can continue.";
    case "pending_reconciliation":
      if (!refreshAvailable) {
        return "This in-flight snapshot cannot refresh from this device right now. Sign in to the owning ANCAP account or restore the original device session before trusting current route progress.";
      }
      if (stale) {
        return "Route activity may have continued after this snapshot. Refresh status first, then recover with observed tx hashes or explorer links if proof coverage is still incomplete.";
      }
      return "This route is still in flight. Keep monitoring it here, and refresh status if you expect more tx proof refs or route-step updates.";
    case "failed":
      if (recoverAvailable) {
        return "Refresh status if the route may already have completed elsewhere, or paste observed tx hashes/explorer links to reconcile partial proof before retrying.";
      }
      if (refreshAvailable) {
        return "Recovery is no longer available for this failure state, but refreshing can still pull newer backend receipt or error context if it exists.";
      }
      return "Only the saved failure context is available on this device until you sign in or restore the original device session.";
    case "completed":
      if (incompleteProof && refreshAvailable) {
        return "This payment is completed, but the saved snapshot still lacks full linked proof coverage. Refresh status/receipt for newer proof refs and final fee details.";
      }
      if (incompleteProof) {
        return "This payment is completed, but the saved snapshot still lacks full linked proof coverage. Sign in or restore the original device session if you need newer receipt/proof data.";
      }
      if (refreshAvailable && stale) {
        return "This saved receipt/proof snapshot is getting stale. Refresh it before relying on final fee totals or proof links elsewhere.";
      }
      return "This snapshot already contains the latest saved receipt context, route summary, and linked proof coverage available on this device.";
    default:
      return refreshAvailable
        ? "Refresh status to confirm whether newer execution or receipt data is available."
        : "Only the saved snapshot is available on this device right now.";
  }
}
