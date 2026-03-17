"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { access } from "@/lib/api";

function AccessPageInner() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadGrants();
    }
  }, [isAuthenticated, searchParams]);

  const loadGrants = async () => {
    try {
      setLoading(true);
      const granteeType = searchParams?.get("grantee_type") || undefined;
      const granteeId = searchParams?.get("grantee_id") || undefined;
      const data = await access.listGrants(50, undefined, granteeType, granteeId);
      setGrants(data.items || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load access grants");
    } finally {
      setLoading(false);
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
            Access Grants
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

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                color: "var(--text-muted)",
              }}
            >
              Loading access grants...
            </div>
          ) : grants.length === 0 ? (
            <div
              className="card"
              style={{ padding: "32px", textAlign: "center" }}
            >
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-muted)",
                }}
              >
                No access grants yet. When orders are fulfilled, execute/view/allocate
                permissions will appear here.
              </p>
            </div>
          ) : (
            <div className="responsive-grid responsive-grid-3">
              {grants.map((g) => (
                <div key={g.id} className="card">
                  <div className="card-header">
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontWeight: 600,
                          fontSize: "1.05rem",
                          color: "var(--text)",
                          margin: 0,
                        }}
                      >
                        Strategy: {g.strategy_id}
                      </h3>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                          marginTop: "4px",
                        }}
                      >
                        Grantee: {g.grantee_type} {g.grantee_id}
                      </div>
                    </div>
                    <span className="badge badge-active">{g.scope}</span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      marginTop: "8px",
                    }}
                  >
                    Created: {new Date(g.created_at).toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    Expires:{" "}
                    {g.expires_at
                      ? new Date(g.expires_at).toLocaleString()
                      : "never"}
                  </div>
                  {/execute|allocate/i.test(String(g.scope)) && (
                    <div style={{ marginTop: 14 }}>
                      <a
                        className="btn btn-primary"
                        href={`/runs/new?strategy_id=${encodeURIComponent(g.strategy_id)}&buyer_agent_id=${encodeURIComponent(g.grantee_id)}`}
                        style={{ width: "100%", textAlign: "center" }}
                      >
                        Run strategy
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function AccessPage() {
  // Next.js requires a suspense boundary for useSearchParams in production build.
  return (
    <Suspense fallback={null}>
      <AccessPageInner />
    </Suspense>
  );
}

