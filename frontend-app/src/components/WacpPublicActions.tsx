"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { watchWacpInWallet } from "@/lib/watchAsset";
import { WACP_BSC_CONTRACT, WACP_LOGO_PATH } from "@/lib/wacpToken";

type WacpPublicActionsProps = {
  contractAddress?: string;
  layout?: "home" | "compact";
  addLabel?: string;
};

const xPillStyle: CSSProperties = {
  minHeight: 42,
  padding: "10px 16px",
  borderRadius: 999,
  gap: 10,
  background: "rgba(255, 255, 255, 0.035)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  color: "var(--text)",
  fontSize: "0.92rem",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  textDecoration: "none",
};

function WacpLogoBadge() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: 999,
        background: "rgba(25, 195, 138, 0.14)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={WACP_LOGO_PATH} alt="" width={22} height={22} style={{ display: "block" }} />
    </span>
  );
}

export function WacpPublicActions({
  contractAddress = WACP_BSC_CONTRACT,
  layout = "home",
  addLabel = "Add wACP to MetaMask",
}: WacpPublicActionsProps) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "added" | "error">("idle");
  const [message, setMessage] = useState("");

  const onAdd = useCallback(async () => {
    setBusy(true);
    setStatus("idle");
    setMessage("");
    const result = await watchWacpInWallet(contractAddress);
    setBusy(false);
    if (result.ok) {
      setStatus("added");
      setMessage("wACP added to MetaMask with logo.");
      return;
    }
    setStatus("error");
    setMessage(result.message);
  }, [contractAddress]);

  const pillClass = layout === "home" ? "btn btn-ghost" : "btn btn-ghost btn-sm";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div className="action-cluster" style={{ marginTop: layout === "home" ? 0 : undefined }}>
        <button
          type="button"
          className={pillClass}
          style={layout === "home" ? xPillStyle : undefined}
          onClick={() => void onAdd()}
          disabled={busy}
          aria-busy={busy}
          title="wallet_watchAsset (EIP-747): symbol, decimals, logo"
        >
          <WacpLogoBadge />
          {busy ? "Opening MetaMask…" : addLabel}
        </button>
      </div>
      {status === "added" ? (
        <span style={{ fontSize: "0.82rem", color: "#10b981" }}>{message}</span>
      ) : null}
      {status === "error" ? (
        <span style={{ fontSize: "0.82rem", color: "#f59e0b" }}>{message}</span>
      ) : null}
    </div>
  );
}

/** @deprecated Prefer WacpPublicActions — thin wrapper for older imports. */
export function AddWacpToMetaMaskButton(props: {
  contractAddress?: string;
  className?: string;
  variant?: "primary" | "ghost" | "bridge";
}) {
  return <WacpPublicActions contractAddress={props.contractAddress} layout="compact" />;
}
