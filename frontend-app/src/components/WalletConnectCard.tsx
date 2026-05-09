"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWallet, walletConstants } from "@/components/WalletProvider";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";

type WalletConnectCardProps = {
  compact?: boolean;
  showContinue?: boolean;
  onConnected?: () => void;
};

export function WalletConnectCard({ compact = false, showContinue = true, onConnected }: WalletConnectCardProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { loginWithWallet } = useAuth();
  const {
    address,
    shortAddress,
    chainId,
    chainName,
    isConnected,
    isConnecting,
    providerAvailable,
    isMetaMask,
    error,
    connect,
    switchToBnb,
    clearError,
  } = useWallet();

  const onBnb = chainId === walletConstants.bnbChainId;

  const statusTone = useMemo(() => {
    if (!isConnected) return { color: "var(--text-muted)", bg: "rgba(255,255,255,0.04)", border: "var(--border)" };
    if (onBnb) return { color: "#86efac", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.28)" };
    return { color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.28)" };
  }, [isConnected, onBnb]);

  const handleConnect = async () => {
    clearError();
    await connect();
    if (onConnected) onConnected();
  };

  const handleContinue = async () => {
    if (!address) return;
    await loginWithWallet(address, chainId);
    router.push("/dashboard");
  };

  return (
    <div
      className={compact ? undefined : "card"}
      style={compact ? undefined : { marginTop: "20px", borderColor: "rgba(52, 211, 153, 0.18)" }}
    >
      <div style={{ display: "flex", alignItems: compact ? "center" : "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: compact ? 0 : "220px" }}>
          {!compact && (
            <>
              <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px" }}>
                {t("auth.walletOr")}
              </div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>{t("auth.connectWallet")}</h3>
            </>
          )}
          {!compact && (
            <p style={{ margin: "8px 0 0", color: "var(--text-muted)", lineHeight: 1.55, fontSize: "0.92rem" }}>
              {t("auth.walletSignInDesc")}
            </p>
          )}
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "999px",
            padding: "8px 12px",
            border: `1px solid ${statusTone.border}`,
            background: statusTone.bg,
            color: statusTone.color,
            fontSize: "0.86rem",
            fontWeight: 600,
          }}
        >
          {isConnected ? `${t("auth.walletConnected")}: ${shortAddress}` : providerAvailable ? "EVM wallet ready" : t("auth.walletNotInstalled")}
        </div>
      </div>

      {isConnected && (
        <div
          style={{
            marginTop: compact ? "10px" : "16px",
            display: "grid",
            gap: "10px",
            padding: compact ? "10px 12px" : "12px 14px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--text-muted)" }}>{t("auth.connectedWallet")}</span>
            <span
              title={address ?? undefined}
              style={{
                color: "var(--text)",
                fontWeight: 600,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                maxWidth: "100%",
                overflowWrap: "anywhere",
                wordBreak: "break-all",
                textAlign: "right",
              }}
            >
              {address}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Network</span>
            <span style={{ color: onBnb ? "#86efac" : "#fbbf24", fontWeight: 600 }}>{chainName}</span>
          </div>
          {!onBnb && (
            <div style={{ color: "#fbbf24", fontSize: "0.88rem", lineHeight: 1.5 }}>{t("auth.walletBnbHint")}</div>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: compact ? "10px" : "14px",
            padding: "12px",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: compact ? "10px" : "16px" }}>
        {!isConnected ? (
          <button type="button" className="btn btn-primary" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? t("auth.connectingWallet") : t("auth.connectWallet")}
          </button>
        ) : (
          <>
            {!onBnb && (
              <button type="button" className="btn btn-ghost" onClick={switchToBnb}>
                {t("auth.switchToBnb")}
              </button>
            )}
            {showContinue && (
              <button type="button" className="btn btn-primary" onClick={() => void handleContinue()}>
                {t("auth.continueToDashboard")}
              </button>
            )}
          </>
        )}
        {!providerAvailable && (
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
          >
            Install MetaMask
          </a>
        )}
        {isConnected && isMetaMask && (
          <span style={{ alignSelf: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>MetaMask</span>
        )}
      </div>
    </div>
  );
}
