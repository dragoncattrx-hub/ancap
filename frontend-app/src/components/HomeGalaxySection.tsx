"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GalaxySolarSystem } from "@/components/GalaxySolarSystem";
import { useLanguage } from "@/components/LanguageProvider";
import { getApiUrl } from "@/lib/api";

type LotKind =
  | "star"
  | "planet"
  | "satellite"
  | "dwarf_planet"
  | "asteroid"
  | "comet"
  | "nebula"
  | "galaxy"
  | "black_hole"
  | "exoplanet"
  | "radiation";

type Lot = {
  id: string;
  kind: LotKind;
  name: string;
  current_acp: string;
};

function formatAcp(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} ACP`;
  return `${n.toLocaleString()} ACP`;
}

export function HomeGalaxySection() {
  const { t } = useLanguage();
  const [lots, setLots] = useState<Lot[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/space-auction/catalog`, { credentials: "omit" });
        if (!res.ok) return;
        const data = (await res.json()) as { featured?: Lot[]; lots?: Lot[] };
        const featured = data.featured?.length ? data.featured : data.lots || [];
        const pick = [
          featured.find((l) => l.kind === "star"),
          featured.find((l) => l.kind === "planet"),
          featured.find((l) => l.kind === "galaxy"),
          featured.find((l) => l.kind === "radiation"),
        ].filter((x): x is Lot => Boolean(x));
        if (!cancelled) setLots(pick);
      } catch {
        /* Home remains usable if the auction API is down. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const kindLabel = (kind: LotKind) => {
    const labels: Record<LotKind, string> = {
      star: t("galaxy.stars"),
      planet: t("galaxy.planets"),
      satellite: t("galaxy.satellites"),
      dwarf_planet: t("galaxy.dwarfPlanets"),
      asteroid: t("galaxy.asteroids"),
      comet: t("galaxy.comets"),
      nebula: t("galaxy.nebulae"),
      galaxy: t("galaxy.galaxies"),
      black_hole: t("galaxy.blackHoles"),
      exoplanet: t("galaxy.exoplanets"),
      radiation: t("galaxy.radiation"),
    };
    return labels[kind];
  };

  return (
    <section
      id="galaxy"
      className="container"
      style={{ padding: "28px 24px 56px" }}
      aria-labelledby="galaxy-home-title"
    >
      <div style={{ borderTop: "1px solid var(--border)", padding: "42px 0 0" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 28,
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 22,
          }}
        >
          <div style={{ flex: "1 1 320px", maxWidth: 720 }}>
            <span className="section-num">{t("homePage.galaxyKicker")}</span>
            <h2 id="galaxy-home-title" className="section-title" style={{ marginBottom: 14 }}>
              {t("homePage.galaxyTitle")}
            </h2>
            <p className="section-subtitle" style={{ maxWidth: 640, marginBottom: 0 }}>
              {t("homePage.galaxyLead")}
            </p>
          </div>
          <Link href="/galaxy" className="btn btn-primary">
            {t("homePage.galaxyCta")}
          </Link>
        </div>
        <div
          style={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            overflow: "hidden",
            marginBottom: 18,
          }}
        >
          <GalaxySolarSystem compact />
        </div>
        {lots.length > 0 && (
          <div className="responsive-grid responsive-grid-3">
            {lots.map((lot) => (
              <Link
                key={lot.id}
                href="/galaxy"
                className="card"
                style={{ textDecoration: "none", borderRadius: 8 }}
              >
                <div className="card-header">
                  <span className="badge badge-info">{kindLabel(lot.kind)}</span>
                  <strong style={{ color: "var(--accent-strong)" }}>{formatAcp(lot.current_acp)}</strong>
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>{lot.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
