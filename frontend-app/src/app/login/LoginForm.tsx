"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navigation />
      <div
        className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center"
        style={{ padding: "24px" }}
      >
        <div className="card" style={{ maxWidth: "400px", width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Link href="/" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", textDecoration: "none" }}>
              ANCAP
            </Link>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginTop: "16px", color: "var(--text)" }}>{t("nav.login")}</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="email"
                style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 500, color: "var(--text)" }}
              >
                {t("auth.email")}
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
                  background: "var(--bg-card)",
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
                {t("auth.password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  color: "var(--text)",
                  fontSize: "0.95rem",
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  fontSize: "0.9rem",
                  marginBottom: "20px",
                }}
              >
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", marginBottom: "16px" }}>
              {loading ? t("auth.loggingIn") : t("nav.login")}
            </button>

            <div style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              {t("auth.noAccount")}{" "}
              <Link href="/register" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
                {t("nav.register")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
