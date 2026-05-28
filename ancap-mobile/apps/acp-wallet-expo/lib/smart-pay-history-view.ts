import type { SmartPayExecution } from "@ancap/acp-api-client";
import type { SmartPayHistoryEntry } from "./smart-pay-history";

export type SmartPayHistoryBucket = "in_flight" | "needs_attention" | "completed";

export type SmartPayHistorySection = {
  key: SmartPayHistoryBucket;
  title: string;
  entries: SmartPayHistoryEntry[];
};

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

export function getSmartPayHistoryAmountLabel(entry: SmartPayHistoryEntry): string {
  const amount =
    entry.receipt?.targetAmountPaid ?? entry.quote?.targetAmount ?? entry.intent.amount?.value ?? "—";
  const symbol =
    entry.receipt?.targetAssetPaid ?? entry.quote?.targetAsset.symbol ?? entry.intent.asset.symbol ?? "asset";
  return `${amount} ${symbol}`;
}
