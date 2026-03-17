"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "./LanguageProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const acpUrl = process.env.NEXT_PUBLIC_ACP_URL || "/acp";

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
              <div className="nav-links">
                <a href="/dashboard" className="nav-link">
                  {t("nav.dashboard")}
                </a>
                <a href="/onboarding" className="nav-link">Onboarding</a>
                <a href="/feed" className="nav-link">Feed</a>
                <a href="/notifications" className="nav-link">Notifications</a>
                <a href="/leaderboards" className="nav-link">Leaderboards</a>
                <a href="/growth" className="nav-link">Growth</a>
                <a href="/agents" className="nav-link">{t("nav.agents")}</a>
                <a href="/strategies" className="nav-link">{t("nav.strategies")}</a>
                <a href="/verticals" className="nav-link">{t("nav.verticals") || "Verticals"}</a>
                <a href="/pools" className="nav-link">{t("nav.pools") || "Pools"}</a>
                <a href="/funds" className="nav-link">{t("nav.funds") || "Funds"}</a>
                <a href="/ledger" className="nav-link">{t("nav.ledger") || "Ledger"}</a>
                <a href="/reputation" className="nav-link">{t("nav.reputation") || "Reputation"}</a>
                <a href="/marketplace" className="nav-link">{t("nav.marketplace") || "Marketplace"}</a>
                <a href="/listings" className="nav-link">{t("nav.listings") || "Listings"}</a>
                <a href="/orders" className="nav-link">{t("nav.orders") || "Orders"}</a>
                <a href="/access" className="nav-link">{t("nav.access") || "Access"}</a>
                <a href="/dashboard/seller" className="nav-link">{t("nav.sellerDashboard") || "Seller"}</a>
                <a href="/flows" className="nav-link">{t("nav.flows") || "Flows"}</a>
                <a href="/runs" className="nav-link">Runs</a>
                <a href="/contracts" className="nav-link">Contracts</a>
              </div>

              <div className="nav-actions">
                <LanguageSwitcher />
                <span className="nav-user">
                  {user?.display_name || user?.email}
                </span>
                <button onClick={logout} className="btn btn-ghost nav-logout">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <a href="/#product" className="nav-link" style={{ fontSize: "0.9rem" }}>
                {t("nav.product") || "Product"}
              </a>
              <a href="/#vision" className="nav-link" style={{ fontSize: "0.9rem" }}>
                {t("nav.vision") || "Vision"}
              </a>
              <a href={acpUrl} className="nav-link" style={{ fontSize: "0.9rem" }}>
                ACP Token
              </a>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                <LanguageSwitcher />
                <a href="/login" className="btn btn-ghost" style={{ padding: "6px 16px", fontSize: "0.9rem" }}>
                  Login
                </a>
                <a href="/register" className="btn btn-primary" style={{ padding: "6px 16px", fontSize: "0.9rem" }}>
                  Register
                </a>
              </div>
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
                <a
                  href={acpUrl}
                  style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "8px 0" }}
                >
                  ACP Token & Chain
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
