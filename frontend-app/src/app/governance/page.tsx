"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { governance } from "@/lib/api";

type Proposal = {
  id: string;
  kind: string;
  target_type: string;
  target_id?: string | null;
  payload_json: Record<string, any>;
  status: "draft" | "review" | "active" | "rejected" | "appealed";
  created_by?: string | null;
  reviewed_by?: string | null;
  decision_reason?: string | null;
  created_at: string;
  updated_at: string;
};

type AuditEvent = {
  id: string;
  event_type: string;
  actor_type: string;
  actor_id?: string | null;
  event_json: Record<string, any>;
  created_at: string;
};

type ModerationCase = {
  id: string;
  subject_type: string;
  subject_id: string;
  reason_code: string;
  status: "open" | "resolved" | "appealed" | "rejected";
  resolution?: string | null;
  created_at: string;
  resolved_at?: string | null;
};

type DiffLine = { type: "add" | "remove" | "info"; text: string };

const defaultProposalForm = {
  kind: "policy_update",
  target_type: "policy",
  target_id: "",
  payload_json: "{}",
};

const defaultCaseForm = {
  subject_type: "agent",
  subject_id: "",
  reason_code: "policy_violation",
};

function stableJson(value: Record<string, any> | null | undefined): string {
  return JSON.stringify(value || {}, Object.keys(value || {}).sort(), 2);
}

function buildPayloadDiff(
  prevPayload: Record<string, any> | null | undefined,
  currPayload: Record<string, any> | null | undefined
): DiffLine[] {
  const prev = prevPayload || {};
  const curr = currPayload || {};
  const keys = Array.from(new Set([...Object.keys(prev), ...Object.keys(curr)])).sort();
  const lines: DiffLine[] = [];
  for (const key of keys) {
    const a = JSON.stringify(prev[key]);
    const b = JSON.stringify(curr[key]);
    if (a === b) continue;
    if (key in prev) lines.push({ type: "remove", text: `- ${key}: ${a}` });
    if (key in curr) lines.push({ type: "add", text: `+ ${key}: ${b}` });
  }
  return lines.length ? lines : [{ type: "info", text: "No changes vs previous proposal payload." }];
}

