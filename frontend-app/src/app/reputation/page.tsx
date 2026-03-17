"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { reputation } from "@/lib/api";

interface ReputationEvent {
  id: string;
  subject_type: string;
  subject_id: string;
  score_delta: number;
  reason?: string;
  created_at: string;
}

export default function ReputationPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<ReputationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [subjectType, setSubjectType] = useState("agent");
  const [subjectId, setSubjectId] = useState("");
  const [subjectWindow, setSubjectWindow] = useState("90d");
  const [subjectReputation, setSubjectReputation] = useState<any | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEvents();
    }
  }, [isAuthenticated]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await reputation.getEvents(50);
      setEvents(data.items || data || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load reputation events");
    } finally {
      setLoading(false);
    }
  };

  const loadSubjectReputation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;
    try {
      setSubjectLoading(true);
      const data = await reputation.get(subjectType, subjectId, subjectWindow);
      setSubjectReputation(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load reputation");
      setSubjectReputation(null);
    } finally {
      setSubjectLoading(false);
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
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: "32px",
              color: "var(--text)",
            }}
          >
            Reputation
          </h1>

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

          <div
            className="responsive-grid responsive-grid-2"
            style={{ marginBottom: "32px" }}
          >
            <div className="card">
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  marginBottom: "12px",
                  color: "var(--text)",
                }}
              >
                Recent Reputation Events
              </h2>
              {loading ? (
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Loading events...
                </p>
              ) : events.length === 0 ? (
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                  }}
                >
                  No reputation events yet.
                </p>
              ) : (
                <div
                  style={{
                    maxHeight: "320px",
                    overflowY: "auto",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div>
                        <strong>{ev.subject_type}</strong> —{" "}
                        <span style={{ color: "var(--accent)" }}>
                          {ev.subject_id}
                        </span>
                      </div>
                      <div>
                        Δscore:{" "}
                        <span
                          style={{
                            color:
                              ev.score_delta >= 0
                                ? "var(--accent)"
                                : "#ef4444",
                          }}
                        >
                          {ev.score_delta.toFixed(3)}
                        </span>
                      </div>
                      {ev.reason && <div>Reason: {ev.reason}</div>}
                      <div>
                        Time:{" "}
                        {new Date(ev.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  marginBottom: "12px",
                  color: "var(--text)",
                }}
              >
                Subject Reputation
              </h2>
              <form onSubmit={loadSubjectReputation}>
                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      color: "var(--text)",
                    }}
                  >
                    Subject Type
                  </label>
                  <select
                    value={subjectType}
                    onChange={(e) => setSubjectType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <option value="agent">agent</option>
                    <option value="strategy">strategy</option>
                    <option value="fund">fund</option>
                  </select>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      color: "var(--text)",
                    }}
                  >
                    Subject ID
                  </label>
                  <input
                    type="text"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      color: "var(--text)",
                    }}
                  >
                    Window
                  </label>
                  <select
                    value={subjectWindow}
                    onChange={(e) => setSubjectWindow(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <option value="30d">30d</option>
                    <option value="90d">90d</option>
                    <option value="365d">365d</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={subjectLoading}
                  className="btn btn-primary"
                  style={{ width: "100%", marginBottom: "16px" }}
                >
                  {subjectLoading ? "Loading..." : "Load Reputation"}
                </button>
              </form>

              {subjectReputation && (
                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border)",
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <div>
                    Subject:{" "}
                    <span style={{ color: "var(--accent)" }}>
                      {subjectType}:{subjectId}
                    </span>
                  </div>
                  <pre
                    style={{
                      marginTop: "8px",
                      fontSize: "0.8rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {JSON.stringify(subjectReputation, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

