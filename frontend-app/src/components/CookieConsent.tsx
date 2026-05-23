"use client";

import * as React from "react";
import Link from "next/link";

type CookieChoice = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
};

const STORAGE_KEY = "ancap_cookie_consent_v1";

function saveChoice(choice: Omit<CookieChoice, "necessary" | "savedAt">) {
  const payload: CookieChoice = {
    necessary: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("ancap-cookie-consent", { detail: payload }));
}

export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);
  const [customizing, setCustomizing] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setVisible(!stored);
    } catch {
      setVisible(false);
    }
  }, []);

  const persist = (choice: { analytics: boolean; marketing: boolean }) => {
    try {
      saveChoice(choice);
    } finally {
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <section
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[120] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
    >
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/12 bg-[#071020]/95 p-4 text-white shadow-[0_-18px_70px_rgba(0,0,0,0.46)] backdrop-blur-xl sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                Privacy
              </span>
              <span className="text-sm font-semibold text-white">Cookie preferences</span>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-white/72">
              ANCAP uses necessary cookies and local storage for login, wallet security, language, theme,
              and consent memory. Optional analytics or marketing storage is used only after consent.
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
              <Link className="hover:text-emerald-200" href="/legal/cookies">
                Cookie Policy
              </Link>
              <Link className="hover:text-emerald-200" href="/legal/privacy">
                Privacy Notice
              </Link>
              <Link className="hover:text-emerald-200" href="/legal/terms">
                User Agreement
              </Link>
            </div>

            {customizing && (
              <div className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-3 text-sm sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-lg px-1 py-1">
                  <input type="checkbox" checked readOnly className="mt-1 accent-emerald-400" />
                  <span>
                    <span className="block font-medium text-white/90">Necessary</span>
                    <span className="block text-xs leading-5 text-white/55">Required for security and core site features.</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-lg px-1 py-1">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(event) => setAnalytics(event.target.checked)}
                    className="mt-1 accent-emerald-400"
                  />
                  <span>
                    <span className="block font-medium text-white/90">Analytics</span>
                    <span className="block text-xs leading-5 text-white/55">Helps improve funnels, stability, and UX.</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-lg px-1 py-1 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(event) => setMarketing(event.target.checked)}
                    className="mt-1 accent-emerald-400"
                  />
                  <span>
                    <span className="block font-medium text-white/90">Marketing</span>
                    <span className="block text-xs leading-5 text-white/55">Used for campaign attribution only when enabled.</span>
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row lg:flex-col">
            {customizing ? (
              <button
                type="button"
                onClick={() => persist({ analytics, marketing })}
                className="min-h-11 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#04160f] transition hover:bg-emerald-300"
              >
                Save choices
              </button>
            ) : (
              <button
                type="button"
                onClick={() => persist({ analytics: true, marketing: true })}
                className="min-h-11 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#04160f] transition hover:bg-emerald-300"
              >
                Accept all
              </button>
            )}
            <button
              type="button"
              onClick={() => persist({ analytics: false, marketing: false })}
              className="min-h-11 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/[0.08]"
            >
              Necessary only
            </button>
            {!customizing && (
              <button
                type="button"
                onClick={() => setCustomizing(true)}
                className="min-h-11 rounded-full border border-white/12 bg-transparent px-4 py-2 text-sm font-semibold text-white/68 transition hover:bg-white/[0.06] hover:text-white"
              >
                Customize
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
