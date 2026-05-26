"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { useAuth } from "@/components/AuthProvider";
import { WalletConnectCard } from "@/components/WalletConnectCard";
import { useWallet } from "@/components/WalletProvider";

type AcpWalletRecoveryHint = {
  walletSigninAvailable: boolean;
  linkedWalletAddress?: string | null;
  loginTarget: string;
  walletRecoveryTarget: string;
};

function asInternalPath(value: unknown, fallback: string) {
  return typeof value === "string" && value.startsWith("/") ? value : fallback;
}

function getAcpWalletRecoveryHint(detail: unknown): AcpWalletRecoveryHint {
  const recovery = detail && typeof detail === "object" ? (detail as { recovery?: unknown }).recovery : null;
  const payload = recovery && typeof recovery === "object" ? (recovery as Record<string, unknown>) : {};
  return {
    walletSigninAvailable: payload.wallet_signin_available === true,
    linkedWalletAddress: typeof payload.linked_wallet_address === "string" ? payload.linked_wallet_address : null,
    loginTarget: asInternalPath(payload.login_target, "/login?next=/wallet/acp%23password-security"),
    walletRecoveryTarget: asInternalPath(payload.wallet_recovery_target, "/wallet/acp#password-security"),
  };
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { resetPassword, recoverPasswordWithWallet } = useAuth();
  const { address, chainId, isConnected } = useWallet();
  const token = useMemo(() => searchParams?.get("token")?.trim() || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recoveryHint, setRecoveryHint] = useState<AcpWalletRecoveryHint | null>(null);
  const [loading, setLoading] = useState(false);
  const [walletRecoveryLoading, setWalletRecoveryLoading] = useState(false);
  const [walletRecoveryInfo, setWalletRecoveryInfo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setRecoveryHint(null);
    setWalletRecoveryInfo("");
    setLoading(true);
    try {
      if (!token) {
        throw new Error("Reset token is missing");
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (!turnstileToken) {
        throw new Error("Complete the captcha first");
      }
      await resetPassword(token, password, turnstileToken);
      setSuccess("Password updated. You can log in now.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; code?: string; detail?: unknown } | null;
      const message = err instanceof Error ? err.message : "Password reset failed";
      setError(message);
      if (apiErr?.code === "ACP_WALLET_PASSWORD_RESET_BLOCKED") {
        setRecoveryHint(getAcpWalletRecoveryHint(apiErr?.detail));
      }
      setTurnstileToken("");
      setTurnstileResetKey((v) => v + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletRecovery = async () => {
    setError("");
    setSuccess("");
    setWalletRecoveryInfo("");
    setWalletRecoveryLoading(true);
    try {
      if (!address || !isConnected) {
        throw new Error("Connect the linked wallet first");
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (!turnstileToken) {
        throw new Error("Complete the captcha first");
      }
      await recoverPasswordWithWallet(address, password, chainId, turnstileToken);
      setWalletRecoveryInfo("Wallet-based recovery completed. You can log in with the new password now.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Wallet recovery failed";
      setError(message);
      setTurnstileToken("");
      setTurnstileResetKey((v) => v + 1);
    } finally {
      setWalletRecoveryLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center" style={{ padding: "24px" }}>
      <div className="card" style={{ maxWidth: "420px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <Link href="/" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", textDecoration: "none" }}>
            ANCAP
          </Link>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginTop: "16px", color: "var(--text)" }}>
            Reset password
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "18px" }}>
            <label htmlFor="password" style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 500, color: "var(--text)" }}>
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: "0.95rem" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label htmlFor="confirm_password" style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: 500, color: "var(--text)" }}>
              Confirm password
            </label>
            <input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: "0.95rem" }}
            />
          </div>

          <TurnstileWidget
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
            action="login"
            onTokenChange={setTurnstileToken}
            resetSignal={turnstileResetKey}
          />

          {error && <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: "0.9rem", marginBottom: "16px" }}>{error}</div>}
          {recoveryHint && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(245,158,11,0.12)",
                color: "#fbbf24",
                fontSize: "0.9rem",
                marginBottom: "16px",
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "8px" }}>ACP wallet recovery path</div>
              <div>
                1. Sign in with your current password
                {recoveryHint.walletSigninAvailable ? ", or try the linked EVM wallet recovery path below" : ""}.
              </div>
              <div>2. After login, go straight to the ACP wallet password rotation section and use <strong>Password &amp; wallet secret</strong> to rotate the password safely.</div>
              <div>3. Legacy ACP-wallet accounts may still reject wallet-only recovery until their wallet secret is migrated to a recovery-ready format.</div>
              {recoveryHint.walletSigninAvailable && recoveryHint.linkedWalletAddress && (
                <div>Linked wallet on file: <strong>{recoveryHint.linkedWalletAddress}</strong></div>
              )}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                <Link href={recoveryHint.loginTarget} className="btn btn-ghost">Open wallet recovery login</Link>
                <Link href={recoveryHint.walletRecoveryTarget} className="btn btn-ghost">Open ACP wallet</Link>
              </div>
              {recoveryHint.walletSigninAvailable && (
                <div style={{ marginTop: "14px", display: "grid", gap: "12px" }}>
                  <WalletConnectCard
                    compact
                    showContinue={false}
                    turnstileRequired
                    turnstileToken={turnstileToken}
                    turnstileErrorMessage="Complete the captcha first, then connect the linked wallet."
                  />
                  <button type="button" className="btn btn-primary" onClick={() => void handleWalletRecovery()} disabled={walletRecoveryLoading || !isConnected || !address || !turnstileToken}>
                    {walletRecoveryLoading ? "Trying wallet recovery..." : "Recover with linked wallet"}
                  </button>
                  {walletRecoveryInfo && <div style={{ color: "#86efac" }}>{walletRecoveryInfo}</div>}
                </div>
              )}
            </div>
          )}
          {success && <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(52,211,153,0.1)", color: "#86efac", fontSize: "0.9rem", marginBottom: "16px" }}>{success}</div>}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", marginBottom: "14px" }}>
            {loading ? "Updating password..." : "Set new password"}
          </button>

          <div style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navigation />
      <Suspense fallback={<div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center" style={{ padding: "24px", color: "var(--text-muted)" }}>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
