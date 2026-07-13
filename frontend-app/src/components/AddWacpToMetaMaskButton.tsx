"use client";

import { useCallback, useState } from "react";
import { watchWacpInWallet } from "@/lib/watchAsset";
import { WACP_BSC_CONTRACT } from "@/lib/wacpToken";

type AddWacpToMetaMaskButtonProps = {
  contractAddress?: string;
  className?: string;
  variant?: "primary" | "ghost" | "bridge";
};

export function AddWacpToMetaMaskButton({
  contractAddress = WACP_BSC_CONTRACT,
  className,
  variant = "primary",
}: AddWacpToMetaMaskButtonProps) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "added" | "error">("idle");
  const [message, setMessage] = useState("");

  const onClick = useCallback(async () => {
    setBusy(true);
    setStatus("idle");
    setMessage("");
    const result = await watchWacpInWallet(contractAddress);
    setBusy(false);
    if (result.ok) {
      setStatus("added");
      setMessage("wACP added to MetaMask with ANCAP logo.");
      return;
    }
    setStatus("error");
    setMessage(result.message);
  }, [contractAddress]);

  const variantClass =
    variant === "ghost"
      ? "btn btn-ghost"
      : variant === "bridge"
        ? "rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 hover:border-zinc-500 disabled:opacity-60"
        : "btn btn-primary";

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <button
        type="button"
        className={className ? `${variantClass} ${className}` : variantClass}
        onClick={() => void onClick()}
        disabled={busy}
        aria-busy={busy}
        title="Add wACP to MetaMask with symbol, decimals, and logo (EIP-747)"
      >
        {busy ? "Opening MetaMask…" : "Add wACP to MetaMask"}
      </button>
      {status === "added" ? (
        <span style={{ fontSize: "0.82rem", color: "#10b981" }}>{message}</span>
      ) : null}
      {status === "error" ? (
        <span style={{ fontSize: "0.82rem", color: "#f59e0b" }}>{message}</span>
      ) : null}
    </div>
  );
}
