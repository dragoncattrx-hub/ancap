"use client";

import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { referrals } from "@/lib/api";

function formatAmount(value: any): string {
  if (value === null || value === undefined) return "0";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

export default function ReferralsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [attributions, setAttributions] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copyState, setCopyState] = useState<"" | "copied">("");

  const referralLink = useMemo(() => {
    if (!code) return "";
    if (typeof window === "undefined") return `https://ancap.cloud/register?ref=${encodeURIComponent(code)}`;
    return `${window.location.origin}/register?ref=${encodeURIComponent(code)}`;
  }, [code]);

  async function loadAll() {
    try {
      setError("");
      const [s, attrs, rw] = await Promise.all([
        referrals.mySummary(),
        referrals.listMyAttributions(50),
        referrals.listMyRewards(50),
      ]);
      setSummary(s || null);
      setAttributions(attrs || []);
      setRewards(rw || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load referral cabinet");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createCode() {
    try {
      setBusy(true);
      setError("");
      const out = await referrals.createCode();
      setCode(out?.code || "");
    } catch (e: any) {
      setError(e?.message || "Failed to create referral code");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopyState("copied");
      setTimeout(() => setCopyState(""), 1400);
    } catch {
      setError("Could not copy the referral link. Please copy it manually.");
    }
  }

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div>
            <h1 className="section-title">Referral Cabinet</h1>
            <p className="section-subtitle">
              Invite partners, track referrals, and monitor your ACP rewards in one place.
            </p>
          </div>
          <div className="action-cluster">
            <button className="btn btn-primary" onClick={createCode} disabled={busy}>
              {busy ? "Creating..." : code ? "Create another code" : "Create referral code"}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="grid md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Your referral link</h3>
            <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
              Reward policy: 100 ACP per verified referral + 30% lifetime share of platform commissions.
            </p>
            {referralLink ? (
              <>
                <input className="input" value={referralLink} readOnly />
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button className="btn btn-ghost" onClick={copyLink}>Copy link</button>
                  {copyState === "copied" && <span style={{ color: "var(--color-success)" }}>Copied</span>}
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>
                Create a referral code to generate your personal invitation link.
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>ACP rewards</h3>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              <div>Total ACP rewards: {formatAmount(summary?.total_reward_acp_amount)} ACP</div>
              <div>Verified referral bonus: {formatAmount(summary?.signup_bonus_acp_amount)} ACP</div>
              <div>Commission share rewards: {formatAmount(summary?.commission_share_acp_amount)} ACP</div>
              <div>Total reward events: {summary?.total_reward_events ?? 0}</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Referral status</h3>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              <div>Total attributions: {summary?.total_attributions ?? 0}</div>
              <div>Pending: {summary?.pending ?? 0}</div>
              <div>Eligible: {summary?.eligible ?? 0}</div>
              <div>Rewarded: {summary?.rewarded ?? 0}</div>
              <div>Rejected: {summary?.rejected ?? 0}</div>
            </div>
            <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 13 }}>
              Last attributions: {attributions.length}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Recent referral payouts</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((x) => (
                    <tr key={x.id}>
                      <td>{x.created_at ? new Date(x.created_at).toLocaleString() : "-"}</td>
                      <td>{x.trigger_type}</td>
                      <td>{formatAmount(x.amount_value)} {x.currency}</td>
                    </tr>
                  ))}
                  {!rewards.length && (
                    <tr>
                      <td colSpan={3} style={{ color: "var(--text-muted)" }}>
                        No referral payouts yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
