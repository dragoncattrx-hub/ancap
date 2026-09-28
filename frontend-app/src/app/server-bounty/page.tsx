"use client";

import { FormEvent, useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { SiteLegalFooter } from "@/components/legal/LegalViews";
import { apiFetch, formatNetworkError } from "@/lib/api";

type BountyRow = {
  id: string;
  host_label: string;
  payout_address: string;
  amount_acp: string;
  status: string;
  proof_url?: string | null;
};

export default function ServerBountyPage() {
  const [rows, setRows] = useState<BountyRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [host, setHost] = useState("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("50");
  const [proof, setProof] = useState("");

  async function refresh() {
    try {
      const data = await apiFetch("/robot-ops/server-install-bounties/mine");
      setRows(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(formatNetworkError(err).message);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch("/robot-ops/server-install-bounties", {
        method: "POST",
        body: JSON.stringify({
          host_label: host,
          payout_address: address,
          amount_acp: amount,
          proof_url: proof || undefined,
        }),
      });
      setHost("");
      setProof("");
      await refresh();
    } catch (err) {
      setError(formatNetworkError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <Navigation />
      <main className="container" style={{ padding: "48px 24px 72px", maxWidth: 880 }}>
        <div className="section-num">SERVER INSTALL</div>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 850, margin: "10px 0 14px" }}>
          ACP payout for verified installs
        </h1>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 22, maxWidth: 720 }}>
          Submit proof that you installed an ANCAP-compatible server node. Payouts stay pending until an
          operator verifies proof — Theodore and other agents cannot approve crypto payouts alone.
        </p>

        <form onSubmit={onCreate} className="card" style={{ borderRadius: 8, marginBottom: 22 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <input
              required
              placeholder="Host label"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}
            />
            <input
              required
              placeholder="ACP payout address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}
            />
            <input
              required
              placeholder="Amount ACP"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}
            />
            <input
              placeholder="Proof URL (optional)"
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}
            />
            <button className="btn btn-primary" disabled={busy} type="submit">
              {busy ? "Submitting…" : "Submit bounty request"}
            </button>
          </div>
          {error ? <p style={{ color: "salmon", marginTop: 12 }}>{error}</p> : null}
        </form>

        <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Your requests</h2>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {rows.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No bounty requests yet.</p>
          ) : (
            rows.map((row) => (
              <article key={row.id} className="card" style={{ borderRadius: 8 }}>
                <div style={{ fontWeight: 700 }}>{row.host_label}</div>
                <div style={{ color: "var(--text-muted)", marginTop: 6 }}>
                  {row.amount_acp} ACP · {row.status} · {row.payout_address}
                </div>
              </article>
            ))
          )}
        </div>
      </main>
      <SiteLegalFooter />
    </div>
  );
}
