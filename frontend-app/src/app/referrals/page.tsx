"use client";

import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { referrals } from "@/lib/api";

function formatAmount(value: any): string {
  if (value === null || value === undefined) return "0";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

export default function ReferralsPage() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<any>(null);
  const [attributions, setAttributions] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copyState, setCopyState] = useState<"" | "copied">("");

  const referralLink = useMemo(() => {
    if (!code) return "";
    if (typeof window === "undefined") return `https://ancap.cloud/register?ref=${encodeURIComponent(code)}`;
    return `${window.location.origin}/register?ref=${encodeURIComponent(code)}`;
  }, [code]);

  async function loadAll() {
    try {
      setError("");
      const [s, attrs, rw] = await Promise.all([
        referrals.mySummary(),
        referrals.listMyAttributions(50),
        referrals.listMyRewards(50),
      ]);
      setSummary(s || null);
      setAttributions(attrs || []);
      setRewards(rw || []);
    } catch (e: any) {
      setError(e?.message || t("referralsPage.loadFailed"));
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createCode() {
    try {
      setBusy(true);
      setError("");
      const out = await referrals.createCode();
      setCode(out?.code || "");
    } catch (e: any) {
      setError(e?.message || t("referralsPage.createFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopyState("copied");
      setTimeout(() => setCopyState(""), 1400);
    } catch {
      setError(t("referralsPage.copyFailed"));
    }
  }

  return (
    <div className="page">
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div>
            <h1 className="section-title">{t("referralsPage.title")}</h1>
            <p className="section-subtitle">{t("referralsPage.subtitle")}</p>
          </div>
          <div className="action-cluster">
            <button className="btn btn-primary" onClick={createCode} disabled={busy}>
              {busy ? t("referralsPage.creating") : code ? t("referralsPage.createAnother") : t("referralsPage.createCode")}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="grid md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>{t("referralsPage.yourLink")}</h3>
            <p style={{ color: "var(--text-muted)", marginTop: 0 }}>{t("referralsPage.rewardPolicy")}</p>
            {referralLink ? (
              <>
                <input className="input" value={referralLink} readOnly />
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button className="btn btn-ghost" onClick={copyLink}>{t("referralsPage.copyLink")}</button>
                  {copyState === "copied" && <span style={{ color: "var(--color-success)" }}>{t("referralsPage.copied")}</span>}
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>{t("referralsPage.createLinkHint")}</div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>{t("referralsPage.acpRewards")}</h3>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              <div>{t("referralsPage.totalRewards")} {formatAmount(summary?.total_reward_acp_amount)} ACP</div>
              <div>{t("referralsPage.verifiedBonus")} {formatAmount(summary?.signup_bonus_acp_amount)} ACP</div>
              <div>{t("referralsPage.commissionShare")} {formatAmount(summary?.commission_share_acp_amount)} ACP</div>
              <div>{t("referralsPage.totalEvents")} {summary?.total_reward_events ?? 0}</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4" style={{ marginBottom: 16 }}>
          <div className="card">
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{t("referralsPage.clicks")}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>link</div>
          </div>
          <div className="card">
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{t("referralsPage.attributedUsers")}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>{summary?.total_attributions ?? 0}</div>
          </div>
          <div className="card">
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{t("referralsPage.paidRunRewards")}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--accent)" }}>{summary?.rewarded ?? 0}</div>
          </div>
          <div className="card">
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{t("referralsPage.payableCommission")}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--accent)" }}>{formatAmount(summary?.commission_share_acp_amount)} ACP</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>{t("referralsPage.referralStatus")}</h3>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              <div>{t("referralsPage.totalAttributions")} {summary?.total_attributions ?? 0}</div>
              <div>{t("referralsPage.pending")} {summary?.pending ?? 0}</div>
              <div>{t("referralsPage.eligible")} {summary?.eligible ?? 0}</div>
              <div>{t("referralsPage.rewarded")} {summary?.rewarded ?? 0}</div>
              <div>{t("referralsPage.rejected")} {summary?.rejected ?? 0}</div>
            </div>
            <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 13 }}>
              {t("referralsPage.lastAttributions")} {attributions.length}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>{t("referralsPage.recentPayouts")}</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>{t("referralsPage.colTime")}</th>
                    <th>{t("referralsPage.colType")}</th>
                    <th>{t("referralsPage.colAmount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((x) => (
                    <tr key={x.id}>
                      <td>{x.created_at ? new Date(x.created_at).toLocaleString() : "-"}</td>
                      <td>{x.trigger_type}</td>
                      <td>{formatAmount(x.amount_value)} {x.currency}</td>
                    </tr>
                  ))}
                  {!rewards.length && (
                    <tr>
                      <td colSpan={3} style={{ color: "var(--text-muted)" }}>
                        {t("referralsPage.noPayouts")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
