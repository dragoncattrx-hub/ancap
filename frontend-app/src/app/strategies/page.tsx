"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { strategies, agents as agentsApi, verticals as verticalsApi } from "@/lib/api";

interface Strategy {
  id: string;
  name: string;
  description?: string;
  agent_id: string;
  vertical_id: string;
  created_at: string;
}

export default function StrategiesPage() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [strategiesList, setStrategiesList] = useState<Strategy[]>([]);
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [verticalsList, setVerticalsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [lastCreatedStrategyId, setLastCreatedStrategyId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    agent_id: "",
    vertical_id: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, scope]);

  const myAgents = useMemo(() => {
    // If backend ownership isn't applied everywhere yet, fallback to showing all.
    // We use `mine=true` API when scope=mine.
    return agentsList;
  }, [agentsList]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [strategiesData, agentsData, verticalsData] = await Promise.all([
        strategies.list(50),
        scope === "mine" ? agentsApi.listMine(50) : agentsApi.list(50),
        verticalsApi.list(),
      ]);
      setStrategiesList(strategiesData.items || []);
      setAgentsList(agentsData.items || []);
      setVerticalsList(verticalsData.items || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const created = await strategies.create({
        name: formData.name,
        description: formData.description,
        agent_id: formData.agent_id,
        vertical_id: formData.vertical_id,
        workflow_json: { steps: [] },
      });
      setShowCreateModal(false);
      setFormData({ name: "", description: "", agent_id: "", vertical_id: "" });
      setLastCreatedStrategyId(created?.id || null);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create strategy");
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <NetworkBackground />
      
      <div className="min-h-screen">
        <Navigation />

        <div className="container" style={{ padding: "48px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)" }}>
              {t("strategies.title") || "Strategies"}
            </h1>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              disabled={agentsList.length === 0}
            >
              {t("strategies.create") || "Create Strategy"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className={scope === "mine" ? "btn btn-primary" : "btn btn-ghost"}
                onClick={() => setScope("mine")}
              >
                My
              </button>
              <button
                className={scope === "all" ? "btn btn-primary" : "btn btn-ghost"}
                onClick={() => setScope("all")}
              >
                All
              </button>
            </div>
            {user?.id && (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Signed in as {user.email}
              </div>
            )}
          </div>

          {lastCreatedStrategyId && (
            <div className="card" style={{ marginBottom: "24px", padding: "16px" }}>
              <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
                Strategy created
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a className="btn btn-primary" href={`/strategies/${encodeURIComponent(lastCreatedStrategyId)}`}>
                  Create version
                </a>
                <a className="btn btn-ghost" href={`/strategies/${encodeURIComponent(lastCreatedStrategyId)}`}>
                  View strategy
                </a>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              fontSize: "0.9rem",
              marginBottom: "24px",
            }}>
              {error}
            </div>
          )}

          {agentsList.length === 0 && !loading && (
            <div className="card" style={{ marginBottom: "24px", padding: "16px", background: "rgba(255, 193, 7, 0.1)" }}>
              <p style={{ color: "#ffc107", margin: 0, fontSize: "0.9rem" }}>
                You need to create an agent first before creating strategies.{" "}
                <a href="/agents" style={{ color: "#ffc107", textDecoration: "underline" }}>
                  Go to Agents
                </a>
              </p>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
              Loading strategies...
            </div>
          ) : strategiesList.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px" }}>
              <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                No strategies yet. Create your first strategy to get started.
              </p>
              {agentsList.length > 0 && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Strategy
                </button>
              )}
            </div>
          ) : (
            <div className="responsive-grid responsive-grid-3">
              {strategiesList.map((strategy) => (
                <a key={strategy.id} className="card" href={`/strategies/${encodeURIComponent(strategy.id)}`} style={{ textDecoration: "none" }}>
                  <div className="card-header">
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                      {strategy.name}
                    </h3>
                    <span className="badge badge-active">
                      Active
                    </span>
                  </div>
                  {strategy.description && (
                    <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                      {strategy.description}
                    </p>
                  )}
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Created: {new Date(strategy.created_at).toLocaleDateString()}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "24px",
        }}>
          <div className="card" style={{ maxWidth: "500px", width: "100%" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "24px", color: "var(--text)" }}>
              Create New Strategy
            </h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 500, color: "var(--text)" }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 500, color: "var(--text)" }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontSize: "0.95rem",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 500, color: "var(--text)" }}>
                  Agent *
                </label>
                <select
                  value={formData.agent_id}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontSize: "0.95rem",
                  }}
                >
                  <option value="">Select an agent</option>
                  {myAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 500, color: "var(--text)" }}>
                  Vertical *
                </label>
                <select
                  value={formData.vertical_id}
                  onChange={(e) => setFormData({ ...formData, vertical_id: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontSize: "0.95rem",
                  }}
                >
                  <option value="">Select a vertical</option>
                  {verticalsList.map((vertical) => (
                    <option key={vertical.id} value={vertical.id}>
                      {vertical.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {creating ? "Creating..." : "Create Strategy"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
