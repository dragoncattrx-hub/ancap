"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";

type NavItem = {
  label: string;
  href: string;
  /** When set, label text comes from translations (e.g. nav.acpWallet). */
  i18nKey?: string;
};

function navItemLabel(item: NavItem, t: (key: string) => string): string {
  return item.i18nKey ? t(item.i18nKey) : item.label;
}

const primaryNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Feed", href: "/feed" },
  { label: "Agents", href: "/agents" },
  { label: "Strategies", href: "/strategies" },
  { label: "Verticals", href: "/verticals" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Reputation", href: "/reputation" },
  { label: "Ledger", href: "/ledger" },
];

const secondaryNav: NavItem[] = [
  { label: "AI Console", href: "/ai-console" },
  { label: "Referrals", href: "/referrals" },
  { label: "Evolution", href: "/evolution" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Bounties", href: "/bounties" },
  { label: "Chain Receipts", href: "/chain-receipts" },
  { label: "Operations NOC", href: "/operations-noc" },
  { label: "AI Council", href: "/ai-council" },
  { label: "Strategy Compiler", href: "/strategy-compiler" },
  { label: "Governance", href: "/governance" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Notifications", href: "/notifications" },
  { label: "Leaderboards", href: "/leaderboards" },
  { label: "Growth", href: "/growth" },
  { label: "Pools", href: "/pools" },
  { label: "Funds", href: "/funds" },
  { label: "Staking", href: "/staking" },
  { label: "Orders", href: "/orders" },
  { label: "Access", href: "/access" },
  { label: "Seller", href: "/dashboard/seller" },
  { label: "Flows", href: "/flows" },
  { label: "Runs", href: "/runs" },
  { label: "Contracts", href: "/contracts" },
  { label: "Listings", href: "/listings" },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type LangCode = "en" | "ru" | "uk";
const LANG_OPTIONS: ReadonlyArray<{ code: LangCode; label: string }> = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "uk", label: "UK" },
];

/**
 * Accessible language switcher.
 *
 * Implements WAI-ARIA radiogroup semantics so screen readers announce
 * "1 of 3" and arrow keys move the selection. Visually it stays a row of
 * three buttons inside a pill, the same as before.
 */
function LangSwitcher({
  lang,
  setLang,
  size = "default",
}: {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  size?: "default" | "compact";
}) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    let nextIdx = idx;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % LANG_OPTIONS.length;
    else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + LANG_OPTIONS.length) % LANG_OPTIONS.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = LANG_OPTIONS.length - 1;
    setLang(LANG_OPTIONS[nextIdx].code);
  };

  const padCls = size === "compact"
    ? "rounded-full px-2 py-1 text-[11px] font-medium transition sm:px-3 sm:py-1.5 sm:text-[12px]"
    : "rounded-full px-3 py-1.5 text-[12px] font-medium transition";
  const wrapCls = size === "compact"
    ? "flex origin-right scale-[0.92] items-center rounded-full border border-white/10 bg-white/[0.03] p-0.5 sm:scale-100 sm:p-1"
    : "flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1";

  return (
    <div role="radiogroup" aria-label="Language" className={wrapCls}>
      {LANG_OPTIONS.map((opt, idx) => {
        const active = lang === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => setLang(opt.code)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            className={cn(
              padCls,
              active
                ? "bg-emerald-400/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/30"
                : "text-white/50 hover:text-white/85"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function HeaderLink({
  item,
  label,
  active,
  compact = false,
  onClick,
}: {
  item: NavItem;
  label: string;
  active: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "relative rounded-md transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30",
        compact ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]",
        active ? "text-white" : "text-white/58 hover:text-white/90"
      )}
    >
      <span className="relative z-10">{label}</span>

      {active && (
        <>
          <span className="absolute inset-0 rounded-md bg-white/[0.045]" />
          <span className="absolute inset-x-2 bottom-0 h-px bg-emerald-400/80" />
        </>
      )}
    </Link>
  );
}

export function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const acpUrl = process.env.NEXT_PUBLIC_ACP_URL || "/acp";

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const userLabel = user?.display_name || user?.email || "";

  return (
    <header className="sticky top-0 z-[100] border-b border-white/8 bg-[#040816]/84 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-h-[78px] items-center justify-between gap-2 sm:gap-4 lg:min-h-[92px]">
          {/* Left: Brand */}
          <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-6">
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="relative flex items-center justify-center">
                <span className="absolute h-4 w-4 rounded-full bg-emerald-400/20 blur-md" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.85)]" />
              </span>
              <span className="text-[26px] font-semibold tracking-[-0.05em] text-white sm:text-[30px]">
                ANCAP
              </span>
            </Link>
          </div>

          {/* Center: primary + secondary links (lg+); below lg — compact bar + drawer */}
          <div className="hidden min-w-0 flex-1 lg:flex lg:flex-col lg:justify-center">
            {isAuthenticated ? (
              <>
                <nav className="flex flex-wrap items-center gap-x-1 gap-y-1">
                  {primaryNav.map((item) => (
                    <HeaderLink
                      key={item.href}
                      item={item}
                      label={navItemLabel(item, t)}
                      active={pathname === item.href}
                    />
                  ))}
                </nav>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-1">
                  {secondaryNav.map((item) => (
                    <HeaderLink
                      key={item.href}
                      item={item}
                      label={navItemLabel(item, t)}
                      active={pathname === item.href}
                      compact
                    />
                  ))}
                </div>
              </>
            ) : (
              <nav className="flex flex-wrap items-center gap-2 text-[13px]">
                <Link href="/#product" className="rounded-md px-3 py-1.5 text-white/60 transition hover:text-white/90">
                  {t("nav.product")}
                </Link>
                <Link href="/#vision" className="rounded-md px-3 py-1.5 text-white/60 transition hover:text-white/90">
                  {t("nav.vision")}
                </Link>
                <Link href={acpUrl} className="rounded-md px-3 py-1.5 text-white/60 transition hover:text-white/90">
                  {t("hero.acpToken")}
                </Link>
              </nav>
            )}
          </div>

          {/* Right: wallet + lang + auth (lg+) */}
          <div className="hidden min-w-0 shrink-0 items-center gap-2 sm:gap-3 lg:flex">
            <Link
              href="/wallet/acp"
              className="whitespace-nowrap rounded-full border border-emerald-400/40 bg-emerald-400/12 px-3 py-2 text-[12px] font-semibold text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.12)] transition hover:bg-emerald-400/20 hover:text-white"
            >
              {t("nav.acpWallet")}
            </Link>
            <div className="h-6 w-px shrink-0 bg-white/10" />
            <LangSwitcher lang={lang} setLang={setLang} />

            <div className="h-6 w-px bg-white/10" />

            {isAuthenticated ? (
              <>
                <span className="text-[13px] font-medium text-white/72">{userLabel}</span>
                <button
                  onClick={logout}
                  className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-white/88 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-white/88 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-emerald-400/15 px-4 py-2 text-[13px] font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/30 transition hover:bg-emerald-400/20"
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>

          {/* Narrow: wallet + lang + menu; lang tucked in menu on xs to avoid horizontal clip (body overflow-x) */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2 lg:hidden">
            <Link
              href="/wallet/acp"
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-emerald-400/45 bg-emerald-400/14 px-2 py-2 text-[10px] font-semibold text-emerald-50 shadow-[0_0_18px_rgba(52,211,153,0.15)] transition hover:bg-emerald-400/24 sm:min-h-11 sm:px-3 sm:text-[12px]"
            >
              <span className="sm:hidden">{t("hero.acpWalletLink")}</span>
              <span className="hidden sm:inline">{t("nav.acpWallet")}</span>
            </Link>
            <LangSwitcher lang={lang} setLang={setLang} size="compact" />

            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/85 transition hover:bg-white/[0.06] sm:h-11 sm:w-11"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? "×" : "≡"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileMenuOpen && (
        <div className="border-t border-white/8 bg-[#060b18]/98 lg:hidden">
          <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6">
            {isAuthenticated ? (
              <div className="grid gap-5">
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">
                    {t("nav.main")}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {primaryNav.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-[13px] transition",
                            active
                              ? "border-emerald-400/30 bg-emerald-400/10 text-white"
                              : "border-white/8 bg-white/[0.02] text-white/65 hover:bg-white/[0.04] hover:text-white"
                          )}
                        >
                          {navItemLabel(item, t)}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">
                    {t("nav.system")}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {secondaryNav.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-[13px] transition",
                            active
                              ? "border-emerald-400/30 bg-emerald-400/10 text-white"
                              : "border-white/8 bg-white/[0.02] text-white/65 hover:bg-white/[0.04] hover:text-white"
                          )}
                        >
                          {navItemLabel(item, t)}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                  <div className="flex flex-col gap-1">
                    <div className="text-[13px] text-white/80">{userLabel}</div>
                    <Link
                      href="/wallet/acp"
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-flex items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1.5 text-[12px] font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/40 transition hover:bg-emerald-400/25"
                    >
                      {t("nav.acpWallet")}
                    </Link>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[13px] text-white/85 transition hover:bg-white/[0.06]"
                  >
                    {t("nav.logout")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/#product"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 text-[13px] text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    {t("nav.product")}
                  </Link>
                  <Link
                    href="/#vision"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 text-[13px] text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    {t("nav.vision")}
                  </Link>
                  <Link
                    href={acpUrl}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 text-[13px] text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    {t("hero.acpToken")}
                  </Link>
                  <Link
                    href="/wallet/acp"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-emerald-400/25 bg-emerald-400/8 px-3 py-2.5 text-[13px] text-emerald-200/90 transition hover:bg-emerald-400/15 hover:text-emerald-100"
                  >
                    {t("nav.acpWallet")}
                  </Link>
                </div>

                <div className="flex items-center gap-2 border-t border-white/8 pt-3">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-center text-[13px] font-medium text-white/88 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                  >
                    {t("nav.login")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-full bg-emerald-400/15 px-4 py-2 text-center text-[13px] font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/30 transition hover:bg-emerald-400/20"
                  >
                    {t("nav.register")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
