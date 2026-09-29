"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { ApiError, platformAdmin } from "@/lib/api";
import { ADMIN_CONSOLE_PATH, adminConsoleHref } from "@/lib/adminConsole";

const NAV = [
  { key: "navOverview", href: "" },
  { key: "navUsers", href: "users" },
  { key: "navSystem", href: "system" },
  { key: "navFinance", href: "finance" },
  { key: "navAnalytics", href: "analytics" },
  { key: "navAudit", href: "audit" },
] as const;

export function OpsShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [gate, setGate] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=/${ADMIN_CONSOLE_PATH}`);
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        await platformAdmin.overview();
        if (!cancelled) setGate("ok");
      } catch (e) {
        if (!cancelled) setGate("denied");
        if (e instanceof ApiError && (e.status === 403 || e.status === 503 || e.status === 401)) {
          // 404-style disclosure avoidance for non-admins
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const active = useMemo(() => {
    const base = `/${ADMIN_CONSOLE_PATH}`;
    if (!pathname || pathname === base || pathname === `${base}/`) return "";
    const rest = pathname.slice(base.length + 1).split("/")[0] || "";
    return rest;
  }, [pathname]);

  if (isLoading || gate === "loading") {
    return (
      <div className="min-h-screen bg-[#050b10] text-white/80">
        <Navigation />
        <div className="mx-auto max-w-6xl px-4 py-24 text-sm text-white/50">{t("opsConsole.loading")}</div>
      </div>
    );
  }

  if (gate === "denied") {
    return (
      <div className="min-h-screen bg-[#050b10] text-white">
        <Navigation />
        <div className="mx-auto max-w-lg px-4 py-32 text-center">
          <p className="text-6xl font-light text-white/20">404</p>
          <p className="mt-4 text-sm text-white/45">{t("opsConsole.denied")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b10] text-white">
      <Navigation />
      <div className="relative overflow-hidden border-b border-emerald-400/10 bg-gradient-to-br from-emerald-950/40 via-[#071018] to-[#050b10]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
              {t("opsConsole.brand")}
            </p>
            <h1 className="mt-2 font-serif text-3xl tracking-tight text-white sm:text-4xl">
              {t("opsConsole.title")}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/55">{t("opsConsole.lead")}</p>
          </div>
        </div>
        <nav className="relative mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-4">
          {NAV.map((item) => {
            const href = adminConsoleHref(item.href);
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={href}
                className={
                  isActive
                    ? "rounded-lg bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200"
                    : "rounded-lg px-3 py-1.5 text-xs font-medium text-white/55 hover:bg-white/5 hover:text-white"
                }
              >
                {t(`opsConsole.${item.key}`)}
              </Link>
            );
          })}
        </nav>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
