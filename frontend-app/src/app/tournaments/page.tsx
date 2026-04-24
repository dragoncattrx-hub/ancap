"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { competitions } from "@/lib/api";

export default function TournamentsPage() {
  const [name, setName] = useState("");
  const [tournamentId, setTournamentId] = useState("");
  const [strategyId, setStrategyId] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [error, setError] = useState("");

  async function createTournament(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError("");
      const t = await competitions.createTournament({ name });
      setTournamentId(t.id);
    } catch (e: any) {
      setError(e?.message || "Failed to create tournament");
    }
  }

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError("");
      await competitions.addEntry(tournamentId, { strategy_id: strategyId });
      const lb = await competitions.leaderboard(tournamentId);
      setLeaderboard(lb || []);
    } catch (e: any) {
      setError(e?.message || "Failed to add entry");
    }
  }

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Tournaments</h1>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={createTournament} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="input" placeholder="Tournament name" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-primary" type="submit">Create</button>
          </form>
          <form onSubmit={addEntry} style={{ display: "grid", gap: 8 }}>
            <input className="input" placeholder="Tournament ID" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} />
            <input className="input" placeholder="Strategy ID" value={strategyId} onChange={(e) => setStrategyId(e.target.value)} />
            <button className="btn btn-ghost" type="submit">Add entry + refresh leaderboard</button>
          </form>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Leaderboard</h3>
          <pre style={{ margin: 0, fontSize: 12, overflowX: "auto" }}>{JSON.stringify(leaderboard, null, 2)}</pre>
        </div>
      </main>
    </div>
  );
}

