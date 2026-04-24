"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { autonomy } from "@/lib/api";

export default function AiCouncilPage() {
  const [subject, setSubject] = useState("");
  const [evidence, setEvidence] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError("");
      const r = await autonomy.councilRecommend(subject, evidence);
      setResult(r);
    } catch (e: any) {
      setError(e?.message || "Failed to get recommendation");
    }
  }

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>AI Council</h1>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
            <input className="input" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <textarea className="input" rows={5} placeholder="Evidence/context" value={evidence} onChange={(e) => setEvidence(e.target.value)} />
            <button className="btn btn-primary" type="submit">Get recommendation</button>
          </form>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Recommendation</h3>
          <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      </main>
    </div>
  );
}

