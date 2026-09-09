"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { WacpPublicActions } from "@/components/WacpPublicActions";
import { OtcIntakeDesk } from "@/components/OtcIntakeDesk";
import { AssayGcDesk } from "@/components/AssayGcDesk";
import { OwnershipProofDesk } from "@/components/OwnershipProofDesk";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { walletAcp } from "@/lib/api";

type TokenomicsBucket = {
  key: string;
  label: string;
  acp: string;
  utxo_count: number;
};

type BalanceResponse = {
  address: string;
  units: string;
  acp: string;
  utxo_count?: number;
  on_chain_acp?: string | null;
  in_work_acp?: string;
  in_work_staked_acp?: string;
  in_work_ledger_acp?: string;
  available_acp?: string;
  platform_credits_acp?: string | null;
  tokenomics_buckets?: TokenomicsBucket[] | null;
  view_mode?: "user" | "operator_hot" | null;
  vested_unlocked_acp?: string;
  vested_locked_acp?: string;
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

type SwapFormErrors = {
  usdt_trc20_amount?: string;
  payout_acp_address?: string;
};

export default function AcpWalletPage() {
  const ACP_FIXED_MIN_FEE = "0.00000100";
  const ACP_ADDRESS_RE = /^acp1[a-z0-9]{20,100}$/;
  const PASSWORD_ROTATION_ID = "password-security";
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, changePassword, logout } = useAuth();
  const { t } = useLanguage();
  const passwordSectionRef = useRef<HTMLDivElement | null>(null);

  const [depositAddress, setDepositAddress] = useState<string>("");
  const [privacyAddress, setPrivacyAddress] = useState<string>("");
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [privacyPassword, setPrivacyPassword] = useState("");
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [transactions, setTransactions] = useState<AcpTransaction[]>([]);
  const [txAddressInput, setTxAddressInput] = useState("");
  const [txAddressActive, setTxAddressActive] = useState("");
  const [txAddressBalance, setTxAddressBalance] = useState<BalanceResponse | null>(null);
  const [swapOrders, setSwapOrders] = useState<SwapOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [error, setError] = useState("");
  const [loadWarnings, setLoadWarnings] = useState<string[]>([]);

  const [swapForm, setSwapForm] = useState({
    usdt_trc20_amount: "100",
    payout_acp_address: "",
    note: "",
    tron_txid: "",
  });
  const [quote, setQuote] = useState<{ rate_acp_per_usdt: string; estimated_acp_amount: string } | null>(null);
  const [swapFormErrors, setSwapFormErrors] = useState<SwapFormErrors>({});
  const [swapInfo, setSwapInfo] = useState("");

  const [withdrawForm, setWithdrawForm] = useState({
    to_address: "",
    amount_acp: "",
    wallet_password: "",
  });
  const [withdrawFeeMode, setWithdrawFeeMode] = useState<"auto" | "manual">("auto");
  const [withdrawFeeAcp, setWithdrawFeeAcp] = useState(ACP_FIXED_MIN_FEE);
  const [withdrawResult, setWithdrawResult] = useState<any>(null);
  const [distributionPlan, setDistributionPlan] = useState("");
  const [distributionPassword, setDistributionPassword] = useState("");
  const [distributionResult, setDistributionResult] = useState<any[]>([]);
  const [passwordChangeForm, setPasswordChangeForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordChangeBusy, setPasswordChangeBusy] = useState(false);
  const [passwordChangeInfo, setPasswordChangeInfo] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const nextTarget = typeof window !== "undefined"
        ? `/wallet/acp${window.location.hash || ""}`
        : "/wallet/acp";
      router.push(`/login?next=${encodeURIComponent(nextTarget)}`);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;
    const inRecoveryMode = window.location.hash === `#${PASSWORD_ROTATION_ID}`;
    setRecoveryMode(inRecoveryMode);
    if (!inRecoveryMode) return;
    const node = passwordSectionRef.current;
    if (!node) return;
    const timer = window.setTimeout(() => {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      node.focus();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated]);

  const selectedOrder = useMemo(
    () => swapOrders.find((o) => o.id === selectedOrderId) || swapOrders[0] || null,
    [swapOrders, selectedOrderId],
  );

  useEffect(() => {
    const resolved = (depositAddress || balance?.address || "").trim();
    if (!resolved) return;
    setTxAddressInput((prev) => (prev ? prev : resolved));
  }, [depositAddress, balance?.address]);

  async function refreshAll() {
    setBusy(true);
    setError("");
    setLoadWarnings([]);
    try {
      const [addrRes, balRes, ordersRes] = await Promise.allSettled([
        walletAcp.getDepositAddress(),
        walletAcp.getHotBalance(),
        walletAcp.listSwapOrders(),
      ]);

      const warnings: string[] = [];
      const statusOf = (res: PromiseSettledResult<unknown>) =>
        res.status === "rejected" && typeof (res.reason as { status?: unknown })?.status === "number"
          ? Number((res.reason as { status: number }).status)
          : 0;

      let resolvedDeposit = "";

      if (addrRes.status === "fulfilled") {
        resolvedDeposit = String((addrRes.value as { address?: string } | null)?.address || "").trim();
        setDepositAddress(resolvedDeposit);
      } else {
        warnings.push(t("walletAcpPage.depositAddressUnavailable").replace("{error}", addrRes.reason?.message || t("walletAcpPage.unknownError")));
      }

      if (balRes.status === "fulfilled") {
        const bal = (balRes.value || null) as BalanceResponse | null;
        if (bal && !String(bal.address || "").trim() && resolvedDeposit) {
          bal.address = resolvedDeposit;
        }
        setBalance(bal);
        setTxAddressBalance(bal);
        const balAddr = String(bal?.address || "").trim();
        if (balAddr && !resolvedDeposit) {
          resolvedDeposit = balAddr;
          setDepositAddress(balAddr);
        }
      } else {
        // Fallback: plain balance endpoint still returns address when hot decorate fails.
        try {
          const fallback = (await walletAcp.getBalance()) as BalanceResponse;
          if (fallback && !String(fallback.address || "").trim() && resolvedDeposit) {
            fallback.address = resolvedDeposit;
          }
          setBalance(fallback || null);
          setTxAddressBalance(fallback || null);
          const balAddr = String(fallback?.address || "").trim();
          if (balAddr && !resolvedDeposit) {
            resolvedDeposit = balAddr;
            setDepositAddress(balAddr);
          }
          warnings.push(t("walletAcpPage.hotBalanceDegraded").replace("{error}", balRes.reason?.message || "error"));
        } catch (fallbackErr: any) {
          warnings.push(
            t("walletAcpPage.walletBalanceUnavailable").replace("{error}", balRes.reason?.message || fallbackErr?.message || t("walletAcpPage.unknownError")),
          );
        }
      }

      if (ordersRes.status === "fulfilled") {
        const orders = Array.isArray(ordersRes.value) ? ordersRes.value : [];
        setSwapOrders(orders);
        if (!selectedOrderId && orders.length > 0) {
          setSelectedOrderId(orders[0].id);
        }
      } else {
        warnings.push(t("walletAcpPage.swapHistoryUnavailable").replace("{error}", ordersRes.reason?.message || t("walletAcpPage.unknownError")));
      }

      const any401 = [addrRes, balRes, ordersRes].some((res) => statusOf(res) === 401);
      if (any401) {
        logout();
        const nextTarget =
          typeof window !== "undefined" ? `/wallet/acp${window.location.hash || ""}` : "/wallet/acp";
        router.push(`/login?next=${encodeURIComponent(nextTarget)}`);
        return;
      }

      setLoadWarnings(warnings);
    } catch (e: any) {
      setError(e?.message || t("walletAcpPage.loadFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    const v = (text || "").trim();
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
      setSwapInfo(t("walletAcpPage.copied"));
    } catch {
      setError(t("walletAcpPage.clipboardUnavailable"));
    }
  }

  function validateSwapForm(input: typeof swapForm): { valid: boolean; errors: SwapFormErrors } {
    const errors: SwapFormErrors = {};
    const amountRaw = input.usdt_trc20_amount.trim();
    const payoutAddress = input.payout_acp_address.trim();
    const amountNum = Number(amountRaw);

    if (!amountRaw) {
      errors.usdt_trc20_amount = t("walletAcpPage.tetherAmountRequired");
    } else if (!Number.isFinite(amountNum) || amountNum <= 0) {
      errors.usdt_trc20_amount = t("walletAcpPage.tetherAmountInvalid");
    }

    if (!payoutAddress) {
      errors.payout_acp_address = t("walletAcpPage.payoutAddressRequired");
    } else if (!ACP_ADDRESS_RE.test(payoutAddress)) {
      errors.payout_acp_address = t("walletAcpPage.payoutAddressInvalid");
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  async function refreshTransactionsByAddress(address: string, options?: { silent?: boolean; skipBalance?: boolean }) {
    const target = address.trim();
    if (!target) return;
    if (!options?.silent) {
      setHistoryBusy(true);
      setError("");
    }
    try {
      const requests: Promise<any>[] = [walletAcp.listTransactions({ address: target, limit: 20 })];
      if (!options?.skipBalance) {
        requests.push(walletAcp.getBalance({ address: target }));
      }
      const [txRes, balRes] = await Promise.allSettled(requests);
      if (txRes.status === "fulfilled") {
        setTransactions(Array.isArray(txRes.value) ? txRes.value : []);
      } else {
        const txErr = String(txRes.reason?.message || "");
        if (!txErr.includes("API error 502") && !txErr.includes("API error 503") && !txErr.includes("API error 504")) {
          throw txRes.reason;
        }
        setTransactions([]);
      }
      if (!options?.skipBalance) {
        if (balRes && balRes.status === "fulfilled") {
          setTxAddressBalance((balRes.value as BalanceResponse) || null);
        } else {
          const balErr = String((balRes as PromiseRejectedResult | undefined)?.reason?.message || "");
          if (!balErr.includes("API error 502") && !balErr.includes("API error 503") && !balErr.includes("API error 504")) {
            throw (balRes as PromiseRejectedResult | undefined)?.reason;
          }
          setTxAddressBalance({ address: target, units: "0", acp: "0", utxo_count: 0 });
        }
      } else if (singleWalletAddress && target === singleWalletAddress && balance) {
        setTxAddressBalance(balance);
      }
      setTxAddressActive(target);
      setHistoryLoaded(true);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("API error 401") || (e && typeof e === "object" && "status" in e && Number((e as { status?: unknown }).status) === 401)) {
        logout();
        const nextTarget =
          typeof window !== "undefined" ? `/wallet/acp${window.location.hash || ""}` : "/wallet/acp";
        router.push(`/login?next=${encodeURIComponent(nextTarget)}`);
        return;
      }
      if (!options?.silent) {
        setError(msg || t("walletAcpPage.historyLoadFailed"));
      }
    } finally {
      if (!options?.silent) {
        setHistoryBusy(false);
      }
    }
  }

  async function refreshQuote() {
    setError("");
    setSwapInfo("");
    const checked = validateSwapForm(swapForm);
    setSwapFormErrors(checked.errors);
    if (!checked.valid) {
      setQuote(null);
      return;
    }
    try {
      const q = await walletAcp.swapQuote({ usdt_trc20_amount: swapForm.usdt_trc20_amount.trim() });
      setQuote(q);
      setSwapInfo(t("walletAcpPage.quoteUpdated").replace("{amount}", q.estimated_acp_amount));
    } catch (e: any) {
      setQuote(null);
      setError(e?.message || t("walletAcpPage.quoteFailed"));
    }
  }

  async function createSwapOrder(e: React.FormEvent) {
    e.preventDefault();
    const checked = validateSwapForm(swapForm);
    setSwapFormErrors(checked.errors);
    if (!checked.valid) return;
    setBusy(true);
    setError("");
    setSwapInfo("");
    try {
      const created = await walletAcp.createSwapOrder({
        usdt_trc20_amount: swapForm.usdt_trc20_amount.trim(),
        payout_acp_address: swapForm.payout_acp_address.trim(),
        note: swapForm.note.trim() || undefined,
      });
      await refreshAll();
      setSelectedOrderId(created.id);
      setSwapInfo(t("walletAcpPage.swapCreated").replace("{id}", created.id));
      setSwapForm((prev) => ({ ...prev, tron_txid: "" }));
    } catch (e: any) {
      setError(e?.message || t("walletAcpPage.swapCreateFailed"));
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
      setError(e?.message || t("walletAcpPage.swapConfirmFailed"));
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
      setError(e?.message || t("walletAcpPage.swapCancelFailed"));
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
      const feeAcp = (withdrawFeeMode === "auto" ? ACP_FIXED_MIN_FEE : withdrawFeeAcp).trim();
      const res = await walletAcp.withdraw({
        to_address: withdrawForm.to_address.trim(),
        amount_acp: withdrawForm.amount_acp.trim(),
        fee_acp: feeAcp,
        wallet_password: withdrawForm.wallet_password,
      });
      setWithdrawResult(res);
      await refreshAll();
    } catch (e: any) {
      setError(e?.message || t("walletAcpPage.withdrawFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function runDistribution(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDistributionResult([]);
    try {
      const lines = distributionPlan
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);
      if (!lines.length) throw new Error(t("walletAcpPage.distributionNeedLine"));
      const results: any[] = [];
      for (const line of lines) {
        const [to, amount] = line.split(/\s+/);
        if (!to || !amount) throw new Error(t("walletAcpPage.distributionInvalidLine").replace("{line}", line));
        const res = await walletAcp.withdraw({
          to_address: to,
          amount_acp: amount,
          fee_acp: ACP_FIXED_MIN_FEE,
          wallet_password: distributionPassword,
        });
        results.push({ to, amount, ...res });
      }
      setDistributionResult(results);
      await refreshAll();
    } catch (e: any) {
      setError(e?.message || t("walletAcpPage.distributionFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function submitPasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordChangeBusy(true);
    setError("");
    setPasswordChangeInfo("");
    try {
      if (passwordChangeForm.current_password.length < 8) {
        throw new Error(t("walletAcpPage.currentPasswordRequired"));
      }
      if (passwordChangeForm.new_password.length < 8) {
        throw new Error(t("walletAcpPage.newPasswordMin"));
      }
      if (passwordChangeForm.new_password !== passwordChangeForm.confirm_password) {
        throw new Error(t("walletAcpPage.passwordsMismatch"));
      }
      await changePassword(passwordChangeForm.current_password, passwordChangeForm.new_password);
      setPasswordChangeForm({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordChangeInfo(t("walletAcpPage.passwordUpdated"));
    } catch (e: any) {
      setError(e?.message || t("walletAcpPage.passwordChangeFailed"));
    } finally {
      setPasswordChangeBusy(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  const singleWalletAddress = (depositAddress || balance?.address || "").trim();
  const isSwapFormValid = validateSwapForm(swapForm).valid;
  const withdrawAvailableNum = Number(balance?.available_acp ?? balance?.acp ?? "0");
  const withdrawAmountNum = Number(withdrawForm.amount_acp);
  const withdrawAmountValid =
    withdrawForm.amount_acp.trim() !== "" &&
    Number.isFinite(withdrawAmountNum) &&
    withdrawAmountNum > 0;
  const withdrawAddressValid = ACP_ADDRESS_RE.test(withdrawForm.to_address.trim());
  const withdrawPasswordValid = withdrawForm.wallet_password.length > 0;
  const withdrawExceedsBalance =
    Number.isFinite(withdrawAvailableNum) &&
    withdrawAmountValid &&
    withdrawAmountNum > withdrawAvailableNum;
  const isOperatorHotView = balance?.view_mode === "operator_hot";
  const withdrawDisabled =
    busy ||
    !withdrawAddressValid ||
    !withdrawAmountValid ||
    !withdrawPasswordValid ||
    withdrawExceedsBalance;

  return (
    <>
      <div className="min-h-screen">
        <Navigation />

        <div className="container" style={{ padding: "48px 24px" }}>
          <div style={{ display: "grid", gap: 16, marginBottom: 18 }}>
            <div style={{ maxWidth: 760 }}>
              <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0, color: "var(--text)" }}>
                {t("walletAcpPage.title")}
              </h1>
            </div>
          </div>

          {error && (
            <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "0.9rem", marginBottom: "18px" }}>
              {error}
            </div>
          )}
          {swapInfo && (
            <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontSize: "0.9rem", marginBottom: "18px" }}>
              {swapInfo}
            </div>
          )}
          {passwordChangeInfo && (
            <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontSize: "0.9rem", marginBottom: "18px" }}>
              {passwordChangeInfo}
            </div>
          )}

          <div style={{ display: "grid", gap: 16 }}>
            {loadWarnings.length > 0 && (
              <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", fontSize: "0.9rem", marginBottom: "2px", display: "grid", gap: 6 }}>
                {loadWarnings.map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>
            )}

            <div className="responsive-grid responsive-grid-3">
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 800, margin: 0 }}>{t("walletAcpPage.depositAddress")}</h3>
                  <span className="badge badge-info">ACP</span>
                </div>
                <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: "0.9rem" }}>{t("walletAcpPage.sendAcpTo")}</div>
                <div style={{ marginTop: 10, padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                  {busy && !singleWalletAddress ? t("walletAcpPage.loading") : singleWalletAddress || t("walletAcpPage.dash")}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => copy(singleWalletAddress)} disabled={!singleWalletAddress}>{t("walletAcpPage.copy")}</button>
                </div>
                <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <h4 style={{ margin: "0 0 8px", fontWeight: 800 }}>{t("walletAcpPage.privacyReceive")}</h4>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                    {t("walletAcpPage.privacyReceiveLead")}
                  </p>
                  <input
                    type="password"
                    placeholder={t("walletAcpPage.walletPasswordOnce")}
                    value={privacyPassword}
                    onChange={(e) => setPrivacyPassword(e.target.value)}
                    style={{ marginTop: 10, width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: 10 }}
                    disabled={privacyBusy}
                    onClick={() => {
                      void (async () => {
                        setPrivacyBusy(true);
                        setError("");
                        try {
                          const res = (await walletAcp.privacyReceiveAddress({
                            wallet_password: privacyPassword || undefined,
                            label: "web-wallet",
                          })) as { address?: string };
                          setPrivacyAddress(res.address || "");
                          setPrivacyPassword("");
                        } catch (err) {
                          setError(err instanceof Error ? err.message : t("walletAcpPage.privacyAddressFailed"));
                        } finally {
                          setPrivacyBusy(false);
                        }
                      })();
                    }}
                  >
                    {privacyBusy ? t("walletAcpPage.generating") : t("walletAcpPage.newPrivacyAddress")}
                  </button>
                  {privacyAddress ? (
                    <div style={{ marginTop: 10, padding: 12, borderRadius: 10, border: "1px solid var(--border)", overflowWrap: "anywhere" }}>
                      {privacyAddress}
                      <div style={{ marginTop: 8 }}>
                        <button type="button" className="btn btn-ghost" onClick={() => copy(privacyAddress)}>{t("walletAcpPage.copy")}</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 800, margin: 0 }}>{isOperatorHotView ? t("walletAcpPage.operatorHotWallet") : t("walletAcpPage.walletBalance")}</h3>
                  <span className="badge badge-active">{t("walletAcpPage.live")}</span>
                </div>
                <div style={{ marginTop: 12, fontSize: "2rem", fontWeight: 900, color: "var(--text)", overflowWrap: "anywhere" }}>
                  {busy && !balance ? t("walletAcpPage.loading") : (balance?.acp ?? t("walletAcpPage.dash"))} <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-muted)" }}>ACP</span>
                </div>
                {balance?.utxo_count != null && <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: "0.85rem" }}>{t("walletAcpPage.utxoCount").replace("{n}", String(balance.utxo_count))}</div>}

                {isOperatorHotView && balance?.tokenomics_buckets && balance.tokenomics_buckets.length > 0 ? (
                  <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    {balance.tokenomics_buckets.map((bucket) => (
                      <div
                        key={bucket.key}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "var(--bg)",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <strong style={{ color: "var(--text)" }}>{bucket.label}</strong>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                          <strong style={{ color: "var(--text)" }}>{bucket.acp} ACP</strong>
                          {t(bucket.utxo_count === 1 ? "walletAcpPage.utxoOne" : "walletAcpPage.utxoMany").replace("{n}", String(bucket.utxo_count))}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {balance?.units != null && balance.units !== "" && (
                      <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: "0.78rem", lineHeight: 1.45 }}>
                        {t("walletAcpPage.smallestUnits")} <strong style={{ color: "var(--text)", fontWeight: 700 }}>{balance.units}</strong>
                        <span style={{ opacity: 0.85 }}> {t("walletAcpPage.smallestUnitsHint")}</span>
                      </div>
                    )}
                    {balance?.on_chain_acp != null && balance.on_chain_acp !== "" && (
                      <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {t("walletAcpPage.totalOnChain")} <strong style={{ color: "var(--text)" }}>{balance.on_chain_acp} ACP</strong>
                      </div>
                    )}
                  </>
                )}

                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {isOperatorHotView ? t("walletAcpPage.yourPlatformCredits") : t("walletAcpPage.account")}
                  </div>
                  {isOperatorHotView && balance?.platform_credits_acp != null && (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {t("walletAcpPage.creditedBalance")} <strong style={{ color: "var(--text)" }}>{balance.platform_credits_acp} ACP</strong>
                    </div>
                  )}
                  {!isOperatorHotView && (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {t("walletAcpPage.yourBalance")} <strong style={{ color: "var(--text)" }}>{balance?.acp ?? "0"} ACP</strong>
                    </div>
                  )}
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    <span title={t("walletAcpPage.inWorkTitle")}>
                      {t("walletAcpPage.inWork")}
                    </span>
                    : <strong style={{ color: "var(--text)" }}>{balance?.in_work_acp ?? "0"} ACP</strong>
                  </div>
                  {(balance?.in_work_staked_acp != null || balance?.in_work_ledger_acp != null) && (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", lineHeight: 1.45 }}>
                      {t("walletAcpPage.stakesLedger").replace("{stakes}", balance?.in_work_staked_acp ?? "—").replace("{ledger}", balance?.in_work_ledger_acp ?? "—")}
                    </div>
                  )}
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {t("walletAcpPage.availableForWithdraw")} <strong style={{ color: "var(--text)" }}>{balance?.available_acp ?? balance?.acp ?? "0"} ACP</strong>
                  </div>
                </div>
                {balance?.vested_unlocked_acp != null && (
                  <div style={{ marginTop: 4, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {t("walletAcpPage.vestedUnlocked")} <strong style={{ color: "var(--text)" }}>{balance.vested_unlocked_acp} ACP</strong>
                  </div>
                )}
                {balance?.vested_locked_acp != null && (
                  <div style={{ marginTop: 4, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {t("walletAcpPage.vestedLocked")} <strong style={{ color: "var(--text)" }}>{balance.vested_locked_acp} ACP</strong>
                  </div>
                )}
                {balance?.balance_note ? <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.5 }}>{balance.balance_note}</div> : null}
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 800, margin: 0 }}>{t("walletAcpPage.withdraw")}</h3>
                  <span className="badge badge-warning">{t("walletAcpPage.signed")}</span>
                </div>
                <form onSubmit={doWithdraw} style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <input placeholder={t("walletAcpPage.toAddressPlaceholder")} value={withdrawForm.to_address} onChange={(e) => setWithdrawForm((p) => ({ ...p, to_address: e.target.value.trim() }))} className="input input-bordered w-full" required aria-invalid={withdrawForm.to_address.length > 0 && !withdrawAddressValid} autoComplete="off" />
                  {withdrawForm.to_address.length > 0 && !withdrawAddressValid && <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>{t("walletAcpPage.addressMustStartAcp1Before")} <code>acp1</code>{t("walletAcpPage.addressMustStartAcp1After")}</div>}
                  <input placeholder={t("walletAcpPage.amountAcpPlaceholder")} value={withdrawForm.amount_acp} onChange={(e) => setWithdrawForm((p) => ({ ...p, amount_acp: e.target.value }))} className="input input-bordered w-full" inputMode="decimal" required aria-invalid={withdrawForm.amount_acp.length > 0 && (!withdrawAmountValid || withdrawExceedsBalance)} />
                  {withdrawExceedsBalance && <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>{t("walletAcpPage.amountExceedsBalance").replace("{amount}", balance?.available_acp ?? balance?.acp ?? "0")}</div>}
                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{t("walletAcpPage.feeMode")}</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" className="btn btn-ghost" onClick={() => { setWithdrawFeeMode("auto"); setWithdrawFeeAcp(ACP_FIXED_MIN_FEE); }} style={{ borderColor: withdrawFeeMode === "auto" ? "rgba(16, 185, 129, 0.5)" : undefined, color: withdrawFeeMode === "auto" ? "#34d399" : undefined }}>{t("walletAcpPage.auto")}</button>
                      <button type="button" className="btn btn-ghost" onClick={() => setWithdrawFeeMode("manual")} style={{ borderColor: withdrawFeeMode === "manual" ? "rgba(16, 185, 129, 0.5)" : undefined, color: withdrawFeeMode === "manual" ? "#34d399" : undefined }}>{t("walletAcpPage.manual")}</button>
                    </div>
                    <input placeholder={t("walletAcpPage.feeAcpPlaceholder")} value={withdrawFeeAcp} onChange={(e) => setWithdrawFeeAcp(e.target.value)} className="input input-bordered w-full" inputMode="decimal" disabled={withdrawFeeMode === "auto"} />
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {withdrawFeeMode === "auto" ? t("walletAcpPage.autoFeeHint").replace("{fee}", ACP_FIXED_MIN_FEE) : t("walletAcpPage.manualFeeHint")}
                    </div>
                  </div>
                  <input type="password" placeholder={t("walletAcpPage.walletPassword")} value={withdrawForm.wallet_password} onChange={(e) => setWithdrawForm((p) => ({ ...p, wallet_password: e.target.value }))} className="input input-bordered w-full" required autoComplete="current-password" />
                  <button className="btn btn-primary" type="submit" disabled={withdrawDisabled}>{busy ? t("walletAcpPage.sending") : t("walletAcpPage.withdraw")}</button>
                </form>
                {withdrawResult && <pre style={{ marginTop: 10, padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", overflowX: "auto" }}>{JSON.stringify(withdrawResult, null, 2)}</pre>}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <h4 style={{ margin: 0 }}>{t("walletAcpPage.bulkDistribution")}</h4>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 4 }}>{t("walletAcpPage.bulkHintBefore")} <code>acp1... amount</code></div>
                  <form onSubmit={runDistribution} style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    <textarea className="input input-bordered w-full" rows={5} value={distributionPlan} onChange={(e) => setDistributionPlan(e.target.value)} placeholder={"acp1... 25000\nacp1... 15000"} />
                    <input type="password" className="input input-bordered w-full" placeholder={t("walletAcpPage.walletPassword")} value={distributionPassword} onChange={(e) => setDistributionPassword(e.target.value)} required />
                    <button className="btn btn-ghost" type="submit" disabled={busy}>{busy ? t("walletAcpPage.processing") : t("walletAcpPage.runBulk")}</button>
                  </form>
                  {distributionResult.length > 0 && <pre style={{ marginTop: 8, padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", overflowX: "auto" }}>{JSON.stringify(distributionResult, null, 2)}</pre>}
                </div>
              </div>
            </div>

            <div className="card" id={PASSWORD_ROTATION_ID} ref={passwordSectionRef} tabIndex={-1} style={{ maxWidth: 760, scrollMarginTop: 110 }}>
              {recoveryMode && (
                <div style={{ marginBottom: 14, padding: "12px", borderRadius: "8px", background: "rgba(245,158,11,0.12)", color: "#fbbf24", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{t("walletAcpPage.recoveryTitle")}</div>
                  <div>{t("walletAcpPage.recoveryLine1")}</div>
                  <div>{t("walletAcpPage.recoveryLine2")}</div>
                  <div>{t("walletAcpPage.recoveryLine3")}</div>
                </div>
              )}
              <div className="card-header">
                <h3 style={{ fontWeight: 800, margin: 0 }}>{t("walletAcpPage.passwordSectionTitle")}</h3>
                <span className="badge badge-warning">{t("walletAcpPage.safeRotation")}</span>
              </div>
              <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                {t("walletAcpPage.passwordSectionLead")}
              </div>
              <form onSubmit={submitPasswordChange} style={{ marginTop: 14, display: "grid", gap: 10, maxWidth: 420 }}>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  placeholder={t("walletAcpPage.currentPassword")}
                  value={passwordChangeForm.current_password}
                  onChange={(e) => setPasswordChangeForm((p) => ({ ...p, current_password: e.target.value }))}
                  autoComplete="current-password"
                  required
                />
                <input
                  type="password"
                  className="input input-bordered w-full"
                  placeholder={t("walletAcpPage.newPassword")}
                  value={passwordChangeForm.new_password}
                  onChange={(e) => setPasswordChangeForm((p) => ({ ...p, new_password: e.target.value }))}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <input
                  type="password"
                  className="input input-bordered w-full"
                  placeholder={t("walletAcpPage.confirmNewPassword")}
                  value={passwordChangeForm.confirm_password}
                  onChange={(e) => setPasswordChangeForm((p) => ({ ...p, confirm_password: e.target.value }))}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <button className="btn btn-primary" type="submit" disabled={passwordChangeBusy}>
                  {passwordChangeBusy ? t("walletAcpPage.updatingPassword") : t("walletAcpPage.changePasswordSafely")}
                </button>
              </form>
            </div>

            <div className="responsive-grid responsive-grid-2">
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 800, margin: 0 }}>{t("walletAcpPage.internalSwapDesk")}</h3>
                  <span className="badge badge-info">Tether TRC-20 {"->"} ACP</span>
                </div>

                <form onSubmit={createSwapOrder} style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{t("walletAcpPage.tetherAmountLabel")}</label>
                  <input className="input input-bordered w-full" value={swapForm.usdt_trc20_amount} onChange={(e) => { const value = e.target.value; setSwapForm((p) => ({ ...p, usdt_trc20_amount: value })); setSwapFormErrors((prev) => ({ ...prev, usdt_trc20_amount: undefined })); }} inputMode="decimal" required />
                  {swapFormErrors.usdt_trc20_amount && <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>{swapFormErrors.usdt_trc20_amount}</div>}

                  <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{t("walletAcpPage.payoutAcpAddress")}</label>
                  <input className="input input-bordered w-full" value={swapForm.payout_acp_address} onChange={(e) => { const value = e.target.value.trim(); setSwapForm((p) => ({ ...p, payout_acp_address: value })); setSwapFormErrors((prev) => ({ ...prev, payout_acp_address: undefined })); }} required />
                  {swapFormErrors.payout_acp_address && <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>{swapFormErrors.payout_acp_address}</div>}
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{t("walletAcpPage.useLowercaseAcp1Before")} <code>acp1</code>{t("walletAcpPage.useLowercaseAcp1After")}</div>

                  <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{t("walletAcpPage.noteOptional")}</label>
                  <input className="input input-bordered w-full" value={swapForm.note} onChange={(e) => setSwapForm((p) => ({ ...p, note: e.target.value }))} />

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button type="button" className="btn btn-ghost" onClick={refreshQuote} disabled={busy}>{t("walletAcpPage.previewQuote")}</button>
                    <button type="submit" className="btn btn-primary" disabled={busy || !isSwapFormValid}>{busy ? t("walletAcpPage.creating") : t("walletAcpPage.createOrder")}</button>
                  </div>
                </form>

                {quote && (
                  <div style={{ marginTop: 12, color: "var(--text-muted)", lineHeight: 1.7, border: "1px solid var(--border)", borderRadius: 8, padding: 10, background: "var(--bg)" }}>
                    <div>{t("walletAcpPage.quoteRate").replace("{rate}", quote.rate_acp_per_usdt)}</div>
                    <div>{t("walletAcpPage.estimatedPayout")} <strong style={{ color: "var(--text)" }}>{quote.estimated_acp_amount} ACP</strong></div>
                  </div>
                )}

                <div style={{ marginTop: 16, padding: 10, border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  {t("walletAcpPage.swapDeskHint")}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 800, margin: 0 }}>{t("walletAcpPage.swapOrders")}</h3>
                  <span className="badge badge-active">{t("walletAcpPage.history")}</span>
                </div>

                {swapOrders.length === 0 ? (
                  <div style={{ marginTop: 12, color: "var(--text-muted)" }}>{t("walletAcpPage.noSwapOrders")}</div>
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
                    <div><strong>{t("walletAcpPage.orderLabel")}</strong> {selectedOrder.id}</div>
                    <div><strong>{t("walletAcpPage.statusLabel")}</strong> {selectedOrder.status}</div>
                    <div><strong>{t("walletAcpPage.depositTether")}</strong> <span style={{ overflowWrap: "anywhere" }}>{selectedOrder.deposit_trc20_address}</span></div>
                    <div><strong>{t("walletAcpPage.referenceLabel")}</strong> {selectedOrder.deposit_reference}</div>
                    <div><strong>{t("walletAcpPage.payoutLabel")}</strong> {selectedOrder.estimated_acp_amount} ACP {"->"} {selectedOrder.payout_acp_address}</div>
                    {selectedOrder.payout_txid && <div><strong>{t("walletAcpPage.payoutTx")}</strong> {selectedOrder.payout_txid}</div>}

                    <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                      <input className="input input-bordered w-full" placeholder={t("walletAcpPage.tronTxidOptional")} value={swapForm.tron_txid} onChange={(e) => setSwapForm((p) => ({ ...p, tron_txid: e.target.value }))} />
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" className="btn btn-primary" disabled={busy || !(selectedOrder.status === "awaiting_deposit" || selectedOrder.status === "pending_review")} onClick={confirmSelectedOrder}>{t("walletAcpPage.iSentTether")}</button>
                        <button type="button" className="btn btn-ghost" disabled={busy || !(selectedOrder.status === "awaiting_deposit" || selectedOrder.status === "pending_review")} onClick={cancelSelectedOrder}>{t("walletAcpPage.cancelOrder")}</button>
                        <button type="button" className="btn btn-ghost" onClick={() => copy(selectedOrder.deposit_reference)}>{t("walletAcpPage.copyReference")}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <OtcIntakeDesk defaultPayoutAddress={singleWalletAddress} />
            <div style={{ marginTop: 24 }}>
              <AssayGcDesk />
              <OwnershipProofDesk />
            </div>

            <div className="card" style={{ border: "1px solid rgba(56, 189, 248, 0.22)", background: "linear-gradient(180deg, rgba(14, 165, 233, 0.08), rgba(255,255,255,0.02))" }}>
              <div className="card-header">
                <h3 style={{ fontWeight: 800, margin: 0 }}>{t("walletAcpPage.wacpTitle")}</h3>
                <span className="badge badge-info">ACP {"->"} BSC</span>
              </div>
              <div style={{ marginTop: 12, display: "grid", gap: 8, color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.65 }}>
                <div>{t("walletAcpPage.pairLiveBefore")} <strong style={{ color: "var(--text)" }}>wACP/USDT</strong> {t("walletAcpPage.pairLiveAfter")}</div>
                <div>{t("walletAcpPage.poolLabel")} <code>0xF391ca2bcBaB93Afa23326ebF1e35DB950841601</code></div>
                <div>{t("walletAcpPage.contractLabel")} <code>0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402</code></div>
                <div>{t("walletAcpPage.liveRailBefore")} <strong style={{ color: "var(--text)" }}>{t("walletAcpPage.liveRailValue")}</strong></div>
                <div>{t("walletAcpPage.plannedRailBefore")} <strong style={{ color: "var(--text)" }}>{t("walletAcpPage.plannedRailValue")}</strong> {t("walletAcpPage.plannedRailAfter")}</div>
                <div>{t("walletAcpPage.currentState")}</div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14, alignItems: "flex-start" }}>
                <Link href="/bridge/acp-bsc" className="btn btn-primary">{t("walletAcpPage.openBridge")}</Link>
                <WacpPublicActions layout="compact" />
                <a href="https://pancakeswap.finance/swap?inputCurrency=0x55d398326f99059fF775485246999027B3197955&outputCurrency=0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402" className="btn btn-ghost" target="_blank" rel="noreferrer">{t("walletAcpPage.openSwap")}</a>
                <a href="https://pancakeswap.finance/liquidity/pool/bsc/0xF391ca2bcBaB93Afa23326ebF1e35DB950841601" className="btn btn-ghost" target="_blank" rel="noreferrer">{t("walletAcpPage.viewPool")}</a>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 style={{ fontWeight: 800, margin: 0 }}>{t("walletAcpPage.onChainHistory")}</h3>
                <span className="badge badge-active">{t("walletAcpPage.explorer")}</span>
              </div>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <label style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{t("walletAcpPage.addressLabel")}</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input className="input input-bordered w-full" value={txAddressInput} onChange={(e) => setTxAddressInput(e.target.value)} placeholder="acp1..." />
                  <button type="button" className="btn btn-ghost" onClick={() => refreshTransactionsByAddress(txAddressInput)} disabled={historyBusy || !txAddressInput.trim()}>{t("walletAcpPage.loadHistory")}</button>
                  <button type="button" className="btn btn-ghost" onClick={() => { const walletAddress = (singleWalletAddress || "").trim(); if (!walletAddress) return; setTxAddressInput(walletAddress); refreshTransactionsByAddress(walletAddress, { skipBalance: !!balance }); }} disabled={historyBusy || !singleWalletAddress}>{t("walletAcpPage.useMyWallet")}</button>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{t("walletAcpPage.showing")} <span style={{ color: "var(--text)" }}>{txAddressActive || t("walletAcpPage.dash")}</span></div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  {t("walletAcpPage.balanceLabel")} <strong style={{ color: "var(--text)" }}>{txAddressBalance?.acp ?? "0"} ACP</strong>
                  {txAddressBalance?.utxo_count != null ?  t("walletAcpPage.utxoOne").replace("{n}", String(txAddressBalance.utxo_count)) : ""}
                  {txAddressBalance?.units != null && txAddressBalance.units !== "" ? <span style={{ fontSize: "0.78rem", display: "block", marginTop: 4, opacity: 0.9 }}>{t("walletAcpPage.unitsLine").replace("{units}", txAddressBalance.units)}</span> : null}
                </div>
              </div>

              {!historyLoaded ? (
                <div style={{ marginTop: 12, color: "var(--text-muted)" }}>{t("walletAcpPage.historyOnDemandBefore")} <strong style={{ color: "var(--text)" }}>{t("walletAcpPage.loadHistory")}</strong> {t("walletAcpPage.historyOnDemandAfter")}</div>
              ) : transactions.length === 0 ? (
                <div style={{ marginTop: 12, color: "var(--text-muted)" }}>{t("walletAcpPage.noTransactions")}</div>
              ) : (
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {transactions.map((tx) => (
                    <div key={`${tx.txid}-${tx.block_height}`} style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", display: "grid", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <strong>{tx.direction.toUpperCase()}</strong>
                        <span style={{ color: "var(--text-muted)" }}>{t("walletAcpPage.blockConf").replace("{height}", String(tx.block_height)).replace("{conf}", String(tx.confirmations))}</span>
                      </div>
                      <div style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>{tx.txid}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ color: "var(--text-muted)" }}>{t("walletAcpPage.sentLabel").replace("{amount}", tx.sent_acp)}</span>
                        <span style={{ color: "var(--text-muted)" }}>{t("walletAcpPage.receivedLabel").replace("{amount}", tx.received_acp)}</span>
                        <strong style={{ color: tx.net_acp.startsWith("-") ? "#ef4444" : "#10b981" }}>{t("walletAcpPage.netLabel").replace("{amount}", tx.net_acp)}</strong>
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{tx.block_time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
