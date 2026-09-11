"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { SiteLegalFooter } from "@/components/legal/LegalViews";

type Region = "all" | "americas" | "emea" | "apac" | "online";

type Venue = {
  id: string;
  name: string;
  category: string;
  region: Exclude<Region, "all">;
  places: string;
  note: string;
  status: "open" | "licensed" | "regulated" | "age-gated";
};

const VENUES: Venue[] = [
  {
    id: "museums",
    name: "Museums & public galleries",
    category: "Culture",
    region: "americas",
    places: "US · Canada · Mexico · Brazil",
    note: "State and municipal museums, ticketed exhibitions, ACP-friendly tourism desks.",
    status: "open",
  },
  {
    id: "broadway",
    name: "Theatre & cinema circuits",
    category: "Stage",
    region: "americas",
    places: "NYC · LA · Toronto · São Paulo",
    note: "Licensed venues only. Age ratings follow local film boards.",
    status: "open",
  },
  {
    id: "eu-festivals",
    name: "Concerts & city festivals",
    category: "Live music",
    region: "emea",
    places: "EU · UK · UAE · South Africa",
    note: "Promoter-licensed events with published capacity and refund rules.",
    status: "licensed",
  },
  {
    id: "eu-parks",
    name: "Theme parks & attractions",
    category: "Parks",
    region: "emea",
    places: "FR · DE · ES · TR",
    note: "Operator insurance and height/age gates required on site.",
    status: "open",
  },
  {
    id: "eu-lottery",
    name: "National lotteries",
    category: "Lottery",
    region: "emea",
    places: "EU member lotteries · UKNC",
    note: "Only state-licensed lottery products. No grey-market tickets.",
    status: "regulated",
  },
  {
    id: "apac-heritage",
    name: "Heritage sites & night markets",
    category: "Tourism",
    region: "apac",
    places: "JP · KR · SG · AU · NZ",
    note: "Cultural venues and licensed night markets; local alcohol rules apply.",
    status: "open",
  },
  {
    id: "apac-gaming",
    name: "Integrated resorts (where legal)",
    category: "Gaming",
    region: "apac",
    places: "SG · Macau · AU (state rules)",
    note: "Passport / ID checks. We list jurisdictions that publish a regulator — never offshore grey books.",
    status: "age-gated",
  },
  {
    id: "us-sports",
    name: "Pro sports calendars",
    category: "Sports",
    region: "americas",
    places: "MLB · NBA · NFL · MLS markets",
    note: "Ticketing through licensed partners; fantasy/sportsbook only where state law allows.",
    status: "regulated",
  },
  {
    id: "online-arena",
    name: "ANCAP Arena (on-platform)",
    category: "Digital",
    region: "online",
    places: "Global · ACP settle",
    note: "Provably fair house games and prediction markets under ANCAP rules — not a casino mirror of illegal books.",
    status: "regulated",
  },
  {
    id: "online-streams",
    name: "Licensed streaming & esports",
    category: "Digital",
    region: "online",
    places: "Geo-licensed catalogs",
    note: "Rights-cleared streams and tournament VODs. Region locks follow the rights holder.",
    status: "licensed",
  },
];

const REGIONS: { id: Region; label: string }[] = [
  { id: "all", label: "Worldwide" },
  { id: "americas", label: "Americas" },
  { id: "emea", label: "EMEA" },
  { id: "apac", label: "APAC" },
  { id: "online", label: "Online / ANCAP" },
];

const STATUS_LABEL: Record<Venue["status"], string> = {
  open: "Open access",
  licensed: "Licensed operator",
  regulated: "Regulator-listed",
  "age-gated": "Age / ID gated",
};

