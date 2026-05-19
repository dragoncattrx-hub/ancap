"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { workflowStore } from "@/lib/api";

type WorkflowRunStatus = "quoted" | "paid" | "queued" | "running" | "completed" | "failed" | "cancelled";

type WorkflowRunTimelineItem = {
  from?: string | null;
  to: string;
  changed_at: string;
};

type WorkflowRun = {
  id: string;
  workflow_slug: string;
  title: string;
  category: string;
  status: WorkflowRunStatus;
  price: { amount: string; currency: string };
  payment_currency: string;
  unlock_full_result: boolean;
  inputs: Record<string, any>;
  preview: Record<string, any>;
  result?: Record<string, any> | null;
  receipt: {
    workflow_slug: string;
    payment_currency: string;
    quoted_price: { amount: string; currency: string };
    status: string;
    receipt_items: string[];
    proof: Record<string, any> & { status_timeline?: WorkflowRunTimelineItem[] };
  };
  created_at: string;
  owner_user_id?: string | null;
};

type WorkflowRunReceiptTrail = {
  workflow_run_id: string;
  settlement_intent?: {
    id: string;
    intent_type: string;
    source_owner_type: string;
    source_owner_id: string;
    target_owner_type: string;
    target_owner_id: string;
    amount_currency: string;
    amount_value: string;
    status: string;
    correlation_id: string;
    metadata_json?: Record<string, any> | null;
    error_message?: string | null;
    executed_at?: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  chain_receipts: Array<{
    id: string;
    settlement_intent_id: string;
    chain_id: string;
    tx_hash?: string | null;
    node_signature?: string | null;
    node_public_key?: string | null;
    status: string;
    correlation_id: string;
    payload_hash: string;
    receipt_json?: Record<string, any> | null;
    error_message?: string | null;
    finalized_at?: string | null;
    created_at: string;
    updated_at: string;
  }>;
};

type WorkflowRunProofBundle = {
  bundle_version: string;
  generated_at: string;
  workflow_run_id: string;
  proof_hash: string;
  receipt_items: string[];
  payment_confirmation?: Record<string, any> | null;
  execution: Record<string, any>;
  settlement_intent?: WorkflowRunReceiptTrail["settlement_intent"];
  chain_receipts: WorkflowRunReceiptTrail["chain_receipts"];
  status_timeline: WorkflowRunTimelineItem[];
  summary: {
    payment_confirmed: boolean;
    settlement_status?: string | null;
    chain_receipt_count: number;
    finalized_receipt_count: number;
    failed_receipt_count: number;
    submitted_receipt_count: number;
    execution_mode?: string | null;
    executed_at?: string | null;
    latest_chain_receipt_status?: string | null;
  };
};

const NEXT_ACTIONS: Record<WorkflowRunStatus, WorkflowRunStatus[]> = {
  quoted: ["cancelled"],
  paid: ["queued", "cancelled"],
  queued: ["running", "cancelled"],
  running: ["completed", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};

export default function WorkflowRunDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [receiptTrail, setReceiptTrail] = useState<WorkflowRunReceiptTrail | null>(null);
  const [proofBundle, setProofBundle] = useState<WorkflowRunProofBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<WorkflowRunStatus | null>(null);
  const [executeLoading, setExecuteLoading] = useState(false);
  const [repeatLoading, setRepeatLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [reserveCreditsLoading, setReserveCreditsLoading] = useState(false);
  const [retrySettlementLoading, setRetrySettlementLoading] = useState(false);
  const [proofBundleActionMessage, setProofBundleActionMessage] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual");
  const [paymentNote, setPaymentNote] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const loadRun = useCallback(async () => {
    if (!params?.id) return;
    try {
      setLoading(true);
      setError("");
      const [data, trail, bundle] = await Promise.all([
        workflowStore.getRun(params.id),
        workflowStore.getReceiptTrail(params.id),
        workflowStore.getProofBundle(params.id),
      ]);
      setRun(data);
      setReceiptTrail(trail);
      setProofBundle(bundle);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    if (!isAuthenticated || !params?.id) return;
    void loadRun();
  }, [isAuthenticated, params?.id, loadRun]);

  async function refreshProofArtifacts(runId: string) {
    const [trail, bundle] = await Promise.all([
      workflowStore.getReceiptTrail(runId),
      workflowStore.getProofBundle(runId),
    ]);
    setReceiptTrail(trail);
    setProofBundle(bundle);
  }

  async function updateStatus(status: WorkflowRunStatus) {
    if (!run) return;
    try {
      setActionLoading(status);
      setError("");
      const response = await workflowStore.updateRunStatus(run.id, status);
      const nextRun = response.item || response;
      setRun(nextRun);
      await refreshProofArtifacts(nextRun.id);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setActionLoading(null);
    }
  }

  async function executeRun() {
    if (!run) return;
    try {
      setExecuteLoading(true);
      setError("");
      const response = await workflowStore.executeRun(run.id);
      const nextRun = response.item || response;
      setRun(nextRun);
      await refreshProofArtifacts(nextRun.id);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setExecuteLoading(false);
    }
  }

  async function confirmPayment() {
    if (!run) return;
    if (!paymentReference.trim()) {
      setError("Payment reference is required.");
      return;
    }
    try {
      setPaymentLoading(true);
      setError("");
      const response = await workflowStore.confirmRunPayment(run.id, {
        payment_reference: paymentReference.trim(),
        payment_method: paymentMethod.trim() || "manual",
        payment_amount: { amount: run.price.amount, currency: run.payment_currency },
        note: paymentNote.trim() || undefined,
      });
      const nextRun = response.item || response;
      setRun(nextRun);
      await refreshProofArtifacts(nextRun.id);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setPaymentLoading(false);
    }
  }

  async function reserveCredits() {
    if (!run) return;
    try {
      setReserveCreditsLoading(true);
      setError("");
      const response = await workflowStore.createPaymentIntent(run.id, {
        payment_method: "credits",
        note: "Reserved from workflow credits.",
      });
      const nextRun = response.run || response.item?.run || response;
      setRun(nextRun);
      await refreshProofArtifacts(nextRun.id);
    } catch (e: any) {
      setError(e?.message || String(e));
      await loadRun();
    } finally {
      setReserveCreditsLoading(false);
    }
  }

  async function retrySettlement() {
    if (!run) return;
    try {
      setRetrySettlementLoading(true);
      setError("");
      const response = await workflowStore.retrySettlement(run.id);
      const nextRun = response.item || response;
      setRun(nextRun);
      await refreshProofArtifacts(nextRun.id);
    } catch (e: any) {
      setError(e?.message || String(e));
      await loadRun();
    } finally {
      setRetrySettlementLoading(false);
    }
  }

  async function repeatRun() {
    if (!run) return;
    try {
      setRepeatLoading(true);
      setError("");
      const created = await workflowStore.repeatRun(run.id);
      router.push(`/ai/runs/${created.id}`);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setRepeatLoading(false);
    }
  }

  function editAndRepeatRun() {
    if (!run) return;
    const params = new URLSearchParams({
      fromRun: run.id,
      prefill: "1",
      inputs: JSON.stringify(run.inputs || {}),
      paymentCurrency: run.payment_currency,
      unlockFullResult: run.unlock_full_result ? "1" : "0",
    });
    router.push(`/ai/run/${run.workflow_slug}?${params.toString()}`);
  }

  const nextActions = useMemo(() => (run ? NEXT_ACTIONS[run.status] || [] : []), [run]);
  const canExecute = useMemo(() => (run ? ["paid", "queued", "running"].includes(run.status) : false), [run]);
  const canConfirmPayment = useMemo(() => run?.status === "quoted", [run]);
  const timeline = useMemo(() => {
    const raw = run?.receipt?.proof?.status_timeline;
    return Array.isArray(raw) ? raw : [];
  }, [run]);
  const paymentConfirmation = run?.receipt?.proof?.payment_confirmation;
  const settlementError = run?.receipt?.proof?.settlement_error;
  const settlementStatus = String(run?.receipt?.proof?.settlement_status || "");
  const canRetrySettlement = run?.status === "quoted" && settlementStatus === "failed";
  const settlementAttempts = useMemo(() => {
    const receipts = Array.isArray(receiptTrail?.chain_receipts) ? [...receiptTrail.chain_receipts] : [];
    return receipts
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((item, index) => ({
        ...item,
        attemptNumber: index + 1,
        driver: String(item.receipt_json?.driver || item.chain_id),
        replayed: Boolean(item.receipt_json?.replayed),
        ledgerEventReused: Boolean(item.receipt_json?.ledger_event_reused),
      }));
  }, [receiptTrail]);
  const latestSettlementAttempt = settlementAttempts.length > 0 ? settlementAttempts[settlementAttempts.length - 1] : null;
  const settlementAttemptStats = useMemo(() => ({
    total: settlementAttempts.length,
    finalized: settlementAttempts.filter((item) => item.status === "finalized").length,
    failed: settlementAttempts.filter((item) => item.status === "failed").length,
    submitted: settlementAttempts.filter((item) => item.status === "submitted").length,
  }), [settlementAttempts]);

  const proofBundleText = useMemo(() => (proofBundle ? JSON.stringify(proofBundle, null, 2) : ""), [proofBundle]);
  const invoiceReference = useMemo(() => (run ? `ANCAP-${run.id.slice(0, 8)}-${run.workflow_slug}` : ""), [run]);
  const paymentTarget = "ancap-workflow-treasury";
  const shouldPollRun = Boolean(run && ["quoted", "paid", "queued", "running"].includes(run.status));

  useEffect(() => {
    if (!shouldPollRun) return;
    const interval = window.setInterval(() => {
      void loadRun();
    }, 10000);
    return () => window.clearInterval(interval);
  }, [shouldPollRun, loadRun]);

  async function copyProofBundle() {
    if (!proofBundleText) return;
    try {
      await navigator.clipboard.writeText(proofBundleText);
      setProofBundleActionMessage("Proof bundle JSON copied.");
    } catch {
      setProofBundleActionMessage("Failed to copy proof bundle JSON.");
    }
  }

  async function copyProofHash() {
    if (!proofBundle?.proof_hash) return;
    try {
      await navigator.clipboard.writeText(proofBundle.proof_hash);
      setProofBundleActionMessage("Proof hash copied.");
    } catch {
      setProofBundleActionMessage("Failed to copy proof hash.");
    }
  }

  function downloadProofBundle() {
    if (!proofBundleText || !proofBundle) return;
    const blob = new Blob([proofBundleText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workflow-run-proof-${proofBundle.workflow_run_id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setProofBundleActionMessage("Proof bundle downloaded.");
  }

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Workflow Store</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Workflow run</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/ai/runs" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              Back to runs
            </Link>
            <Link href="/billing" className="rounded-full border border-emerald-400/25 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/50 hover:text-emerald-100">
              Billing overview
            </Link>
            <Link href="/wallet/credits" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              Credits
            </Link>
            {run && (
              <Link href={`/proof-center?run=${run.id}`} className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
                Proof Center
              </Link>
            )}
            {run && (
              <Link href={`/ai/run/${run.workflow_slug}`} className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
                Open template
              </Link>
            )}
          </div>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/55">Loading workflow run…</div>
        ) : !run ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/55">Workflow run not found.</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">{run.category}</div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{run.title}</h2>
                  <div className="mt-2 text-sm text-white/55">Run ID: {run.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/55">Status</div>
                  <div className="mt-1 text-lg font-semibold text-emerald-300">{run.status}</div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="text-sm font-semibold text-white/90">Lifecycle actions</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={repeatRun}
                    disabled={repeatLoading || executeLoading || actionLoading !== null || paymentLoading}
                    className="rounded-full border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-300 hover:text-emerald-200 disabled:opacity-50"
                  >
                    {repeatLoading ? "Repeating…" : "Repeat run"}
                  </button>
                  <button
                    type="button"
                    onClick={editAndRepeatRun}
                    disabled={repeatLoading || executeLoading || actionLoading !== null || paymentLoading}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white disabled:opacity-50"
                  >
                    Edit & repeat
                  </button>
                  {canExecute && (
                    <button
                      type="button"
                      onClick={executeRun}
                      disabled={executeLoading || repeatLoading || actionLoading !== null || paymentLoading || retrySettlementLoading}
                      className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
                    >
                      {executeLoading ? "Executing…" : "Execute workflow"}
                    </button>
                  )}
                  {canRetrySettlement && (
                    <button
                      type="button"
                      onClick={retrySettlement}
                      disabled={retrySettlementLoading || executeLoading || repeatLoading || actionLoading !== null || paymentLoading}
                      className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
                    >
                      {retrySettlementLoading ? "Retrying settlement…" : "Retry settlement"}
                    </button>
                  )}
                  {nextActions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateStatus(status)}
                      disabled={actionLoading !== null || executeLoading || repeatLoading || paymentLoading}
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white disabled:opacity-50"
                    >
                      {actionLoading === status ? `Updating to ${status}…` : `Mark ${status}`}
                    </button>
                  ))}
                  {!canExecute && !canConfirmPayment && nextActions.length === 0 && (
                    <div className="text-sm text-white/55">This workflow run is in a terminal state.</div>
                  )}
                </div>
              </div>

              {canConfirmPayment && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white/90">Confirm payment</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Link href="/billing" className="rounded-full border border-emerald-400/25 px-3 py-1.5 font-semibold text-emerald-200 transition hover:border-emerald-300/50 hover:text-emerald-100">
                        Open billing
                      </Link>
                      <Link href="/wallet/credits" className="rounded-full border border-white/15 px-3 py-1.5 font-semibold text-white/80 transition hover:border-white/30 hover:text-white">
                        Check credits
                      </Link>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white/90">Checkout invoice</div>
                        <div className="mt-1 text-sm text-white/58">Use credits for instant reservation, or pay manually and paste the transfer reference below.</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void loadRun()}
                        className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
                      >
                        Poll status
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/45">Amount due</div>
                        <div className="mt-2 text-lg font-semibold text-emerald-300">{run.price.amount} {run.payment_currency}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/45">Payment target</div>
                        <div className="mt-2 break-all text-sm font-semibold text-white/88">{paymentTarget}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:col-span-2">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/45">Reference</div>
                        <div className="mt-2 break-all text-sm font-semibold text-white/88">{invoiceReference}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-emerald-100">Pay with workflow credits</div>
                        <div className="mt-1 text-sm text-emerald-100/70">
                          Reserve {run.price.amount} {run.payment_currency} from your ledger balance and unlock execution.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={reserveCredits}
                        disabled={reserveCreditsLoading || paymentLoading || retrySettlementLoading || executeLoading || repeatLoading || actionLoading !== null}
                        className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
                      >
                        {reserveCreditsLoading ? "Reserving..." : "Reserve credits"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4">
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">Payment reference</div>
                      <input
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder={invoiceReference || "tx hash / invoice id / transfer ref"}
                        className="w-full rounded-2xl border border-white/10 bg-[var(--bg)] px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">Payment method</div>
                      <input
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        placeholder="manual"
                        className="w-full rounded-2xl border border-white/10 bg-[var(--bg)] px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">Note</div>
                      <textarea
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        rows={3}
                        className="w-full rounded-2xl border border-white/10 bg-[var(--bg)] p-3 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={confirmPayment}
                        disabled={paymentLoading || retrySettlementLoading || executeLoading || repeatLoading || actionLoading !== null}
                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
                      >
                        {paymentLoading ? "Confirming…" : "Confirm payment"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Quoted price</div>
                  <div className="mt-2 text-lg font-semibold text-white/92">{run.price.amount} {run.price.currency}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Payment currency</div>
                  <div className="mt-2 text-lg font-semibold text-white/92">{run.payment_currency}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Full result shell</div>
                  <div className="mt-2 text-lg font-semibold text-white/92">{run.unlock_full_result ? "enabled" : "disabled"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Created</div>
                  <div className="mt-2 text-sm font-medium text-white/75">{new Date(run.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Inputs</div>
                <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/78">{JSON.stringify(run.inputs, null, 2)}</pre>
              </div>

              <div className="mt-6">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Preview</div>
                <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/78">{JSON.stringify(run.preview, null, 2)}</pre>
              </div>

              <div className="mt-6">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Result shell</div>
                <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/78">{JSON.stringify(run.result, null, 2)}</pre>
              </div>
            </section>

            <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-xs uppercase tracking-[0.18em] text-white/45">Receipt</div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="text-sm text-white/60">Workflow</div>
                <div className="mt-1 font-medium text-white/88">{run.receipt.workflow_slug}</div>
                <div className="mt-4 text-sm text-white/60">Quoted price</div>
                <div className="mt-1 font-medium text-emerald-300">{run.receipt.quoted_price.amount} {run.receipt.quoted_price.currency}</div>
                <div className="mt-4 text-sm text-white/60">Receipt status</div>
                <div className="mt-1 font-medium text-white/88">{run.receipt.status}</div>
              </div>

              {proofBundle && (
                <div id="proof-bundle" className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 scroll-mt-24">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-emerald-200">Proof bundle</div>
                      <div className="mt-1 text-xs text-emerald-100/70">{proofBundle.bundle_version}</div>
                    </div>
                    <div className="text-right text-xs text-emerald-100/70">
                      <div>Generated: {new Date(proofBundle.generated_at).toLocaleString()}</div>
                      <div className="mt-1">Hash: {proofBundle.proof_hash.slice(0, 16)}…</div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-400/15 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Payment confirmed</div>
                      <div className="mt-2 text-lg font-semibold text-white/92">{proofBundle.summary.payment_confirmed ? "yes" : "no"}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/15 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Settlement</div>
                      <div className="mt-2 text-lg font-semibold text-white/92">{proofBundle.summary.settlement_status || "—"}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/15 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Chain receipts</div>
                      <div className="mt-2 text-lg font-semibold text-white/92">{proofBundle.summary.chain_receipt_count}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/15 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Execution mode</div>
                      <div className="mt-2 text-lg font-semibold text-white/92">{proofBundle.summary.execution_mode || "not_executed"}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/15 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Finalized receipts</div>
                      <div className="mt-2 text-lg font-semibold text-emerald-300">{proofBundle.summary.finalized_receipt_count}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/15 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/45">Failed receipts</div>
                      <div className="mt-2 text-lg font-semibold text-red-200">{proofBundle.summary.failed_receipt_count}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyProofBundle}
                      className="rounded-full border border-emerald-400/30 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
                    >
                      Copy bundle JSON
                    </button>
                    <button
                      type="button"
                      onClick={copyProofHash}
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white"
                    >
                      Copy proof hash
                    </button>
                    <button
                      type="button"
                      onClick={downloadProofBundle}
                      className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                    >
                      Download proof bundle
                    </button>
                  </div>
                  {proofBundleActionMessage && (
                    <div className="mt-3 text-sm text-emerald-100/80">{proofBundleActionMessage}</div>
                  )}
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="text-sm font-semibold text-white/90">Payment evidence</div>
                {paymentConfirmation ? (
                  <div className="mt-3 space-y-3 text-sm text-white/78">
                    <div>
                      <div className="text-white/50">Reference</div>
                      <div>{String(paymentConfirmation.reference || "—")}</div>
                    </div>
                    <div>
                      <div className="text-white/50">Method</div>
                      <div>{String(paymentConfirmation.method || "—")}</div>
                    </div>
                    <div>
                      <div className="text-white/50">Confirmed at</div>
                      <div>{paymentConfirmation.confirmed_at ? new Date(paymentConfirmation.confirmed_at).toLocaleString() : "—"}</div>
                    </div>
                    <div>
                      <div className="text-white/50">Amount</div>
                      <div>{paymentConfirmation.payment_amount?.amount || "—"} {paymentConfirmation.payment_amount?.currency || ""}</div>
                    </div>
                    {paymentConfirmation.note && (
                      <div>
                        <div className="text-white/50">Note</div>
                        <div>{String(paymentConfirmation.note)}</div>
                      </div>
                    )}
                    {settlementError && (
                      <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-red-200">
                        <div className="text-red-100">Settlement error</div>
                        <div className="mt-1 text-sm">{String(settlementError)}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-white/55">No payment confirmation recorded yet.</div>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="text-sm font-semibold text-white/90">Receipt items</div>
                {run.receipt.receipt_items.length === 0 ? (
                  <div className="mt-3 text-sm text-white/55">No receipt items.</div>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-white/75">
                    {run.receipt.receipt_items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div id="settlement-trail" className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4 scroll-mt-24">
                <div className="text-sm font-semibold text-white/90">Settlement trail</div>
                {!receiptTrail?.settlement_intent ? (
                  <div className="mt-3 text-sm text-white/55">No settlement receipt trail recorded yet.</div>
                ) : (
                  <div className="mt-3 space-y-4 text-sm text-white/78">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="text-white/50">Settlement intent</div>
                      <div className="mt-1 font-medium text-white/88">{receiptTrail.settlement_intent.intent_type}</div>
                      <div className="mt-2 text-white/60">Status: {receiptTrail.settlement_intent.status}</div>
                      <div className="text-white/60">Amount: {receiptTrail.settlement_intent.amount_value} {receiptTrail.settlement_intent.amount_currency}</div>
                      <div className="text-white/60">Correlation: {receiptTrail.settlement_intent.correlation_id}</div>
                      <div className="text-white/45">Executed: {receiptTrail.settlement_intent.executed_at ? new Date(receiptTrail.settlement_intent.executed_at).toLocaleString() : "—"}</div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/45">Attempts</div>
                        <div className="mt-2 text-lg font-semibold text-white/92">{settlementAttemptStats.total}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/45">Finalized</div>
                        <div className="mt-2 text-lg font-semibold text-emerald-300">{settlementAttemptStats.finalized}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/45">Failed</div>
                        <div className="mt-2 text-lg font-semibold text-red-200">{settlementAttemptStats.failed}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/45">Latest outcome</div>
                        <div className={`mt-2 text-lg font-semibold ${latestSettlementAttempt?.status === "finalized" ? "text-emerald-300" : latestSettlementAttempt?.status === "failed" ? "text-red-200" : "text-amber-200"}`}>
                          {latestSettlementAttempt?.status || "—"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-white/50">Settlement attempts</div>
                      {settlementAttempts.length === 0 ? (
                        <div className="mt-2 text-white/55">No chain receipts linked.</div>
                      ) : (
                        <div className="mt-2 space-y-3">
                          {[...settlementAttempts].reverse().map((item) => (
                            <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="font-medium text-white/88">Attempt #{item.attemptNumber} · {item.chain_id} · {item.status}</div>
                                  <div className="mt-1 text-white/45">Started: {new Date(item.created_at).toLocaleString()}</div>
                                </div>
                                <div className="text-right text-xs text-white/45">Driver: {item.driver}</div>
                              </div>
                              <div className="mt-3 grid gap-2 text-white/60 sm:grid-cols-2">
                                <div>tx: {item.tx_hash || "—"}</div>
                                <div>correlation: {item.correlation_id}</div>
                                <div>payload: {item.payload_hash.slice(0, 16)}…</div>
                                <div>finalized: {item.finalized_at ? new Date(item.finalized_at).toLocaleString() : "—"}</div>
                              </div>
                              {(item.replayed || item.ledgerEventReused) && (
                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                  {item.replayed && <span className="rounded-full border border-amber-400/30 px-2 py-1 text-amber-200">replayed intent</span>}
                                  {item.ledgerEventReused && <span className="rounded-full border border-emerald-400/30 px-2 py-1 text-emerald-200">ledger reused</span>}
                                </div>
                              )}
                              {item.error_message && (
                                <div className="mt-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-red-200">
                                  <div className="text-red-100">Attempt error</div>
                                  <div className="mt-1 text-sm">{item.error_message}</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="text-sm text-white/60">Execution mode</div>
                <div className="mt-1 font-medium text-white/88">{String(run.receipt.proof?.execution_mode || "not_executed")}</div>
                <div className="mt-4 text-sm text-white/60">Executed at</div>
                <div className="mt-1 font-medium text-white/88">{run.receipt.proof?.executed_at ? new Date(run.receipt.proof.executed_at).toLocaleString() : "—"}</div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="text-sm font-semibold text-white/90">Status timeline</div>
                {timeline.length === 0 ? (
                  <div className="mt-3 text-sm text-white/55">No status history yet.</div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {timeline.map((item, index) => (
                      <div key={`${item.changed_at}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm">
                        <div className="text-white/85">{item.from ? `${item.from} → ${item.to}` : `→ ${item.to}`}</div>
                        <div className="mt-1 text-white/45">{new Date(item.changed_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Proof metadata</div>
                <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/78">{JSON.stringify(run.receipt.proof, null, 2)}</pre>
              </div>

              {proofBundle && (
                <div className="mt-6">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Proof bundle JSON</div>
                  <pre className="mt-3 overflow-x-auto rounded-2xl border border-emerald-400/20 bg-black/20 p-4 text-sm text-white/78">{proofBundleText}</pre>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
