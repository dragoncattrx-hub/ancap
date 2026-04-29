"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { walletAcp } from "@/lib/api";

type BalanceResponse = {
  address: string;
  units: string;
  acp: string;
  utxo_count?: number;
  in_work_acp?: string;
  available_acp?: string;
  balance_note?: string;
};

type SwapOrder = {
  id: string;
  status: "awaiting_deposit" | "pending_review" | "completed" | "cancelled" | "rejected";
  usdt_trc20_amount: string;
  rate_acp_per_usdt: string;
  estimated_acp_amount: string;
  payout_acp_address: string;
  deposit_trc20_address: string;
  deposit_reference: string;
  tron_txid?: string | null;
  payout_txid?: string | null;
  note?: string | null;
  created_at: string;
  updated_at: string;
};

type AcpTransaction = {
  txid: string;
  block_height: number;
  block_time: string;
  confirmations: number;
  direction: "in" | "out" | "self";
  sent_units: string;
  sent_acp: string;
  received_units: string;
  received_acp: string;
  net_units: string;
  net_acp: string;
};

export default function AcpWalletPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [tab, setTab] = useState<"wallet" | "swap">("wallet");
  const [depositAddress, setDepositAddress] = useState<string>("");
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [transactions, setTransactions] = useState<AcpTransaction[]>([]);
  const [txAddressInput, setTxAddressInput] = useState("");
  const [txAddressActive, setTxAddressActive] = useState("");
  const [txAddressBalance, setTxAddressBalance] = useState<BalanceResponse | null>(null);
  const [swapOrders, setSwapOrders] = useState<SwapOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadWarnings, setLoadWarnings] = useState<string[]>([]);

  const [swapForm, setSwapForm] = useState({
    usdt_trc20_amount: "100",
    payout_acp_address: "",
    note: "",
    tron_txid: "",
  });
  const [quote, setQuote] = useState<{ rate_acp_per_usdt: string; estimated_acp_amount: string } | null>(null);

  const [withdrawForm, setWithdrawForm] = useState({
    to_address: "",
    amount_acp: "",
    wallet_password: "",
  });
  const [withdrawResult, setWithdrawResult] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const selectedOrder = useMemo(
    () => swapOrders.find((o) => o.id === selectedOrderId) || swapOrders[0] || null,
    [swapOrders, selectedOrderId],
  );

  useEffect(() => {
    const resolved = (depositAddress || balance?.address || "").trim();
    if (!resolved) return;
    setTxAddressInput((prev) => (prev ? prev : resolved));
    setTxAddressActive((prev) => (prev ? prev : resolved));
  }, [depositAddress, balance?.address]);

  async function refreshAll() {
    setBusy(true);
    setError("");
    setLoadWarnings([]);
    try {
      const [addrRes, balRes, ordersRes, txRes] = await Promise.allSettled([
        walletAcp.getDepositAddress(),
        walletAcp.getHotBalance(),
        walletAcp.listSwapOrders(),
        walletAcp.listTransactions({ limit: 50 }),
      ]);

      const warnings: string[] = [];

      if (addrRes.status === "fulfilled") {
        setDepositAddress(addrRes.value?.address || "");
      } else {
        warnings.push(`Deposit address unavailable: ${addrRes.reason?.message || "unknown error"}`);
      }

      if (balRes.status === "fulfilled") {
        setBalance(balRes.value || null);
      } else {
        warnings.push(`Hot balance unavailable: ${balRes.reason?.message || "unknown error"}`);
      }

      if (ordersRes.status === "fulfilled") {
        const orders = Array.isArray(ordersRes.value) ? ordersRes.value : [];
        setSwapOrders(orders);
        if (!selectedOrderId && orders.length > 0) {
          setSelectedOrderId(orders[0].id);
        }
      } else {
        warnings.push(`Swap history unavailable: ${ordersRes.reason?.message || "unknown error"}`);
      }

      if (txRes.status === "fulfilled") {
        const items = Array.isArray(txRes.value) ? txRes.value : [];
        setTransactions(items);
      } else {
        warnings.push(`On-chain history unavailable: ${txRes.reason?.message || "unknown error"}`);
      }
      if (balRes.status === "fulfilled") {
        setTxAddressBalance(balRes.value || null);
      }

      const any401 = [addrRes, balRes, ordersRes, txRes].some(
        (res) =>
          res.status === "rejected" &&
          String((res.reason as any)?.message || "").includes("API error 401"),
      );
      if (any401) {
        router.push("/login");
        return;
      }

      setLoadWarnings(warnings);
    } catch (e: any) {
      setError(e?.message || "Failed to load ACP wallet");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    const v = (text || "").trim();
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
    } catch {
      // ignore clipboard errors
    }
  }

  async function refreshTransactionsByAddress(address: string) {
    const target = address.trim();
    if (!target) return;
    setBusy(true);
    setError("");
    try {
      const [items, bal] = await Promise.all([
        walletAcp.listTransactions({ address: target, limit: 50 }),
        walletAcp.getBalance({ address: target }),
      ]);
      setTransactions(Array.isArray(items) ? items : []);
      setTxAddressBalance((bal as BalanceResponse) || null);
      setTxAddressActive(target);
    } catch (e: any) {
      setError(e?.message || "Failed to load on-chain history");
    } finally {
      setBusy(false);
    }
  }

  async function refreshQuote() {
    setError("");
    try {
      const q = await walletAcp.swapQuote({ usdt_trc20_amount: swapForm.usdt_trc20_amount.trim() });
      setQuote(q);
    } catch (e: any) {
      setQuote(null);
      setError(e?.message || "Failed to calculate quote");
    }
  }

  async function createSwapOrder(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await walletAcp.createSwapOrder({
        usdt_trc20_amount: swapForm.usdt_trc20_amount.trim(),
        payout_acp_address: swapForm.payout_acp_address.trim(),
        note: swapForm.note.trim() || undefined,
      });
      await refreshAll();
      setSelectedOrderId(created.id);
    } catch (e: any) {
      setError(e?.message || "Failed to create swap order");
    } finally {
      setBusy(false);
    }
  }

  async function confirmSelectedOrder() {
    if (!selectedOrder) return;
    setBusy(true);
    setError("");
    try {
      await walletAcp.confirmSwapOrder(selectedOrder.id, {
        tron_txid: swapForm.tron_txid.trim() || undefined,
      });
      await refreshAll();
    } catch (e: any) {
      setError(e?.message || "Failed to confirm swap order");
    } finally {
      setBusy(false);
    }
  }

  async function cancelSelectedOrder() {
    if (!selectedOrder) return;
    setBusy(true);
    setError("");
    try {
      await walletAcp.cancelSwapOrder(selectedOrder.id);
      await refreshAll();
    } catch (e: any) {
      setError(e?.message || "Failed to cancel swap order");
    } finally {
      setBusy(false);
    }
  }

  async function doWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setWithdrawResult(null);
    try {
      const res = await walletAcp.withdraw({
        to_address: withdrawForm.to_address.trim(),
        amount_acp: withdrawForm.amount_acp.trim(),
        wallet_password: withdrawForm.wallet_password,
      });
      setWithdrawResult(res);
      await refreshAll();
    } catch (e: any) {
      setError(e?.message || "Withdraw failed");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  const singleWalletAddress = (depositAddress || balance?.address || "").trim();

  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />

        <div className="container" style={{ padding: "48px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
            <div>
              <div className="section-num" style={{ marginBottom: 10 }}>
                Wallet
              </div>
              <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0, color: "var(--text)" }}>
                ACP Wallet & Swap
              </h1>
              <div style={{ color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6 }}>
                Internal MVP swap: create Tether TRC-20 {"->"} ACP order, send Tether by reference, then wait for review and ACP payout.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <div className="flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setTab("wallet")}
                  className={[
                    "rounded-full px-3 py-1.5 text-[12px] font-medium transition",
                    tab === "wallet"
                      ? "bg-emerald-400/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/30"
                      : "text-white/50 hover:text-white/85",
                  ].join(" ")}
                >
                  Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setTab("swap")}
                  className={[
                    "rounded-full px-3 py-1.5 text-[12px] font-medium transition",
                    tab === "swap"
                      ? "bg-emerald-400/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/30"
                      : "text-white/50 hover:text-white/85",
                  ].join(" ")}
                >
                  Tether TRC-20 {"->"} ACP
                </button>
              </div>

              <button className="btn btn-ghost" onClick={refreshAll} disabled={busy}>
                {busy ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                fontSize: "0.9rem",
                marginBottom: "18px",
              }}
            >
              {error}
            </div>
          )}
          {loadWarnings.length > 0 && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(245, 158, 11, 0.12)",
                color: "#f59e0b",
                fontSize: "0.9rem",
                marginBottom: "18px",
                display: "grid",
                gap: 6,
              }}
            >
              {loadWarnings.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
          )}

          {tab === "wallet" ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div className="responsive-grid responsive-grid-3">
                <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 800, margin: 0 }}>Deposit address</h3>
                  <span className="badge badge-info">ACP</span>
                </div>
                <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: "0.9rem" }}>Send ACP to this wallet address:</div>
                <div style={{ marginTop: 10, padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                  {singleWalletAddress || "-"}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => copy(singleWalletAddress)} disabled={!singleWalletAddress}>Copy</button>
                </div>
                </div>

                <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 800, margin: 0 }}>Hot balance</h3>
                  <span className="badge badge-active">Live</span>
                </div>
                <div style={{ marginTop: 12, fontSize: "2rem", fontWeight: 900, color: "var(--text)" }}>
                  {balance?.acp ?? "-"} <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-muted)" }}>ACP</span>
                </div>
                {balance?.utxo_count != null && <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: "0.85rem" }}>UTXO count: {balance.utxo_count}</div>}
                <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Real balance: <strong style={{ color: "var(--text)" }}>{balance?.acp ?? "0"} ACP</strong>
                </div>
                <div style={{ marginTop: 4, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  In work: <strong style={{ color: "var(--text)" }}>{balance?.in_work_acp ?? "0"} ACP</strong>
                </div>
                <div style={{ marginTop: 4, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Available for withdraw: <strong style={{ color: "var(--text)" }}>{balance?.available_acp ?? balance?.acp ?? "0"} ACP</strong>
                </div>
                {balance?.balance_note ? (
                  <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.5 }}>
                    {balance.balance_note}
                  </div>
                ) : null}
                </div>

                <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 800, margin: 0 }}>Withdraw</h3>
                  <span className="badge badge-warning">Signed</span>
                </div>
                <form onSubmit={doWithdraw} style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <input placeholder="To address" value={withdrawForm.to_address} onChange={(e) => setWithdrawForm((p) => ({ ...p, to_address: e.target.value }))} className="input input-bordered w-full" required />
                  <input placeholder="Amount (ACP)" value={withdrawForm.amount_acp} onChange={(e) => setWithdrawForm((p) => ({ ...p, amount_acp: e.target.value }))} className="input input-bordered w-full" required />
                  <input type="password" placeholder="Wallet password" value={withdrawForm.wallet_password} onChange={(e) => setWithdrawForm((p) => ({ ...p, wallet_password: e.target.value }))} className="input input-bordered w-full" required />
                  <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Sending..." : "Withdraw"}</button>
                </form>
                {withdrawResult && <pre style={{ marginTop: 10, padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", overflowX: "auto" }}>{JSON.stringify(withdrawResult, null, 2)}</pre>}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 800, margin: 0 }}>On-chain transaction history</h3>
                  <span className="badge badge-active">Explorer</span>
                </div>
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Address</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      className="input input-bordered w-full"
                      value={txAddressInput}
                      onChange={(e) => setTxAddressInput(e.target.value)}
                      placeholder="acp1..."
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => refreshTransactionsByAddress(txAddressInput)}
                      disabled={busy || !txAddressInput.trim()}
                    >
                      Load history
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        const hot = (singleWalletAddress || "").trim();
                        if (!hot) return;
                        setTxAddressInput(hot);
                        refreshTransactionsByAddress(hot);
                      }}
                      disabled={busy || !singleWalletAddress}
                    >
                      Use hot wallet
                    </button>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Showing: <span style={{ color: "var(--text)" }}>{txAddressActive || "-"}</span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    Balance:{" "}
                    <strong style={{ color: "var(--text)" }}>
                      {txAddressBalance?.acp ?? "0"} ACP
                    </strong>
                    {txAddressBalance?.utxo_count != null ? ` (${txAddressBalance.utxo_count} UTXO)` : ""}
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <div style={{ marginTop: 12, color: "var(--text-muted)" }}>No on-chain transactions found for this address.</div>
                ) : (
                  <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    {transactions.map((tx) => (
                      <div
                        key={`${tx.txid}-${tx.block_height}`}
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "var(--bg)",
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <strong>{tx.direction.toUpperCase()}</strong>
                          <span style={{ color: "var(--text-muted)" }}>
                            block {tx.block_height} • {tx.confirmations} conf
                          </span>
                        </div>
                        <div style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>{tx.txid}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ color: "var(--text-muted)" }}>Sent: {tx.sent_acp} ACP</span>
                          <span style={{ color: "var(--text-muted)" }}>Received: {tx.received_acp} ACP</span>
                          <strong style={{ color: tx.net_acp.startsWith("-") ? "#ef4444" : "#10b981" }}>
                            Net: {tx.net_acp} ACP
                          </strong>
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{tx.block_time}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="responsive-grid responsive-grid-2">
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 800, margin: 0 }}>Create swap order</h3>
                  <span className="badge badge-info">Tether TRC-20 {"->"} ACP</span>
                </div>

                <form onSubmit={createSwapOrder} style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Tether amount (TRC-20)</label>
                  <input className="input input-bordered w-full" value={swapForm.usdt_trc20_amount} onChange={(e) => setSwapForm((p) => ({ ...p, usdt_trc20_amount: e.target.value }))} inputMode="decimal" required />

                  <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Payout ACP address</label>
                  <input className="input input-bordered w-full" value={swapForm.payout_acp_address} onChange={(e) => setSwapForm((p) => ({ ...p, payout_acp_address: e.target.value }))} required />

                  <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Note (optional)</label>
                  <input className="input input-bordered w-full" value={swapForm.note} onChange={(e) => setSwapForm((p) => ({ ...p, note: e.target.value }))} />

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button type="button" className="btn btn-ghost" onClick={refreshQuote} disabled={busy}>Preview quote</button>
                    <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Creating..." : "Create order"}</button>
                  </div>
                </form>

                {quote && (
                  <div style={{ marginTop: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    Quote: 1 Tether TRC-20 = {quote.rate_acp_per_usdt} ACP, estimated payout <strong style={{ color: "var(--text)" }}>{quote.estimated_acp_amount} ACP</strong>
                  </div>
                )}

                <div style={{ marginTop: 16, padding: 10, border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  After creating an order, send Tether TRC-20 to the provided address with the exact reference. Then submit TXID for review.
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 800, margin: 0 }}>Swap orders</h3>
                  <span className="badge badge-active">History</span>
                </div>

                {swapOrders.length === 0 ? (
                  <div style={{ marginTop: 12, color: "var(--text-muted)" }}>No swap orders yet.</div>
                ) : (
                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {swapOrders.map((o) => (
                      <button key={o.id} type="button" className="btn btn-ghost" style={{ justifyContent: "space-between" }} onClick={() => setSelectedOrderId(o.id)}>
                        <span>{o.usdt_trc20_amount} Tether TRC-20 {"->"} {o.estimated_acp_amount} ACP</span>
                        <span>{o.status}</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedOrder && (
                  <div style={{ marginTop: 14, padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", display: "grid", gap: 8 }}>
                    <div><strong>Order:</strong> {selectedOrder.id}</div>
                    <div><strong>Status:</strong> {selectedOrder.status}</div>
                    <div><strong>Deposit Tether TRC-20:</strong> <span style={{ overflowWrap: "anywhere" }}>{selectedOrder.deposit_trc20_address}</span></div>
                    <div><strong>Reference:</strong> {selectedOrder.deposit_reference}</div>
                    <div><strong>Payout:</strong> {selectedOrder.estimated_acp_amount} ACP {"->"} {selectedOrder.payout_acp_address}</div>
                    {selectedOrder.payout_txid && <div><strong>Payout TX:</strong> {selectedOrder.payout_txid}</div>}

                    <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                      <input className="input input-bordered w-full" placeholder="TRON TXID (optional)" value={swapForm.tron_txid} onChange={(e) => setSwapForm((p) => ({ ...p, tron_txid: e.target.value }))} />
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" className="btn btn-primary" disabled={busy || !(selectedOrder.status === "awaiting_deposit" || selectedOrder.status === "pending_review")} onClick={confirmSelectedOrder}>I sent Tether TRC-20</button>
                        <button type="button" className="btn btn-ghost" disabled={busy || !(selectedOrder.status === "awaiting_deposit" || selectedOrder.status === "pending_review")} onClick={cancelSelectedOrder}>Cancel order</button>
                        <button type="button" className="btn btn-ghost" onClick={() => copy(selectedOrder.deposit_reference)}>Copy reference</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
