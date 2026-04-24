"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { funds, pools } from "@/lib/api";

interface Fund {
  id: string;
  name: string;
  description?: string;
  pool_id: string;
  created_at: string;
}

export default function FundsPage() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [fundsList, setFundsList] = useState<Fund[]>([]);
  const [poolsList, setPoolsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    pool_id: "",
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
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fundsData, poolsData] = await Promise.all([
        funds.list(50),
        pools.list(50),
      ]);
      setFundsList(fundsData.items || []);
      setPoolsList(poolsData.items || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load funds");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      await fetch("/api/funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          pool_id: formData.pool_id,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Unknown error" }));
          throw new Error(err.detail || `API error: ${res.status}`);
        }
      });

      setShowCreateModal(false);
      setFormData({ name: "", pool_id: "" });
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create fund");
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "32px",
            }}
          >
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {t("funds.title") || "Funds"}
            </h1>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              disabled={poolsList.length === 0}
            >
              {t("funds.create") || "Create Fund"}
            </button>
          </div>

          {poolsList.length === 0 && !loading && (
            <div
              className="card"
              style={{
                marginBottom: "24px",
                padding: "16px",
                background: "rgba(255, 193, 7, 0.1)",
              }}
            >
              <p
                style={{
                  color: "#ffc107",
                  margin: 0,
                  fontSize: "0.9rem",
                }}
              >
                You need to create at least one capital pool before creating funds.
              </p>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                fontSize: "0.9rem",
                marginBottom: "24px",
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                color: "var(--text-muted)",
              }}
            >
              Loading funds...
            </div>
          ) : fundsList.length === 0 ? (
            <div
              className="card"
              style={{ textAlign: "center", padding: "48px" }}
            >
              <p
                style={{
                  color: "var(--text-muted)",
                  marginBottom: "16px",
                }}
              >
                No funds yet. Create your first fund to allocate capital to strategies through pools.
              </p>
              {poolsList.length > 0 && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Fund
                </button>
              )}
            </div>
          ) : (
            <div className="responsive-grid responsive-grid-3">
              {fundsList.map((fund) => {
                const pool = poolsList.find((p) => p.id === fund.pool_id);
                return (
                  <div key={fund.id} className="card">
                    <div className="card-header">
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            color: "var(--text)",
                            margin: 0,
                          }}
                        >
                          {fund.name}
                        </h3>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-muted)",
                            marginTop: "4px",
                          }}
                        >
                          Pool:{" "}
                          <span style={{ color: "var(--accent)" }}>
                            {pool?.name || fund.pool_id}
                          </span>
                        </div>
                      </div>
                    </div>
                    {fund.description && (
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-muted)",
                          marginTop: "8px",
                        }}
                      >
                        {fund.description}
                      </p>
                    )}
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        marginTop: "8px",
                      }}
                    >
                      Created:{" "}
                      {new Date(fund.created_at).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div
          style={{
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
          }}
        >
          <div className="card" style={{ maxWidth: "500px", width: "100%" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "24px",
                color: "var(--text)",
              }}
            >
              Create Fund
            </h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    color: "var(--text)",
                  }}
                >
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
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

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    color: "var(--text)",
                  }}
                >
                  Pool *
                </label>
                <select
                  value={formData.pool_id}
                  onChange={(e) =>
                    setFormData({ ...formData, pool_id: e.target.value })
                  }
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
                  <option value="">Select a pool</option>
                  {poolsList.map((pool) => (
                    <option key={pool.id} value={pool.id}>
                      {pool.name}
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
                  {creating ? "Creating..." : "Create Fund"}
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