export default function GovernancePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [proposalStatusFilter, setProposalStatusFilter] = useState("all");
  const [caseStatusFilter, setCaseStatusFilter] = useState("all");
  const [proposalSearch, setProposalSearch] = useState("");
  const [caseSearch, setCaseSearch] = useState("");

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string>("");
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [caseActionReason, setCaseActionReason] = useState<Record<string, string>>({});

  const [proposalForm, setProposalForm] = useState(defaultProposalForm);
  const [caseForm, setCaseForm] = useState(defaultCaseForm);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const selectedProposal = useMemo(
    () => proposals.find((p) => p.id === selectedProposalId) || null,
    [proposals, selectedProposalId]
  );

  const previousComparableProposal = useMemo(() => {
    if (!selectedProposal) return null;
    const sameTarget = proposals
      .filter(
        (p) =>
          p.id !== selectedProposal.id &&
          p.target_type === selectedProposal.target_type &&
          (p.target_id || null) === (selectedProposal.target_id || null)
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sameTarget[0] || null;
  }, [proposals, selectedProposal]);

  const selectedPayloadDiffLines = useMemo(() => {
    if (!selectedProposal) return [] as DiffLine[];
    return buildPayloadDiff(previousComparableProposal?.payload_json, selectedProposal.payload_json);
  }, [previousComparableProposal, selectedProposal]);

  const filteredProposals = useMemo(() => {
    const q = proposalSearch.trim().toLowerCase();
    if (!q) return proposals;
    return proposals.filter(
      (p) =>
        p.kind.toLowerCase().includes(q) ||
        p.target_type.toLowerCase().includes(q) ||
        (p.target_id || "").toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
    );
  }, [proposalSearch, proposals]);

  const filteredCases = useMemo(() => {
    const q = caseSearch.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        c.subject_type.toLowerCase().includes(q) ||
        c.reason_code.toLowerCase().includes(q) ||
        c.subject_id.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
    );
  }, [caseSearch, cases]);

  async function loadAll() {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError("");
      const [proposalList, caseList] = await Promise.all([
        governance.listProposals(proposalStatusFilter, 200),
        governance.listModerationCases(caseStatusFilter, 200),
      ]);
      const items = proposalList?.items || [];
      setProposals(items);
      if (!selectedProposalId && items[0]?.id) {
        setSelectedProposalId(items[0].id);
      } else if (selectedProposalId && !items.find((x: Proposal) => x.id === selectedProposalId)) {
        setSelectedProposalId(items[0]?.id || "");
      }
      setCases(caseList?.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load governance data");
    } finally {
      setLoading(false);
    }
  }

  async function loadAudit(proposalId: string) {
    if (!proposalId) {
      setAuditEvents([]);
      return;
    }
    try {
      const r = await governance.getProposalAudit(proposalId, 300);
      setAuditEvents(r?.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load audit trail");
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, proposalStatusFilter, caseStatusFilter]);

  useEffect(() => {
    if (selectedProposalId) {
      loadAudit(selectedProposalId);
    } else {
      setAuditEvents([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProposalId]);

  async function createProposal() {
    try {
      setError("");
      let payload: Record<string, any> = {};
      try {
        payload = proposalForm.payload_json ? JSON.parse(proposalForm.payload_json) : {};
      } catch {
        setError("payload_json must be valid JSON");
        return;
      }
      await governance.createProposal({
        kind: proposalForm.kind.trim(),
        target_type: proposalForm.target_type.trim(),
        target_id: proposalForm.target_id.trim() || undefined,
        payload_json: payload,
      });
      setProposalForm(defaultProposalForm);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Failed to create proposal");
    }
  }

  async function submitProposal(id: string) {
    try {
      setError("");
      await governance.submitProposal(id);
      await loadAll();
      await loadAudit(id);
    } catch (e: any) {
      setError(e?.message || "Failed to submit proposal");
    }
  }

  async function voteProposal(id: string, vote: "approve" | "reject" | "abstain") {
    try {
      setError("");
      await governance.voteProposal(id, vote);
      await loadAudit(id);
    } catch (e: any) {
      setError(e?.message || "Failed to vote proposal");
    }
  }

  async function decideProposal(id: string, decision: "active" | "rejected" | "appealed") {
    try {
      setError("");
      let reason: string | undefined = undefined;
      if (decision === "rejected" || decision === "appealed") {
        const raw = window.prompt(`Reason is required for decision "${decision}"`, "");
        reason = (raw || "").trim();
        if (!reason) {
          setError(`Reason is required for decision "${decision}"`);
          return;
        }
      }
      await governance.decideProposal(id, decision, reason);
      await loadAll();
      await loadAudit(id);
    } catch (e: any) {
      setError(e?.message || "Failed to decide proposal");
    }
  }

  async function openCase() {
    try {
      setError("");
      await governance.openModerationCase({
        subject_type: caseForm.subject_type,
        subject_id: caseForm.subject_id.trim(),
        reason_code: caseForm.reason_code.trim(),
      });
      setCaseForm(defaultCaseForm);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Failed to open moderation case");
    }
  }

  async function resolveCase(id: string, status: "resolved" | "appealed" | "rejected") {
    try {
      setError("");
      await governance.resolveModerationCase(id, status);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Failed to resolve moderation case");
    }
  }

  async function applyCaseAction(
    c: ModerationCase,
    action: "quarantine" | "unquarantine" | "ban"
  ) {
    try {
      setError("");
      if (!["agent", "strategy", "listing", "vertical", "pool"].includes(c.subject_type)) {
        setError(`Unsupported moderation action target_type: ${c.subject_type}`);
        return;
      }
      const customReason = (caseActionReason[c.id] || "").trim();
      const mappedAction = action === "ban" ? "suspend" : action;
      if (action === "ban") {
        if (!customReason) {
          setError("Reason is required for Ban action");
          return;
        }
        const ok = window.confirm(
          `Ban subject ${c.subject_type}:${c.subject_id}? This will send suspend action.`
        );
        if (!ok) return;
      }
      await governance.applyModerationAction({
        target_type: c.subject_type as "agent" | "strategy" | "listing" | "vertical" | "pool",
        target_id: c.subject_id,
        action: mappedAction,
        reason: customReason || `case:${c.id}:${c.reason_code}`,
      });
      await loadAll();
    } catch (e: any) {
      setError(e?.message || "Failed to apply moderation action");
    }
  }

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <NetworkBackground />
      <div className="page-shell">
        <Navigation />
        <div className="container" style={{ padding: "40px 24px 56px" }}>
          <div className="section-header">
            <h1 className="section-title">Governance</h1>
            <button className="btn btn-ghost" type="button" onClick={loadAll}>
              Refresh
            </button>
          </div>
          <div className="section-subtitle">
            Proposals lifecycle, immutable audit trail and moderation cases.
          </div>

          {error && (
            <div className="card" style={{ borderColor: "rgba(239,68,68,0.35)", marginBottom: 18 }}>
              <div style={{ color: "#fca5a5" }}>{error}</div>
            </div>
          )}

          <div className="responsive-grid responsive-grid-2" style={{ marginBottom: 18 }}>
            <div className="card">
              <h3 style={{ marginTop: 0, marginBottom: 10 }}>Create proposal</h3>
              <div style={{ display: "grid", gap: 12 }}>
                <input
                  className="input input-bordered w-full"
                  placeholder="kind (policy_update)"
                  value={proposalForm.kind}
                  onChange={(e) => setProposalForm((p) => ({ ...p, kind: e.target.value }))}
                />
                <input
                  className="input input-bordered w-full"
                  placeholder="target_type (policy|vertical|system)"
                  value={proposalForm.target_type}
                  onChange={(e) => setProposalForm((p) => ({ ...p, target_type: e.target.value }))}
                />
                <input
                  className="input input-bordered w-full"
                  placeholder="target_id (optional UUID)"
                  value={proposalForm.target_id}
                  onChange={(e) => setProposalForm((p) => ({ ...p, target_id: e.target.value }))}
                />
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="payload_json"
                  rows={6}
                  value={proposalForm.payload_json}
                  onChange={(e) => setProposalForm((p) => ({ ...p, payload_json: e.target.value }))}
                />
                <button className="btn btn-primary" type="button" onClick={createProposal}>
                  Create proposal
                </button>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0, marginBottom: 10 }}>Open moderation case</h3>
              <div style={{ display: "grid", gap: 12 }}>
                <input
                  className="input input-bordered w-full"
                  placeholder="subject_type (agent|strategy|listing|vertical|policy)"
                  value={caseForm.subject_type}
                  onChange={(e) => setCaseForm((p) => ({ ...p, subject_type: e.target.value }))}
                />
                <input
                  className="input input-bordered w-full"
                  placeholder="subject_id (UUID)"
                  value={caseForm.subject_id}
                  onChange={(e) => setCaseForm((p) => ({ ...p, subject_id: e.target.value }))}
                />
                <input
                  className="input input-bordered w-full"
                  placeholder="reason_code"
                  value={caseForm.reason_code}
                  onChange={(e) => setCaseForm((p) => ({ ...p, reason_code: e.target.value }))}
                />
                <button className="btn btn-primary" type="button" onClick={openCase}>
                  Open case
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ color: "var(--text-muted)", padding: "24px 0" }}>Loading governance data...</div>
          ) : (
            <div className="responsive-grid responsive-grid-2">
              <div className="card">
                <div className="section-header" style={{ marginBottom: 10 }}>
                  <h3 style={{ margin: 0 }}>Proposals</h3>
                  <div className="toolbar-row">
                    <input
                      className="input input-bordered"
                      style={{ minWidth: 220 }}
                      placeholder="Search proposals"
                      value={proposalSearch}
                      onChange={(e) => setProposalSearch(e.target.value)}
                    />
                    <select
                      className="select select-bordered"
                      style={{ minWidth: 128, height: 40 }}
                      value={proposalStatusFilter}
                      onChange={(e) => setProposalStatusFilter(e.target.value)}
                    >
                      <option value="all">all</option>
                      <option value="draft">draft</option>
                      <option value="review">review</option>
                      <option value="active">active</option>
                      <option value="rejected">rejected</option>
                      <option value="appealed">appealed</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 10, maxHeight: 500, overflowY: "auto" }}>
                  {filteredProposals.map((p) => (
                    <button
                      key={p.id}
                      className="btn btn-ghost"
                      style={{
                        justifyContent: "space-between",
                        minHeight: 48,
                        border: selectedProposalId === p.id ? "1px solid rgba(16,185,129,0.45)" : "1px solid var(--border)",
                        background: selectedProposalId === p.id ? "rgba(16,185,129,0.08)" : undefined,
                      }}
                      onClick={() => setSelectedProposalId(p.id)}
                    >
                      <span style={{ textAlign: "left" }}>
                        {p.kind} · {p.target_type}
                      </span>
                      <span className="badge badge-info">{p.status}</span>
                    </button>
                  ))}
                  {filteredProposals.length === 0 && <div style={{ color: "var(--text-muted)" }}>No proposals.</div>}
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginTop: 0, marginBottom: 10 }}>Selected proposal details</h3>
                {!selectedProposal ? (
                  <div style={{ color: "var(--text-muted)" }}>Select a proposal.</div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {selectedProposal.id} · {new Date(selectedProposal.created_at).toLocaleString()}
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ fontWeight: 700 }}>Payload</div>
                      <pre style={{ margin: 0, padding: 10, borderRadius: 10, border: "1px solid var(--border)", overflowX: "auto" }}>
                        {stableJson(selectedProposal.payload_json)}
                      </pre>
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ fontWeight: 700 }}>
                        Payload diff
                        {previousComparableProposal ? ` vs ${previousComparableProposal.id.slice(0, 8)}` : " (no baseline)"}
                      </div>
                      <div style={{ margin: 0, padding: 12, borderRadius: 12, border: "1px solid var(--border)", overflowX: "auto", fontFamily: "monospace", fontSize: 13, background: "rgba(255,255,255,0.01)" }}>
                        {selectedPayloadDiffLines.map((line, idx) => (
                          <div
                            key={`${line.text}-${idx}`}
                            style={{
                              color:
                                line.type === "add"
                                  ? "#34d399"
                                  : line.type === "remove"
                                    ? "#f87171"
                                    : "var(--text-muted)",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {line.text}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="action-cluster">
                      {selectedProposal.status === "draft" && (
                        <button className="btn btn-primary" type="button" onClick={() => submitProposal(selectedProposal.id)}>
                          Submit
                        </button>
                      )}
                      {selectedProposal.status === "review" && (
                        <>
                          <button className="btn btn-primary" type="button" onClick={() => voteProposal(selectedProposal.id, "approve")}>
                            Vote approve
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => voteProposal(selectedProposal.id, "reject")}>
                            Vote reject
                          </button>
                          <button className="btn btn-primary" type="button" onClick={() => decideProposal(selectedProposal.id, "active")}>
                            Decide active
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => decideProposal(selectedProposal.id, "rejected")}>
                            Decide reject
                          </button>
                        </>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>Audit trail</div>
                      <div style={{ display: "grid", gap: 10, maxHeight: 240, overflowY: "auto" }}>
                        {auditEvents.map((e) => (
                          <div key={e.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 10, background: "rgba(255,255,255,0.01)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <strong>{e.event_type}</strong>
                              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                                {new Date(e.created_at).toLocaleString()}
                              </span>
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                              actor: {e.actor_type} {e.actor_id || "-"}
                            </div>
                            <pre style={{ margin: "6px 0 0", fontSize: 12, overflowX: "auto" }}>
                              {JSON.stringify(e.event_json || {}, null, 2)}
                            </pre>
                          </div>
                        ))}
                        {auditEvents.length === 0 && <div style={{ color: "var(--text-muted)" }}>No audit events.</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="card" style={{ gridColumn: "1 / -1" }}>
                <div className="section-header" style={{ marginBottom: 10 }}>
                  <h3 style={{ margin: 0 }}>Moderation cases</h3>
                  <div className="toolbar-row">
                    <input
                      className="input input-bordered"
                      style={{ minWidth: 220 }}
                      placeholder="Search moderation cases"
                      value={caseSearch}
                      onChange={(e) => setCaseSearch(e.target.value)}
                    />
                    <select
                      className="select select-bordered"
                      style={{ minWidth: 128, height: 40 }}
                      value={caseStatusFilter}
                      onChange={(e) => setCaseStatusFilter(e.target.value)}
                    >
                      <option value="all">all</option>
                      <option value="open">open</option>
                      <option value="resolved">resolved</option>
                      <option value="appealed">appealed</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {filteredCases.map((c) => (
                    <div key={c.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, background: "rgba(255,255,255,0.01)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{c.subject_type} · {c.reason_code}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{c.subject_id}</div>
                        </div>
                        <span className="badge badge-warning">{c.status}</span>
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 6 }}>
                        Created: {new Date(c.created_at).toLocaleString()}
                        {c.resolved_at ? ` · Resolved: ${new Date(c.resolved_at).toLocaleString()}` : ""}
                      </div>
                      {c.status === "open" && (
                        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                          <input
                            className="input input-bordered w-full"
                            placeholder="Action reason (optional)"
                            value={caseActionReason[c.id] || ""}
                            onChange={(e) =>
                              setCaseActionReason((p) => ({
                                ...p,
                                [c.id]: e.target.value,
                              }))
                            }
                          />
                          <div className="action-cluster">
                          <button className="btn btn-primary" type="button" onClick={() => applyCaseAction(c, "quarantine")}>
                            Quarantine
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => applyCaseAction(c, "unquarantine")}>
                            Unquarantine
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => applyCaseAction(c, "ban")}>
                            Ban
                          </button>
                          <button className="btn btn-primary" type="button" onClick={() => resolveCase(c.id, "resolved")}>
                            Resolve
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => resolveCase(c.id, "rejected")}>
                            Reject
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => resolveCase(c.id, "appealed")}>
                            Appeal
                          </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredCases.length === 0 && <div style={{ color: "var(--text-muted)" }}>No moderation cases.</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
