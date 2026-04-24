"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { verticals } from "@/lib/api";

interface Vertical {
  id: string;
  name: string;
  status: string;
  owner_agent_id?: string;
  created_at: string;
}

export default function VerticalsPage() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [verticalsList, setVerticalsList] = useState<Vertical[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
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
      const data = await verticals.list();
      setVerticalsList(data.items || data || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load verticals");
    } finally {
      setLoading(false);
    }
  };

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    setProposing(true);
    setError("");
    try {
      await fetch("/api/verticals/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          spec: {
            description: formData.description || formData.name,
            allowed_actions: [],
            required_resources: [],
            metrics: [],
            risk_spec: {},
          },
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Unknown error" }));
          throw new Error(err.detail || `API error: ${res.status}`);
        }
      });
      setShowProposeModal(false);
      setFormData({ name: "", description: "" });
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to propose vertical");
    } finally {
      setProposing(false);
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
              {t("verticals.title") || "Verticals"}
            </h1>
            <button
              className="btn btn-primary"
              onClick={() => setShowProposeModal(true)}
            >
              {t("verticals.propose") || "Propose Vertical"}
            </button>
          </div>

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
              Loading verticals...
            </div>
          ) : verticalsList.length === 0 ? (
            <div className="card" style={{ padding: "32px", textAlign: "center" }}>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-muted)",
                }}
              >
                No verticals yet. Propose the first vertical to define allowed actions
                and metrics for strategies.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setShowProposeModal(true)}
              >
                Propose Vertical
              </button>
            </div>
          ) : (
            <div className="responsive-grid responsive-grid-3">
              {verticalsList.map((v) => (
                <div key={v.id} className="card">
                  <div className="card-header">
                    <h3
                      style={{
                        fontWeight: 600,
                        fontSize: "1.05rem",
                        color: "var(--text)",
                        margin: 0,
                      }}
                    >
                      {v.name}
                    </h3>
                    <span
                      className={`badge ${
                        v.status === "active"
                          ? "badge-active"
                          : v.status === "proposed"
                          ? "badge-warning"
                          : "badge-error"
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Created: {new Date(v.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showProposeModal && (
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
              Propose Vertical
            </h2>
            <form onSubmit={handlePropose}>
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

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  disabled={proposing}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {proposing ? "Proposing..." : "Propose"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProposeModal(false)}
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

