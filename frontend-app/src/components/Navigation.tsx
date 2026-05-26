"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";
import { useWallet } from "./WalletProvider";
import { useTheme } from "./ThemeProvider";
import { getPreferredEvmProvider } from "@/lib/evmProvider";

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
  { label: "Search", href: "/search" },
  { label: "Workflows", href: "/ai/workflows" },
  { label: "Pricing", href: "/pricing" },
  { label: "Developers", href: "/developers" },
  { label: "Webhooks", href: "/developers/webhooks" },
  { label: "Billing", href: "/billing" },
  { label: "Credits", href: "/wallet/credits" },
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
  { label: "Analytics", href: "/dashboard/analytics" },
  { label: "Search", href: "/search" },
  { label: "Organizations", href: "/organizations" },
  { label: "Builder", href: "/strategy-builder" },
  { label: "Whitepaper", href: "/whitepaper" },
  { label: "ACP Paper", href: "/whitepaper/acp" },
  { label: "Legal", href: "/legal/terms" },
  { label: "AI Console", href: "/ai-console" },
  { label: "Referrals", href: "/referrals" },
  { label: "Evolution", href: "/evolution" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Bounties", href: "/bounties" },
  { label: "Chain Receipts", href: "/chain-receipts" },
  { label: "Proof Center", href: "/proof-center" },
  { label: "Free Snapshot", href: "/token-snapshot" },
  { label: "Operations NOC", href: "/operations-noc" },
  { label: "Audit Log", href: "/admin/audit" },
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

/** Horizontal pill rail + thin scrollbar (Linear / Vercel–style dense top nav). */
const navScrollRow =
  "flex max-w-full flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain px-0.5 py-0.5 touch-pan-x [-ms-overflow-style:none] [scrollbar-color:rgba(255,255,255,0.22)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent";

const fadeL =
  "pointer-events-none absolute inset-y-0.5 left-0 z-[1] w-7 rounded-l-xl bg-gradient-to-r from-[#050a18] via-[#050a18]/90 to-transparent";
const fadeR =
  "pointer-events-none absolute inset-y-0.5 right-0 z-[1] w-7 rounded-r-xl bg-gradient-to-l from-[#050a18] via-[#050a18]/90 to-transparent";

type LangCode = "en" | "ru" | "uk" | "de";
const LANG_OPTIONS: ReadonlyArray<{ code: LangCode; label: string }> = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "uk", label: "UK" },
  { code: "de", label: "DE" },
];

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

  const padCls =
    size === "compact"
      ? "rounded-full px-2 py-1 text-[11px] font-medium transition sm:px-3 sm:py-1.5 sm:text-[12px]"
      : "rounded-full px-3 py-1.5 text-[12px] font-medium transition";
  const wrapCls =
    size === "compact"
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

/** Desktop: pill links in a scroll rail (primary vs secondary visual tiers). */
function PillNavLink({
  item,
  label,
  active,
  tier,
  onClick,
}: {
  item: NavItem;
  label: string;
  active: boolean;
  tier: "primary" | "secondary";
  onClick?: () => void;
}) {
  const base =
    "relative shrink-0 whitespace-nowrap rounded-full font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a18]";
  const primary = active
    ? "bg-gradient-to-b from-white/[0.14] to-white/[0.06] px-3.5 py-1.5 text-[13px] text-white shadow-[0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-white/18"
    : "px-3.5 py-1.5 text-[13px] text-white/58 hover:bg-white/[0.07] hover:text-white";
  const secondary = active
    ? "bg-violet-500/18 px-2.5 py-1 text-[11.5px] leading-tight text-violet-50 ring-1 ring-violet-400/30 sm:px-3 sm:text-[12px]"
    : "px-2.5 py-1 text-[11.5px] leading-tight text-violet-200/55 hover:bg-violet-500/12 hover:text-violet-100 sm:px-3 sm:text-[12px]";

  return (
    <Link href={item.href} onClick={onClick} className={cn(base, tier === "primary" ? primary : secondary)}>
      <span className="relative z-10">{label}</span>
    </Link>
  );
}

