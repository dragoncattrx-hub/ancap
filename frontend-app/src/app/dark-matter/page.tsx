"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { darkMatterAuction, getApiUrl } from "@/lib/api";
import { SiteLegalFooter } from "@/components/legal/LegalViews";

type LotKind = "halo" | "filament" | "void" | "cluster" | "detector" | "particle" | "cosmology";

type Lot = {
  id: string;
  kind: LotKind;
  name: string;
  designation: string;
  parent?: string | null;
  blurb: string;
  starting_acp: string;
  current_acp: string;
  min_next_acp: string;
  bid_count: number;
  featured?: boolean;
};

type Catalog = {
  title: string;
  tagline: string;
  compliance_note: string;
  legal_href?: string;
  lots: Lot[];
  featured: Lot[];
};

function formatAcp(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} ACP`;
  return `${n.toLocaleString()} ACP`;
}

export default function DarkMatterAuctionPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | LotKind>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  const load = async () => {
    try {
      const data = (await darkMatterAuction.catalog()) as Catalog;
      setCatalog(data);
      setError("");
    } catch (err) {
      try {
        const res = await fetch(`${getApiUrl()}/dark-matter-auction/catalog`, { credentials: "omit" });
        if (!res.ok) throw new Error(`Catalog failed (${res.status})`);
        setCatalog((await res.json()) as Catalog);
        setError("");
      } catch (inner) {
        setError(inner instanceof Error ? inner.message : t("darkMatterPage.loadError"));
      }
    }
  };

  useEffect(() => {
    void load();
    document.title = `ANCAP — ${t("darkMatterPage.title")}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const lots = useMemo(() => {
    const items = catalog?.lots || [];
    if (filter === "all") return items;
    return items.filter((lot) => lot.kind === filter);
  }, [catalog, filter]);

  const selected =
    lots.find((lot) => lot.id === selectedId) || catalog?.lots.find((lot) => lot.id === selectedId);

  useEffect(() => {
    if (selected) setAmount(selected.min_next_acp);
  }, [selected?.id, selected?.min_next_acp]);

  const placeBid = async (lot: Lot) => {
    setBusy(true);
    setInfo("");
    setError("");
    try {
      await darkMatterAuction.bid(lot.id, { amount_acp: amount || lot.min_next_acp });
      setInfo(t("darkMatterPage.bidPlaced"));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("darkMatterPage.bidError"));
    } finally {
      setBusy(false);
    }
  };

  const kindLabel = (kind: LotKind) => t(`darkMatterPage.kind.${kind}`);

  const filters: Array<"all" | LotKind> = [
    "all",
    "halo",
    "filament",
    "void",
    "cluster",
    "detector",
    "particle",
    "cosmology",
  ];

  return (
    <div className="min-h-screen bg-[#04060f] text-[#e8eef8]">
      <Navigation />
      <main>
        <section
          className="relative overflow-hidden border-b border-white/10"
          style={{
            background:
              "radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.22), transparent 48%), radial-gradient(ellipse at 80% 20%, rgba(52,211,153,0.08), transparent 40%), linear-gradient(165deg, #050814 0%, #04060f 55%, #0a0c18 100%)",
          }}
        >
          <div className="container" style={{ padding: "56px 24px 36px" }}>
            <p className="section-num" style={{ letterSpacing: "0.18em", color: "#a5b4fc" }}>
              {t("darkMatterPage.kicker")}
            </p>
            <h1 className="section-title" style={{ marginBottom: 14, maxWidth: 760 }}>
              {t("darkMatterPage.title")}
            </h1>
            <p className="section-subtitle" style={{ maxWidth: 720, marginBottom: 18 }}>
              {t("darkMatterPage.lead")}
            </p>
            <div className="action-cluster">
              <a href="#lots" className="btn btn-primary">
                {t("darkMatterPage.browseLots")}
              </a>
              <Link href="/legal/dark-matter" className="btn btn-ghost">
                {t("darkMatterPage.legalLink")}
              </Link>
              <Link href="/galaxy" className="btn btn-ghost">
                {t("darkMatterPage.galaxyLink")}
              </Link>
            </div>
          </div>
        </section>

        <section id="lots" className="container" style={{ padding: "28px 24px 72px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 22 }}>
            {filters.map((key) => (
              <button
                key={key}
                type="button"
                className={filter === key ? "btn btn-primary" : "btn btn-ghost"}
                onClick={() => setFilter(key)}
              >
                {key === "all" ? t("darkMatterPage.allLots") : kindLabel(key)}
              </button>
            ))}
          </div>

          {error && <p style={{ color: "#fbbf24", marginBottom: 16 }}>{error}</p>}
          {info && <p style={{ color: "var(--accent-strong)", marginBottom: 16 }}>{info}</p>}

          <div className="responsive-grid responsive-grid-3">
            {lots.map((lot) => (
              <article
                key={lot.id}
                className="card"
                style={{
                  borderRadius: 14,
                  background: "rgba(10, 14, 28, 0.92)",
                  border:
                    selectedId === lot.id
                      ? "1px solid rgba(165, 180, 252, 0.55)"
                      : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: lot.featured ? "0 0 0 1px rgba(99,102,241,0.25)" : undefined,
                }}
              >
                <div className="card-header">
                  <span className="badge badge-info">{kindLabel(lot.kind)}</span>
                  <strong style={{ color: "#c7d2fe" }}>{formatAcp(lot.current_acp)}</strong>
                </div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 6 }}>{lot.name}</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 10 }}>
                  {lot.designation}
                  {lot.parent ? ` · ${lot.parent}` : ""}
                </p>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.6, minHeight: 72 }}>{lot.blurb}</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 14 }}>
                  {t("darkMatterPage.starting")}: {formatAcp(lot.starting_acp)} · {t("darkMatterPage.bids")}:{" "}
                  {lot.bid_count}
                </p>
                <button type="button" className="btn btn-ghost" onClick={() => setSelectedId(lot.id)}>
                  {t("darkMatterPage.selectLot")}
                </button>
              </article>
            ))}
          </div>

          {selected && (
            <div
              className="card"
              style={{
                marginTop: 28,
                borderRadius: 14,
                background: "rgba(10, 14, 28, 0.95)",
                border: "1px solid rgba(165,180,252,0.25)",
              }}
            >
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 8 }}>
                {t("darkMatterPage.bidOn")} {selected.name}
              </h2>
              <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
                {t("darkMatterPage.minBid")}: {formatAcp(selected.min_next_acp)}
              </p>
              <div className="action-cluster">
                <input
                  className="input input-bordered"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  aria-label={t("darkMatterPage.bidAmount")}
                  style={{ minWidth: 180 }}
                />
                {isAuthenticated ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={() => void placeBid(selected)}
                  >
                    {busy ? t("darkMatterPage.bidding") : t("darkMatterPage.placeBid")}
                  </button>
                ) : (
                  <Link href="/login" className="btn btn-primary">
                    {t("darkMatterPage.signInToBid")}
                  </Link>
                )}
              </div>
            </div>
          )}

          <p style={{ color: "var(--text-muted)", marginTop: 28, maxWidth: 820, lineHeight: 1.7 }}>
            {catalog?.compliance_note || t("darkMatterPage.compliance")}
          </p>
          <p style={{ marginTop: 12 }}>
            <Link href="/legal/dark-matter" style={{ color: "#a5b4fc" }}>
              {t("darkMatterPage.legalLink")}
            </Link>
          </p>
        </section>
      </main>
      <SiteLegalFooter />
    </div>
  );
}
