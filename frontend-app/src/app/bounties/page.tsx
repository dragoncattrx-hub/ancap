"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { bounties } from "@/lib/api";

export default function BountiesPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const rows = await bounties.listReports(100);
      setItems(rows || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load reports");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError("");
      await bounties.createReport({ title, description, severity });
      setTitle("");
      setDescription("");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to submit report");
    }
  }

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Bug Bounty</h1>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
            <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="input" rows={5} placeholder="Describe reproduction steps" value={description} onChange={(e) => setDescription(e.target.value)} />
            <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
            <button className="btn btn-primary" type="submit">Submit report</button>
          </form>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>My reports</h3>
            <button className="btn btn-ghost" onClick={load}>Refresh</button>
          </div>
          <pre style={{ margin: 0, fontSize: 12, overflowX: "auto" }}>{JSON.stringify(items, null, 2)}</pre>
        </div>
      </main>
    </div>
  );
}