function MobileNavRow({
  item,
  label,
  active,
  onNavigate,
}: {
  item: NavItem;
  label: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex min-h-[44px] items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-[14px] leading-snug transition active:scale-[0.99]",
        active
          ? "border-emerald-400/35 bg-gradient-to-r from-emerald-500/12 to-emerald-500/5 text-white shadow-[inset_0_0_0_1px_rgba(52,211,153,0.12)]"
          : "border-white/[0.07] bg-white/[0.03] text-white/75 hover:border-white/12 hover:bg-white/[0.05] hover:text-white"
      )}
    >
      <span className="min-w-0 break-words font-medium">{label}</span>
      <span className="text-[11px] text-white/25" aria-hidden>
        -&gt;
      </span>
    </Link>
  );
}

function NavScrollWithFades({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-w-0">
      <div className={fadeL} aria-hidden />
      <div className={fadeR} aria-hidden />
      {children}
    </div>
  );
}

export function Navigation() {
  const { isAuthenticated, user, logout, loginWithWallet } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { isConnected, isConnecting, shortAddress, connect, clearError, chainId } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const acpUrl = process.env.NEXT_PUBLIC_ACP_URL || "/acp";

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  const userLabel = user?.display_name || user?.email || "";

  const handleWalletContinue = async () => {
    clearError();
    if (!isConnected) {
      await connect();
      return;
    }
    const provider = getPreferredEvmProvider();
    if (!isAuthenticated && provider) {
      const accountsRaw = await provider.request({ method: "eth_accounts" });
      const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];
      const address = typeof accounts[0] === "string" ? accounts[0] : "";
      if (address) await loginWithWallet(address, chainId);
    }
  };

  return (
    <header className="sticky top-0 z-[100] border-b border-white/8 bg-[#040816]/90 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent" />

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-h-[68px] items-center justify-between gap-2 sm:gap-4 lg:min-h-[76px]">
          <div className="flex min-w-0 shrink items-center gap-2 sm:shrink-0 sm:gap-6">
            <Link href="/" className="group inline-flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="relative flex items-center justify-center">
                <span className="absolute h-4 w-4 rounded-full bg-emerald-400/20 blur-md" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.85)]" />
              </span>
              <span className="truncate text-[21px] font-semibold text-white sm:text-[28px]">ANCAP</span>
            </Link>
          </div>

          <div className="hidden min-w-0 flex-1 lg:flex lg:flex-col lg:justify-center lg:px-2">
            {isAuthenticated ? (
              <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-b from-white/[0.055] to-white/[0.02] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <NavScrollWithFades>
                  <nav className={navScrollRow} aria-label={t("nav.main")}>
                    {primaryNav.map((item) => (
                      <PillNavLink
                        key={item.href}
                        item={item}
                        label={navItemLabel(item, t)}
                        active={pathname === item.href}
                        tier="primary"
                      />
                    ))}
                  </nav>
                </NavScrollWithFades>
                <NavScrollWithFades>
                  <nav
                    className={cn(navScrollRow, "mt-1 border-t border-white/[0.06] pt-1")}
                    aria-label={t("nav.system")}
                  >
                    {secondaryNav.map((item) => (
                      <PillNavLink
                        key={item.href}
                        item={item}
                        label={navItemLabel(item, t)}
                        active={pathname === item.href}
                        tier="secondary"
                      />
                    ))}
                  </nav>
                </NavScrollWithFades>
              </div>
            ) : (
              <NavScrollWithFades>
                <nav className={cn(navScrollRow, "justify-start gap-1.5 py-1")} aria-label={t("nav.main")}>
                  <Link
                    href="/#product"
                    className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] text-white/60 transition hover:bg-white/[0.06] hover:text-white/90"
                  >
                    {t("nav.product")}
                  </Link>
                  <Link
                    href="/#vision"
                    className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] text-white/60 transition hover:bg-white/[0.06] hover:text-white/90"
                  >
                    {t("nav.vision")}
                  </Link>
                  <Link
                    href={acpUrl}
                    className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] text-white/60 transition hover:bg-white/[0.06] hover:text-white/90"
                  >
                    {t("hero.acpToken")}
                  </Link>
                  <Link
                    href="/whitepaper"
                    className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] text-white/60 transition hover:bg-white/[0.06] hover:text-white/90"
                  >
                    Whitepaper
                  </Link>
                  <Link
                    href="/legal/terms"
                    className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] text-white/60 transition hover:bg-white/[0.06] hover:text-white/90"
                  >
                    Legal
                  </Link>
                </nav>
              </NavScrollWithFades>
            )}
          </div>

          <div className="hidden min-w-0 shrink-0 items-center gap-2 sm:gap-3 lg:flex">
            <Link
              href="/wallet/acp"
              className="whitespace-nowrap rounded-full border border-emerald-400/40 bg-emerald-400/12 px-3 py-2 text-[12px] font-semibold text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.12)] transition hover:bg-emerald-400/20 hover:text-white"
            >
              {t("nav.acpWallet")}
            </Link>
            {isConnected ? (
              <button
                type="button"
                onClick={() => {
                  const provider = getPreferredEvmProvider();
                  if (!isAuthenticated && provider) {
                    provider.request({ method: "eth_accounts" }).then(async (accountsRaw) => {
                      const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];
                      const address = typeof accounts[0] === "string" ? accounts[0] : "";
                      if (address) await loginWithWallet(address, chainId);
                    }).catch(() => undefined);
                  }
                }}
                className="whitespace-nowrap rounded-full border border-violet-400/30 bg-violet-500/12 px-3 py-2 text-[12px] font-semibold text-violet-100 transition hover:bg-violet-500/18 hover:text-white"
              >
                {shortAddress || t("auth.walletConnected")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleWalletContinue}
                disabled={isConnecting}
                className="whitespace-nowrap rounded-full border border-white/12 bg-white/[0.03] px-3 py-2 text-[12px] font-semibold text-white/88 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConnecting ? t("auth.connectingWallet") : t("auth.connectWallet")}
              </button>
            )}
            <div className="h-6 w-px shrink-0 bg-white/10" />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-white/60 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              {theme === "dark" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <LangSwitcher lang={lang} setLang={setLang} />
            <div className="h-6 w-px bg-white/10" />
            {isAuthenticated ? (
              <>
                <span className="max-w-[10rem] truncate text-[13px] font-medium text-white/72" title={userLabel}>
                  {userLabel}
                </span>
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

          <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2 lg:hidden">
            <Link
              href="/wallet/acp"
              aria-label={t("nav.acpWallet")}
              title={t("nav.acpWallet")}
              className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-emerald-400/45 bg-emerald-400/14 px-2 py-2 text-[10px] font-semibold text-emerald-50 shadow-[0_0_18px_rgba(52,211,153,0.15)] transition hover:bg-emerald-400/24 sm:h-11 sm:px-3 sm:text-[12px]"
            >
              <span className="sm:hidden">ACP</span>
              <span className="hidden sm:inline">{t("nav.acpWallet")}</span>
            </Link>
            <div className="hidden min-[390px]:block">
              <LangSwitcher lang={lang} setLang={setLang} size="compact" />
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
            >
              {theme === "dark" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lg text-white/90 transition hover:bg-white/[0.08] sm:h-11 sm:w-11"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M18 6 6 18M6 6l12 12"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-[2px] lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-[95] border-t border-white/10 bg-gradient-to-b from-[#070d1c] to-[#040816] shadow-[0_-8px_40px_rgba(0,0,0,0.45)] lg:hidden">
            <div className="mx-auto max-h-[min(78dvh,32rem)] max-w-[1440px] overflow-y-auto overscroll-y-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
              <div className="mb-4 min-[390px]:hidden">
                <LangSwitcher lang={lang} setLang={setLang} />
              </div>
              {isAuthenticated ? (
                <div className="grid gap-5">
                  <div>
                    <div className="mb-2.5 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{t("nav.main")}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {primaryNav.map((item) => (
                        <MobileNavRow
                          key={item.href}
                          item={item}
                          label={navItemLabel(item, t)}
                          active={pathname === item.href}
                          onNavigate={() => setMobileMenuOpen(false)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2.5 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400/90" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{t("nav.system")}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {secondaryNav.map((item) => (
                        <MobileNavRow
                          key={item.href}
                          item={item}
                          label={navItemLabel(item, t)}
                          active={pathname === item.href}
                          onNavigate={() => setMobileMenuOpen(false)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <div className="min-w-0 flex flex-col gap-2">
                      <div className="truncate text-[13px] text-white/80" title={userLabel}>
                        {userLabel}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/wallet/acp"
                          onClick={() => setMobileMenuOpen(false)}
                          className="inline-flex w-fit items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-[12px] font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/35 transition hover:bg-emerald-400/25"
                        >
                          {t("nav.acpWallet")}
                        </Link>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="shrink-0 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[13px] text-white/88 transition hover:bg-white/[0.08]"
                    >
                      {t("nav.logout")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Link
                      href="/#product"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-[44px] items-center rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-[14px] text-white/75 transition hover:border-white/12 hover:bg-white/[0.05]"
                    >
                      {t("nav.product")}
                    </Link>
                    <Link
                      href="/#vision"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-[44px] items-center rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-[14px] text-white/75 transition hover:border-white/12 hover:bg-white/[0.05]"
                    >
                      {t("nav.vision")}
                    </Link>
                    <Link
                      href={acpUrl}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-[44px] items-center rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-[14px] text-white/75 transition hover:border-white/12 hover:bg-white/[0.05]"
                    >
                      {t("hero.acpToken")}
                    </Link>
                    <Link
                      href="/whitepaper"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-[44px] items-center rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-[14px] text-white/75 transition hover:border-white/12 hover:bg-white/[0.05]"
                    >
                      Whitepaper
                    </Link>
                    <Link
                      href="/whitepaper/acp"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-[44px] items-center rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-[14px] text-white/75 transition hover:border-white/12 hover:bg-white/[0.05]"
                    >
                      ACP Paper
                    </Link>
                    <Link
                      href="/legal/terms"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-[44px] items-center rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-[14px] text-white/75 transition hover:border-white/12 hover:bg-white/[0.05]"
                    >
                      Legal
                    </Link>
                    <Link
                      href="/wallet/acp"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-[44px] items-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2.5 text-[14px] font-medium text-emerald-100 transition hover:bg-emerald-500/16"
                    >
                      {t("nav.acpWallet")}
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        if (!isConnected) {
                          clearError();
                          await connect();
                          return;
                        }
                        const provider = getPreferredEvmProvider();
                        if (!isAuthenticated && provider) {
                          const accountsRaw = await provider.request({ method: "eth_accounts" });
                          const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];
                          const address = typeof accounts[0] === "string" ? accounts[0] : "";
                          if (address) await loginWithWallet(address, chainId);
                        }
                      }}
                      className="flex min-h-[44px] items-center rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-[14px] text-white/75 transition hover:border-white/12 hover:bg-white/[0.05]"
                    >
                      {isConnected ? (shortAddress || t("auth.walletConnected")) : (isConnecting ? t("auth.connectingWallet") : t("auth.connectWallet"))}
                    </button>

                  </div>
                  <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-center text-[13px] font-medium text-white/90 transition hover:bg-white/[0.08]"
                    >
                      {t("nav.login")}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 rounded-full bg-emerald-400/18 px-4 py-2.5 text-center text-[13px] font-medium text-emerald-100 ring-1 ring-inset ring-emerald-400/35 transition hover:bg-emerald-400/24"
                    >
                      {t("nav.register")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