export default function LegalEntertainmentPage() {
  const [region, setRegion] = useState<Region>("all");

  useEffect(() => {
    document.title = "ANCAP — Legal entertainment worldwide";
  }, []);

  const items = useMemo(
    () => (region === "all" ? VENUES : VENUES.filter((v) => v.region === region)),
    [region],
  );

  return (
    <div className="min-h-screen bg-[#081018] text-[#f3efe6]">
      <Navigation />

      <main>
        <section
          className="relative overflow-hidden"
          style={{
            minHeight: "78vh",
            display: "flex",
            alignItems: "flex-end",
            borderBottom: "1px solid rgba(243,239,230,0.12)",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 70% 10%, rgba(212,160,72,0.28), transparent 42%), radial-gradient(ellipse at 8% 80%, rgba(46,140,130,0.22), transparent 45%), linear-gradient(165deg, #050b12 0%, #0c1620 48%, #132018 100%)",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.4,
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06) 0 1px, transparent 2px), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.05) 0 1px, transparent 2px)",
              backgroundSize: "48px 48px",
              maskImage: "linear-gradient(180deg, black, transparent 88%)",
            }}
          />
          <div className="container" style={{ position: "relative", zIndex: 1, padding: "104px 24px 56px" }}>
            <p
              style={{
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                color: "rgba(243,239,230,0.65)",
              }}
            >
              Legal entertainment desk
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display, Georgia, 'Times New Roman', serif)",
                fontSize: "clamp(2.6rem, 6vw, 4.4rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.02,
                maxWidth: 920,
                margin: "14px 0 18px",
              }}
            >
              ANCAP
            </h1>
            <p style={{ fontSize: "1.35rem", maxWidth: 640, marginBottom: 14, color: "#f3efe6" }}>
              Legal entertainment worldwide — venues, festivals, and regulated play that publish a license.
            </p>
            <p style={{ color: "rgba(243,239,230,0.72)", maxWidth: 700, lineHeight: 1.7, marginBottom: 28 }}>
              One map for culture, sport, tourism, and on-platform Arena. Grey-market books and unlicensed
              gambling are out of scope.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href="#map" className="btn btn-primary">
                Browse by region
              </a>
              <Link href="/arena" className="btn btn-ghost">
                Open Arena
              </Link>
              <Link href="/legal" className="btn btn-ghost">
                Legal hub
              </Link>
            </div>
          </div>
        </section>

        <section id="map" className="container" style={{ padding: "56px 24px 24px" }}>
          <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "0.72rem", opacity: 0.65 }}>
            Region filter
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display, Georgia, 'Times New Roman', serif)",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              margin: "10px 0 22px",
            }}
          >
            Pick a geography, keep the license trail
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
            {REGIONS.map((r) => {
              const active = region === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRegion(r.id)}
                  style={{
                    border: active ? "1px solid rgba(212,160,72,0.7)" : "1px solid rgba(243,239,230,0.16)",
                    background: active ? "rgba(212,160,72,0.16)" : "transparent",
                    color: "#f3efe6",
                    borderRadius: 999,
                    padding: "8px 14px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {items.map((v) => (
              <article
                key={v.id}
                style={{
                  borderTop: "1px solid rgba(212,160,72,0.35)",
                  padding: "18px 4px 8px",
                }}
              >
                <p style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.55 }}>
                  {v.category} · {STATUS_LABEL[v.status]}
                </p>
                <h3 style={{ fontSize: "1.15rem", margin: "8px 0 6px", fontWeight: 600 }}>{v.name}</h3>
                <p style={{ fontSize: "0.9rem", color: "rgba(212,160,72,0.9)", marginBottom: 8 }}>{v.places}</p>
                <p style={{ fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(243,239,230,0.75)" }}>{v.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="container" style={{ padding: "40px 24px 72px" }}>
          <h2
            style={{
              fontFamily: "var(--font-display, Georgia, 'Times New Roman', serif)",
              fontSize: "clamp(1.5rem, 2.8vw, 2rem)",
              marginBottom: 12,
            }}
          >
            Compliance posture
          </h2>
          <p style={{ maxWidth: 720, lineHeight: 1.7, color: "rgba(243,239,230,0.75)", marginBottom: 18 }}>
            This desk is a discovery map, not legal advice. Operators must hold a local license where required;
            players must meet age and residency rules. ANCAP does not broker illegal wagering or unlicensed
            offshore books. On-platform play settles in ACP via Arena under published house rules.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href="/arena" className="btn btn-primary">
              Arena games
            </Link>
            <Link href="/compliance" className="btn btn-ghost">
              Compliance
            </Link>
            <Link href="/insurance" className="btn btn-ghost">
              Event cover desk
            </Link>
          </div>
        </section>
      </main>

      <SiteLegalFooter />
    </div>
  );
}
