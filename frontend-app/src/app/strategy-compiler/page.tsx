"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { autonomy } from "@/lib/api";

export default function StrategyCompilerPage() {
  const [prompt, setPrompt] = useState("");
  const [compiled, setCompiled] = useState<any>(null);
  const [error, setError] = useState("");

  async function compile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError("");
      const out = await autonomy.compileStrategy(prompt);
      setCompiled(out);
    } catch (e: any) {
      setError(e?.message || "Compiler failed");
    }
  }

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>NL Strategy Compiler (Beta)</h1>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={compile} style={{ display: "grid", gap: 8 }}>
            <textarea className="input" rows={6} placeholder="Describe strategy in natural language" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <button className="btn btn-primary" type="submit">Compile</button>
          </form>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Generated spec</h3>
          <pre style={{ margin: 0, fontSize: 12, overflowX: "auto" }}>{JSON.stringify(compiled, null, 2)}</pre>
        </div>
      </main>
    </div>
  );
}

