"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { contracts, milestones } from "@/lib/api";

export default function ContractDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [item, setItem] = useState<any | null>(null);
  const [payments, setPayments] = useState<any | null>(null);
  const [runs, setRuns] = useState<any[] | null>(null);
  const [activity, setActivity] = useState<any[] | null>(null);
  const [milestonesList, setMilestonesList] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [milestoneActionLoading, setMilestoneActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await contracts.get(id);
      setItem(data);
      try {
        const p = await contracts.getPayments(id);
        setPayments(p);
      } catch {
        setPayments(null);
      }
      try {
        const r = await contracts.getRuns(id, 50);
        setRuns(r?.items || []);
      } catch {
        setRuns(null);
      }
      try {
        const a = await contracts.getActivity(id, 200);
        setActivity(a?.items || []);
      } catch {
        setActivity(null);
      }
      try {
        const ms = await milestones.list(id, 200);
        setMilestonesList(ms?.items || []);
      } catch {
        setMilestonesList(null);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated, id]);

  const doAction = async (kind: "propose" | "accept" | "cancel" | "complete" | "dispute") => {
    if (!id) return;
    try {
      setActionLoading(kind);
      setError(null);
      if (kind === "propose") await contracts.propose(id);
      if (kind === "accept") await contracts.accept(id);
      if (kind === "cancel") await contracts.cancel(id);
      if (kind === "complete") await contracts.complete(id);
      if (kind === "dispute") await contracts.dispute(id);
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setActionLoading(null);
    }
  };

  const doMilestoneAction = async (milestoneId: string, kind: "submit" | "accept" | "reject" | "cancel") => {
    try {
      setMilestoneActionLoading(`${kind}:${milestoneId}`);
      setError(null);
      if (kind === "submit") await milestones.submit(milestoneId);
      if (kind === "accept") await milestones.accept(milestoneId);
      if (kind === "reject") await milestones.reject(milestoneId);
      if (kind === "cancel") await milestones.cancel(milestoneId);
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setMilestoneActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <NetworkBackground />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <button className="btn btn-ghost mb-4" onClick={() => router.push("/contracts")}>
          ← Back to contracts
        </button>
        {loading && <div>Loading contract...</div>}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        {!loading && item && (
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h1 className="card-title">{item.title}</h1>
              {item.description && (
                <p className="text-sm text-base-content/80 whitespace-pre-line">
                  {item.description}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <div className="font-semibold mb-1">Meta</div>
                  <div>Status: {item.status}</div>
                  <div>Payment: {item.payment_model}</div>
                  {item.fixed_amount_value && (
                    <div>
                      Amount: {item.fixed_amount_value} {item.currency || "VUSD"}
                    </div>
                  )}
                  {item.max_runs != null && (
                    <div>Max runs: {item.max_runs}</div>
                  )}
                  <div>Scope: {item.scope_type}</div>
                  {item.scope_ref_id && <div>Scope ref: {item.scope_ref_id}</div>}
                  <div>Employer agent: {item.employer_agent_id}</div>
                  <div>Worker agent: {item.worker_agent_id}</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Lifecycle</div>
                  <div>Created at: {item.created_at ? new Date(item.created_at).toLocaleString() : ""}</div>
                  <div>Updated at: {item.updated_at ? new Date(item.updated_at).toLocaleString() : ""}</div>
                </div>
              </div>
              {payments && (
                <>
                  <div className="divider" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-semibold mb-1">Payments</div>
                      <div>
                        Escrowed: {payments.escrowed_total} {payments.currency || item.currency || "VUSD"}
                      </div>
                      <div>
                        Paid: {payments.paid_total} {payments.currency || item.currency || "VUSD"}
                      </div>
                      <div>
                        Pending: {payments.pending_total} {payments.currency || item.currency || "VUSD"}
                      </div>
                    </div>
                  </div>
                </>
              )}
              {runs && (
                <>
                  <div className="divider" />
                  <div className="text-sm">
                    <div className="font-semibold mb-2">Runs</div>
                    {runs.length === 0 ? (
                      <div className="text-base-content/70">No runs yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Run</th>
                              <th>State</th>
                              <th>Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {runs.map((r) => (
                              <tr key={r.id}>
                                <td className="font-mono text-xs">{r.id}</td>
                                <td>{r.state}</td>
                                <td>{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
              {milestonesList && (
                <>
                  <div className="divider" />
                  <div className="text-sm">
                    <div className="font-semibold mb-2">Milestones</div>
                    {milestonesList.length === 0 ? (
                      <div className="text-base-content/70">No milestones yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {milestonesList
                          .slice()
                          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                          .map((m) => {
                            const canSubmit = item.status === "active" && m.status !== "paid" && m.status !== "cancelled";
                            const canAccept = item.status === "active" && (m.status === "submitted" || m.status === "active");
                            const canReject = item.status === "active" && (m.status === "submitted" || m.status === "active");
                            const canCancel = m.status !== "paid" && m.status !== "cancelled";
                            return (
                              <div key={m.id} className="p-3 rounded bg-base-200/60">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <div className="font-semibold">
                                      #{m.order_index} {m.title}{" "}
                                      <span className="badge badge-outline ml-2">{m.status}</span>
                                    </div>
                                    <div className="text-xs text-base-content/70 mt-1">
                                      Amount: {m.amount_value} {m.currency || item.currency || "VUSD"}{" "}
                                      {m.required_runs != null ? `• Runs: ${m.completed_runs}/${m.required_runs}` : ""}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      className="btn btn-ghost btn-xs"
                                      onClick={() =>
                                        router.push(
                                          `/runs/new?contract_id=${encodeURIComponent(item.id)}&contract_milestone_id=${encodeURIComponent(
                                            m.id,
                                          )}` +
                                            (item.scope_type === "strategy_version" && item.scope_ref_id
                                              ? `&strategy_version_id=${encodeURIComponent(item.scope_ref_id)}`
                                              : ""),
                                        )
                                      }
                                    >
                                      Run under milestone
                                    </button>
                                    <button
                                      className="btn btn-outline btn-xs"
                                      disabled={!canSubmit || milestoneActionLoading === `submit:${m.id}`}
                                      onClick={() => doMilestoneAction(m.id, "submit")}
                                    >
                                      {milestoneActionLoading === `submit:${m.id}` ? "Submitting..." : "Submit"}
                                    </button>
                                    <button
                                      className="btn btn-success btn-xs"
                                      disabled={!canAccept || milestoneActionLoading === `accept:${m.id}`}
                                      onClick={() => doMilestoneAction(m.id, "accept")}
                                    >
                                      {milestoneActionLoading === `accept:${m.id}` ? "Accepting..." : "Accept"}
                                    </button>
                                    <button
                                      className="btn btn-warning btn-xs"
                                      disabled={!canReject || milestoneActionLoading === `reject:${m.id}`}
                                      onClick={() => doMilestoneAction(m.id, "reject")}
                                    >
                                      {milestoneActionLoading === `reject:${m.id}` ? "Rejecting..." : "Reject"}
                                    </button>
                                    <button
                                      className="btn btn-outline btn-xs"
                                      disabled={!canCancel || milestoneActionLoading === `cancel:${m.id}`}
                                      onClick={() => doMilestoneAction(m.id, "cancel")}
                                    >
                                      {milestoneActionLoading === `cancel:${m.id}` ? "Cancelling..." : "Cancel"}
                                    </button>
                                  </div>
                                </div>
                                {m.description ? (
                                  <div className="text-xs text-base-content/80 mt-2 whitespace-pre-wrap">
                                    {m.description}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </>
              )}
              {activity && (
                <>
                  <div className="divider" />
                  <div className="text-sm">
                    <div className="font-semibold mb-2">Activity</div>
                    {activity.length === 0 ? (
                      <div className="text-base-content/70">No activity yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {activity.slice(0, 50).map((ev, idx) => (
                          <div key={`${ev.kind}-${idx}`} className="p-2 rounded bg-base-200/60">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-semibold">{ev.kind}</div>
                              <div className="text-xs text-base-content/70">
                                {ev.ts ? new Date(ev.ts).toLocaleString() : ""}
                              </div>
                            </div>
                            <pre className="text-xs whitespace-pre-wrap text-base-content/80 mt-1">
                              {JSON.stringify(ev.data ?? {}, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              <div className="divider" />
              <div className="flex flex-wrap gap-2">
                {item.status === "draft" && (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!!actionLoading}
                    onClick={() => doAction("propose")}
                  >
                    {actionLoading === "propose" ? "Proposing..." : "Propose"}
                  </button>
                )}
                {item.status === "proposed" && (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!!actionLoading}
                    onClick={() => doAction("accept")}
                  >
                    {actionLoading === "accept" ? "Accepting..." : "Accept"}
                  </button>
                )}
                {(item.status === "draft" ||
                  item.status === "proposed" ||
                  item.status === "active" ||
                  item.status === "paused") && (
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={!!actionLoading}
                    onClick={() => doAction("cancel")}
                  >
                    {actionLoading === "cancel" ? "Cancelling..." : "Cancel"}
                  </button>
                )}
                {item.status === "active" && (
                  <button
                    className="btn btn-success btn-sm"
                    disabled={!!actionLoading}
                    onClick={() => doAction("complete")}
                  >
                    {actionLoading === "complete" ? "Completing..." : "Mark completed & payout"}
                  </button>
                )}
                {(item.status === "active" || item.status === "completed") && (
                  <button
                    className="btn btn-warning btn-sm"
                    disabled={!!actionLoading}
                    onClick={() => doAction("dispute")}
                  >
                    {actionLoading === "dispute" ? "Disputing..." : "Open dispute"}
                  </button>
                )}
                {item.status === "active" && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      router.push(
                        item.scope_type === "strategy_version"
                          ? `/runs/new?contract_id=${encodeURIComponent(item.id)}&strategy_version_id=${encodeURIComponent(
                              item.scope_ref_id || "",
                            )}`
                          : `/runs/new?contract_id=${encodeURIComponent(item.id)}`,
                      )
                    }
                  >
                    Launch run under contract
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

