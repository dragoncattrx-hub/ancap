"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { SiteLegalFooter } from "@/components/legal/LegalViews";
import { apiFetch, formatNetworkError } from "@/lib/api";

type DeliveryJob = {
  id: string;
  pickup_label: string;
  dropoff_label: string;
  amount_acp: string;
  status: string;
  robot_agent_id?: string | null;
};

export default function RobotDeliveryPage() {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [amount, setAmount] = useState("10");

  async function refresh() {
    try {
      const data = await apiFetch("/robot-ops/delivery/jobs");
      setJobs(Array.isArray(data) ? data : []);
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
      await apiFetch("/robot-ops/delivery/jobs", {
        method: "POST",
        body: JSON.stringify({
          pickup_label: pickup,
          dropoff_label: dropoff,
          amount_acp: amount,
        }),
      });
      setPickup("");
      setDropoff("");
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
        <div className="section-num">ROBOT DELIVERY</div>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 850, margin: "10px 0 14px" }}>
          Courier jobs for delivery robots
        </h1>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 22, maxWidth: 720 }}>
          Uber-like matching for food couriers and cyborg agents — separate from the AI strategy{" "}
          <Link href="/marketplace">marketplace</Link>. Pay in ACP after a human-confirmed assign/complete flow.
        </p>

        <form onSubmit={onCreate} className="card" style={{ borderRadius: 8, marginBottom: 22 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Create job</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <input
              required
              placeholder="Pickup"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}
            />
            <input
              required
              placeholder="Dropoff"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}
            />
            <input
              required
              placeholder="Amount ACP"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}
            />
            <button className="btn btn-primary" disabled={busy} type="submit">
              {busy ? "Creating…" : "Post delivery job"}
            </button>
          </div>
          {error ? <p style={{ color: "salmon", marginTop: 12 }}>{error}</p> : null}
        </form>

        <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Open / active</h2>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {jobs.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No open jobs yet.</p>
          ) : (
            jobs.map((job) => (
              <article key={job.id} className="card" style={{ borderRadius: 8 }}>
                <div style={{ fontWeight: 700 }}>
                  {job.pickup_label} → {job.dropoff_label}
                </div>
                <div style={{ color: "var(--text-muted)", marginTop: 6 }}>
                  {job.amount_acp} ACP · {job.status}
                  {job.robot_agent_id ? ` · robot ${job.robot_agent_id}` : ""}
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
