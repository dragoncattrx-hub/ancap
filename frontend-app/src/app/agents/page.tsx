"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { agents } from "@/lib/api";

interface Agent {
  id: string;
  display_name: string;
  roles: string[];
  status: string;
  created_at: string;
}

export default function AgentsPage() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [lastCreatedAgentId, setLastCreatedAgentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    display_name: "",
    public_key: "",
    roles: ["seller"] as string[],
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAgents();
    }
  }, [isAuthenticated, scope]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = scope === "mine" ? await agents.listMine(50) : await agents.list(50);
      setAgentsList(data.items || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const created = await agents.create({
        display_name: formData.display_name,
        public_key: formData.public_key || `pk_${Date.now()}`,
        roles: formData.roles,
        metadata: {},
      });
      setShowCreateModal(false);
      setFormData({ display_name: "", public_key: "", roles: ["seller"] });
      setLastCreatedAgentId(created?.id || null);
      await loadAgents();
    } catch (err: any) {
      setError(err.message || "Failed to create agent");
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
              {t("agents.title") || "Agents"}
            </h1>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              {t("agents.register") || "Register Agent"}
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

          {lastCreatedAgentId && (
            <div className="card" style={{ marginBottom: "24px", padding: "16px" }}>
              <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
                Agent created
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a className="btn btn-primary" href={`/strategies?owner_agent_id=${encodeURIComponent(lastCreatedAgentId)}`}>
                  Create strategy
                </a>
                <a className="btn btn-ghost" href="/agents">
                  View agents
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

          {loading ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
              Loading agents...
            </div>
          ) : agentsList.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px" }}>
              <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                No agents yet. Create your first agent to get started.
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                Register Agent
              </button>
            </div>
          ) : (
            <div className="responsive-grid responsive-grid-2">
              {agentsList.map((agent) => (
                <div key={agent.id} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                    <div style={{ 
                      width: "48px", 
                      height: "48px", 
                      borderRadius: "50%", 
                      background: "linear-gradient(135deg, var(--accent), #00a88a)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--bg)"
                    }}>
                      {agent.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--text)" }}>
                        {agent.display_name}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {agent.roles.join(", ")}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                    <div style={{ marginBottom: "8px" }}>
                      Status: <span style={{ color: agent.status === "active" ? "var(--accent)" : "var(--text)" }}>
                        {agent.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.8rem" }}>
                      Created: {new Date(agent.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
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
              Register New Agent
            </h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 500, color: "var(--text)" }}>
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
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
                  Public Key (optional)
                </label>
                <input
                  type="text"
                  value={formData.public_key}
                  onChange={(e) => setFormData({ ...formData, public_key: e.target.value })}
                  placeholder="Auto-generated if empty"
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

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 500, color: "var(--text)" }}>
                  Roles
                </label>
                <select
                  value={formData.roles[0]}
                  onChange={(e) => setFormData({ ...formData, roles: [e.target.value] })}
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
                  <option value="seller">Seller</option>
                  <option value="buyer">Buyer</option>
                  <option value="allocator">Allocator</option>
                  <option value="risk">Risk</option>
                  <option value="auditor">Auditor</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {creating ? "Creating..." : "Create Agent"}
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
