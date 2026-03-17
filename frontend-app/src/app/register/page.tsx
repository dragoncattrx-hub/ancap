"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { NetworkBackground } from "@/components/NetworkBackground";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(email, password, displayName);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NetworkBackground />
      
      <div className="min-h-screen flex items-center justify-center" style={{ padding: "24px" }}>
        <div className="card" style={{ maxWidth: "400px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <a href="/" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", textDecoration: "none" }}>
              ANCAP
            </a>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginTop: "16px", color: "var(--text)" }}>
              Register
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="display_name"
                style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 500, color: "var(--text)" }}
              >
                Display Name
              </label>
              <input
                id="display_name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
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
                htmlFor="email"
                style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 500, color: "var(--text)" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                htmlFor="password"
                style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 500, color: "var(--text)" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Minimum 8 characters
              </div>
            </div>

            {error && (
              <div style={{
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                fontSize: "0.9rem",
                marginBottom: "20px",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", marginBottom: "16px" }}
            >
              {loading ? "Creating account..." : "Register"}
            </button>

            <div style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <a href="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
                Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
