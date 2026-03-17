"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { pools, verticals as verticalsApi } from "@/lib/api";

interface Pool {
  id: string;
  name: string;
  description?: string;
  vertical_id: string;
  created_at: string;
}

export default function PoolsPage() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [poolsList, setPoolsList] = useState<Pool[]>([]);
  const [verticals, setVerticals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
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
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [poolsData, verticalsData] = await Promise.all([
        pools.list(50),
        verticalsApi.list(),
      ]);
      setPoolsList(poolsData.items || []);
      setVerticals(verticalsData.items || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load pools");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      await pools.create({
        name: formData.name,
        description: formData.description || undefined,
        vertical_id: formData.vertical_id,
      });
      setShowCreateModal(false);
      setFormData({ name: "", description: "", vertical_id: "" });
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create pool");
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
              {t("pools.title") || "Capital Pools"}
            </h1>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              disabled={verticals.length === 0}
            >
              {t("pools.create") || "Create Pool"}
            </button>
          </div>

          {verticals.length === 0 && !loading && (
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
                You need at least one vertical before creating capital pools.
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
              Loading pools...
            </div>
          ) : poolsList.length === 0 ? (
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
                No capital pools yet. Create your first pool to allocate
                capital to strategies.
              </p>
              {verticals.length > 0 && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Pool
                </button>
              )}
            </div>
          ) : (
            <div className="responsive-grid responsive-grid-3">
              {poolsList.map((pool) => {
                const v = verticals.find(
                  (vert) => vert.id === pool.vertical_id,
                );
                return (
                  <div key={pool.id} className="card">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: 600,
                          color: "var(--text)",
                          margin: 0,
                        }}
                      >
                        {pool.name}
                      </h3>
                    </div>
                    {pool.description && (
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-muted)",
                          marginBottom: "12px",
                        }}
                      >
                        {pool.description}
                      </p>
                    )}
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <div style={{ marginBottom: "6px" }}>
                        Vertical:{" "}
                        <span style={{ color: "var(--accent)" }}>
                          {v?.name || pool.vertical_id}
                        </span>
                      </div>
                      <div>
                        Created:{" "}
                        {new Date(pool.created_at).toLocaleDateString()}
                      </div>
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
              Create Capital Pool
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
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
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
                  Vertical *
                </label>
                <select
                  value={formData.vertical_id}
                  onChange={(e) =>
                    setFormData({ ...formData, vertical_id: e.target.value })
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
                  <option value="">Select a vertical</option>
                  {verticals.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
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
                  {creating ? "Creating..." : "Create Pool"}
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

