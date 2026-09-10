"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { apiFetch, getApiUrl } from "@/lib/api";

type Step = "mode" | "imap" | "smtp" | "done";

type Defaults = {
  title: string;
  subtitle: string;
  protocol: string;
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
  imap_use_ssl: boolean;
  smtp_use_tls: boolean;
  smtp_use_ssl: boolean;
  webmail_url: string;
  note: string;
};

type Connected = {
  id: string;
  email_address: string;
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
  status: string;
  last_verified_at?: string | null;
};

const field =
  "mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-300/50";
const label = "block text-sm font-medium text-white/80";
const hint = "mt-1 text-xs text-white/45";

export default function MailConnectPage() {
  const [step, setStep] = useState<Step>("mode");
  const [defaults, setDefaults] = useState<Defaults | null>(null);
  const [existing, setExisting] = useState<Connected | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [imapUsername, setImapUsername] = useState("");
  const [imapPassword, setImapPassword] = useState("");
  const [imapHost, setImapHost] = useState("mail.ancap.cloud");
  const [imapPort, setImapPort] = useState("993");
  const [imapSsl, setImapSsl] = useState(true);
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpHost, setSmtpHost] = useState("mail.ancap.cloud");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpTls, setSmtpTls] = useState(true);
  const [smtpSsl, setSmtpSsl] = useState(false);
  const [sameAsImap, setSameAsImap] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = (await fetch(`${getApiUrl()}/mail/accounts/defaults`).then((r) => r.json())) as Defaults;
        if (cancelled) return;
        setDefaults(d);
        setImapHost(d.imap_host);
        setImapPort(String(d.imap_port));
        setSmtpHost(d.smtp_host);
        setSmtpPort(String(d.smtp_port));
        setImapSsl(d.imap_use_ssl);
        setSmtpTls(d.smtp_use_tls);
        setSmtpSsl(d.smtp_use_ssl);
      } catch {
        /* defaults stay local */
      }
      try {
        const me = (await apiFetch("/mail/accounts/me")) as Connected | null;
        if (!cancelled && me) {
          setExisting(me);
          setStep("done");
        }
      } catch {
        /* not signed in or none connected */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onTest() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const body = {
        imap_username: imapUsername || emailAddress,
        imap_password: imapPassword,
        imap_host: imapHost,
        imap_port: Number(imapPort) || 993,
        imap_use_ssl: imapSsl,
        smtp_username: sameAsImap ? undefined : smtpUsername || emailAddress,
        smtp_password: sameAsImap ? undefined : smtpPassword || imapPassword,
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort) || 587,
        smtp_use_tls: smtpTls,
        smtp_use_ssl: smtpSsl,
        test_smtp: true,
      };
      const res = (await apiFetch("/mail/accounts/test", {
        method: "POST",
        body: JSON.stringify(body),
      })) as { ok: boolean; detail: string };
      if (!res.ok) throw new Error(res.detail || "Test failed");
      setInfo(res.detail || "Connection verified");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test failed");
    } finally {
      setBusy(false);
    }
  }

  async function onConnect(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const body = {
        display_name: displayName || undefined,
        email_address: emailAddress,
        imap_username: imapUsername || emailAddress,
        imap_password: imapPassword,
        imap_host: imapHost,
        imap_port: Number(imapPort) || 993,
        imap_use_ssl: imapSsl,
        smtp_username: sameAsImap ? undefined : smtpUsername || emailAddress,
        smtp_password: sameAsImap ? undefined : smtpPassword || imapPassword,
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort) || 587,
        smtp_use_tls: smtpTls,
        smtp_use_ssl: smtpSsl,
        verify: true,
      };
      const saved = (await apiFetch("/mail/accounts", {
        method: "POST",
        body: JSON.stringify(body),
      })) as Connected;
      setExisting(saved);
      setStep("done");
      setInfo("Account connected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connect failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDisconnect() {
    if (!confirm("Disconnect this mail account?")) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/mail/accounts/me", { method: "DELETE" });
      setExisting(null);
      setStep("mode");
      setInfo("Disconnected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setBusy(false);
    }
  }

  const title = defaults?.title || "Single Account";
  const subtitle = defaults?.subtitle || "Connect Any Provider Account";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <section className="rounded-3xl border border-emerald-300/20 bg-emerald-400/[0.06] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">{defaults?.protocol || "IMAP / SMTP"}</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-white/70">{subtitle}</p>
          {defaults?.note ? <p className="mt-2 text-xs leading-6 text-white/45">{defaults.note}</p> : null}
          {defaults?.webmail_url ? (
            <a
              href={defaults.webmail_url}
              className="mt-4 inline-block text-sm text-sky-200 underline decoration-sky-400/40 underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open webmail
            </a>
          ) : null}
        </section>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>
        ) : null}
        {info ? (
          <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{info}</p>
        ) : null}

        {step === "mode" ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">Choose connection</h2>
            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-4 text-left transition hover:border-emerald-300/50"
              onClick={() => setStep("imap")}
            >
              <div className="font-medium text-emerald-100">IMAP / SMTP</div>
              <div className="mt-1 text-sm text-white/55">Connect any provider with host, port, username, and password.</div>
            </button>
            <Link href="/legal" className="mt-4 inline-block text-sm text-white/50 hover:text-white/80">
              Back
            </Link>
          </section>
        ) : null}

        {step === "imap" ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">IMAP Setup</h2>
            <div className="mt-4 space-y-4">
              <label className={label}>
                Display name
                <input className={field} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Optional" />
              </label>
              <label className={label}>
                Email address
                <input
                  className={field}
                  type="email"
                  value={emailAddress}
                  onChange={(e) => {
                    setEmailAddress(e.target.value);
                    if (!imapUsername) setImapUsername(e.target.value);
                  }}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label className={label}>
                IMAP Username
                <input
                  className={field}
                  value={imapUsername}
                  onChange={(e) => setImapUsername(e.target.value)}
                  placeholder="Enter the IMAP username"
                  required
                />
                <span className={hint}>Usually your full email address</span>
              </label>
              <label className={label}>
                IMAP Password
                <input
                  className={field}
                  type="password"
                  value={imapPassword}
                  onChange={(e) => setImapPassword(e.target.value)}
                  placeholder="Enter the IMAP password"
                  required
                  autoComplete="new-password"
                />
              </label>
              <label className={label}>
                IMAP Host
                <input
                  className={field}
                  value={imapHost}
                  onChange={(e) => setImapHost(e.target.value)}
                  placeholder="Enter the IMAP host"
                  required
                />
              </label>
              <label className={label}>
                IMAP Port
                <input
                  className={field}
                  value={imapPort}
                  onChange={(e) => setImapPort(e.target.value)}
                  placeholder="Enter the IMAP port"
                  required
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={imapSsl} onChange={(e) => setImapSsl(e.target.checked)} />
                IMAP SSL / TLS
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85"
                onClick={() => setStep("mode")}
              >
                Back
              </button>
              <button
                type="button"
                className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-5 py-2.5 text-sm font-semibold text-emerald-100"
                onClick={() => setStep("smtp")}
                disabled={!emailAddress || !imapPassword || !imapHost}
              >
                Continue to SMTP
              </button>
            </div>
          </section>
        ) : null}

        {step === "smtp" ? (
          <form className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5" onSubmit={onConnect}>
            <h2 className="text-lg font-semibold">SMTP Setup</h2>
            <label className="mt-4 flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={sameAsImap} onChange={(e) => setSameAsImap(e.target.checked)} />
              Use same username / password as IMAP
            </label>
            <div className="mt-4 space-y-4">
              {!sameAsImap ? (
                <>
                  <label className={label}>
                    SMTP Username
                    <input
                      className={field}
                      value={smtpUsername}
                      onChange={(e) => setSmtpUsername(e.target.value)}
                      placeholder="Enter the SMTP username"
                    />
                  </label>
                  <label className={label}>
                    SMTP Password
                    <input
                      className={field}
                      type="password"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder="Enter the SMTP password"
                      autoComplete="new-password"
                    />
                  </label>
                </>
              ) : null}
              <label className={label}>
                SMTP Host
                <input
                  className={field}
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="Enter the SMTP host"
                  required
                />
              </label>
              <label className={label}>
                SMTP Port
                <input
                  className={field}
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="Enter the SMTP port"
                  required
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={smtpTls}
                  onChange={(e) => {
                    setSmtpTls(e.target.checked);
                    if (e.target.checked) setSmtpSsl(false);
                  }}
                />
                SMTP STARTTLS (port 587)
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={smtpSsl}
                  onChange={(e) => {
                    setSmtpSsl(e.target.checked);
                    if (e.target.checked) setSmtpTls(false);
                  }}
                />
                SMTP SSL (port 465)
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85"
                onClick={() => setStep("imap")}
              >
                Back
              </button>
              <button
                type="button"
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/85"
                onClick={onTest}
                disabled={busy}
              >
                Test connection
              </button>
              <button
                type="submit"
                className="rounded-full border border-emerald-400/40 bg-emerald-400/20 px-5 py-2.5 text-sm font-semibold text-emerald-50"
                disabled={busy}
              >
                {busy ? "Connecting…" : "Connect"}
              </button>
            </div>
          </form>
        ) : null}

        {step === "done" && existing ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">Connected</h2>
            <dl className="mt-4 space-y-2 text-sm text-white/70">
              <div>
                <dt className="text-white/40">Email</dt>
                <dd className="font-medium text-white">{existing.email_address}</dd>
              </div>
              <div>
                <dt className="text-white/40">IMAP</dt>
                <dd>
                  {existing.imap_host}:{existing.imap_port}
                </dd>
              </div>
              <div>
                <dt className="text-white/40">SMTP</dt>
                <dd>
                  {existing.smtp_host}:{existing.smtp_port}
                </dd>
              </div>
              <div>
                <dt className="text-white/40">Status</dt>
                <dd className="capitalize text-emerald-200">{existing.status}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85"
                onClick={() => {
                  setStep("imap");
                  setEmailAddress(existing.email_address);
                  setImapHost(existing.imap_host);
                  setImapPort(String(existing.imap_port));
                  setSmtpHost(existing.smtp_host);
                  setSmtpPort(String(existing.smtp_port));
                }}
              >
                Reconfigure
              </button>
              <button
                type="button"
                className="rounded-full border border-rose-400/30 px-5 py-2.5 text-sm font-semibold text-rose-100"
                onClick={onDisconnect}
                disabled={busy}
              >
                Disconnect
              </button>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
