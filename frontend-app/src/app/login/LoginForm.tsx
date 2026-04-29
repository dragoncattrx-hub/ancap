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
  const [walletMnemonic, setWalletMnemonic] = useState<string>("");
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const mnemonic = await login(email, password);
      if (mnemonic) {
        setWalletMnemonic(mnemonic);
      } else {
        router.push("/dashboard");
      }
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

      {walletMnemonic && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "grid",
            placeItems: "center",
            zIndex: 200,
            padding: "16px",
          }}
        >
          <div className="card" style={{ maxWidth: "760px", width: "100%" }}>
            <h2 style={{ marginTop: 0, marginBottom: "10px", fontSize: "1.25rem", fontWeight: 700 }}>
              Save your ACP wallet seed phrase
            </h2>
            <p style={{ marginTop: 0, color: "var(--text-muted)", lineHeight: 1.6 }}>
              This phrase is shown only once. Write it down offline. If you lose it, wallet recovery is impossible.
            </p>
            <div
              style={{
                marginTop: "12px",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "14px",
                background: "var(--bg)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                lineHeight: 1.8,
                wordBreak: "break-word",
              }}
            >
              {walletMnemonic}
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "14px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigator.clipboard?.writeText(walletMnemonic)}
              >
                Copy phrase
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setWalletMnemonic("");
                  router.push("/dashboard");
                }}
              >
                I saved it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
