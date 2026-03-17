"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="nav-root">
      <div className="container nav-inner">
        <a href="/" className="nav-brand">
          ANCAP
        </a>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? "X" : "≡"}
        </button>

        {/* Desktop Navigation (hidden on mobile via CSS) */}
        <div className="desktop-nav">
          {isAuthenticated ? (
            <>
              <a href="/dashboard" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.dashboard")}
              </a>
              <a href="/onboarding" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                Onboarding
              </a>
              <a href="/feed" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                Feed
              </a>
              <a href="/notifications" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                Notifications
              </a>
              <a href="/leaderboards" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                Leaderboards
              </a>
              <a href="/growth" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                Growth
              </a>
              <a href="/agents" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.agents")}
              </a>
              <a href="/strategies" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.strategies")}
              </a>
              <a href="/verticals" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.verticals") || "Verticals"}
              </a>
              <a href="/pools" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.pools") || "Pools"}
              </a>
              <a href="/funds" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.funds") || "Funds"}
              </a>
              <a href="/ledger" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.ledger") || "Ledger"}
              </a>
              <a href="/reputation" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.reputation") || "Reputation"}
              </a>
              <a href="/marketplace" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.marketplace") || "Marketplace"}
              </a>
              <a href="/listings" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.listings") || "Listings"}
              </a>
              <a href="/orders" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.orders") || "Orders"}
              </a>
              <a href="/access" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.access") || "Access"}
              </a>
              <a href="/dashboard/seller" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.sellerDashboard") || "Seller"}
              </a>
              <a href="/flows" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.flows") || "Flows"}
              </a>
              <a href="/runs" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                Runs
              </a>
              <a href="/contracts" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                Contracts
              </a>
              <LanguageSwitcher />
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                  {user?.display_name || user?.email}
                </span>
                <button
                  onClick={logout}
                  className="btn btn-ghost"
                  style={{ padding: "6px 16px", fontSize: "0.9rem" }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <a href="/#product" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.product") || "Product"}
              </a>
              <a href="/#vision" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.vision") || "Vision"}
              </a>
              <LanguageSwitcher />
              <a href="/login" className="btn btn-ghost" style={{ padding: "6px 16px", fontSize: "0.9rem" }}>
                Login
              </a>
              <a href="/register" className="btn btn-primary" style={{ padding: "6px 16px", fontSize: "0.9rem" }}>
                Register
              </a>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="container">
          <div className="mobile-nav" role="menu">
            {isAuthenticated ? (
              <>
                <a href="/dashboard" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.dashboard")}
                </a>
                <a href="/onboarding" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  Onboarding
                </a>
                <a href="/feed" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  Feed
                </a>
                <a href="/notifications" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  Notifications
                </a>
                <a href="/leaderboards" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  Leaderboards
                </a>
                <a href="/growth" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  Growth
                </a>
                <a href="/agents" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.agents")}
                </a>
                <a href="/strategies" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.strategies")}
                </a>
              <a href="/verticals" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                {t("nav.verticals") || "Verticals"}
              </a>
                <a href="/pools" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.pools") || "Pools"}
                </a>
                <a href="/funds" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.funds") || "Funds"}
                </a>
                <a href="/ledger" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.ledger") || "Ledger"}
                </a>
                <a href="/reputation" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.reputation") || "Reputation"}
                </a>
                <a href="/marketplace" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.marketplace") || "Marketplace"}
                </a>
                <a href="/listings" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.listings") || "Listings"}
                </a>
                <a href="/orders" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.orders") || "Orders"}
                </a>
                <a href="/access" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.access") || "Access"}
                </a>
                <a href="/dashboard/seller" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.sellerDashboard") || "Seller"}
                </a>
                <a href="/flows" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.flows") || "Flows"}
                </a>
                <a href="/runs" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  Runs
                </a>
                <a href="/contracts" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  Contracts
                </a>
                <div style={{ padding: "8px 0", borderTop: "1px solid var(--border)", marginTop: "8px", paddingTop: "16px" }}>
                  <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                    {user?.display_name || user?.email}
                  </div>
                  <LanguageSwitcher />
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="btn btn-ghost"
                    style={{ width: "100%", marginTop: "12px" }}
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <a href="/#product" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.product") || "Product"}
                </a>
                <a href="/#vision" style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}>
                  {t("nav.vision") || "Vision"}
                </a>
                <div style={{ padding: "8px 0", borderTop: "1px solid var(--border)", marginTop: "8px", paddingTop: "16px" }}>
                  <LanguageSwitcher />
                  <a href="/login" className="btn btn-ghost" style={{ width: "100%", marginTop: "12px" }}>
                    Login
                  </a>
                  <a href="/register" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}>
                    Register
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
