"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { humanitarianDesk } from "@/lib/api";
import { ServiceReviewsPanel } from "@/components/ServiceReviewsPanel";

type Service = {
  id: string;
  review_target_id: string;
  label: string;
  price_from_acp: string;
  blurb: string;
};

type Partner = {
  id: string;
  review_target_id: string;
  name: string;
  jurisdiction: string;
  website: string;
  blurb: string;
  verified?: boolean;
  listing_kind?: string;
  official_partnership?: boolean;
  emblem_licensed?: boolean;
  ethics_note?: string;
  regulatory_note?: string;
};

type Catalog = {
  title: string;
  tagline: string;
  compliance_note: string;
  services: Service[];
  partners: Partner[];
  legal_href: string;
  official_partnership?: boolean;
  emblem_licensed?: boolean;
};

export default function HumanitarianPage() {
  const { user, isAuthenticated } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [selectedKind, setSelectedKind] = useState<"service" | "partner">("service");

  const load = useCallback(async () => {
    try {
      const data = (await humanitarianDesk.catalog()) as Catalog;
      setCatalog(data);
      setError("");
      if (!selectedReviewId && data.services[0]) {
        setSelectedReviewId(data.services[0].review_target_id);
        setSelectedLabel(data.services[0].label);
        setSelectedKind("service");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load humanitarian desk");
    }
  }, [selectedReviewId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="min-h-screen bg-[#120a0c] text-slate-100">
      <Navigation />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm uppercase tracking-[0.2em] text-rose-400/80">Aid / humanitarian</p>
        <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">
          {catalog?.title || "Humanitarian aid desk"}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-300">{catalog?.tagline}</p>
        <p className="mt-4 text-sm leading-6 text-slate-500">{catalog?.compliance_note}</p>
        <p className="mt-3 text-sm text-amber-200/80">
          Desk listing — not a signed Red Cross partnership, not an emblem licence, not a 135-FZ
          charity operated by ANCAP.
        </p>
        <p className="mt-3 text-sm">
          <Link href={catalog?.legal_href || "/legal/humanitarian"} className="text-rose-300 underline">
            Legal notice
          </Link>
          {" · "}
          <Link href="/legal/welcome-grant" className="text-rose-300 underline">
            Welcome grant (not this desk)
          </Link>
        </p>

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

        <h2 className="mt-10 text-xl text-white">Aid briefs</h2>
        <ul className="mt-4 space-y-5">
          {(catalog?.services || []).map((svc) => (
            <li key={svc.id} className="border-t border-white/10 pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg text-white">{svc.label}</h3>
                <span className="text-sm text-rose-200/80">from {svc.price_from_acp} ACP</span>
              </div>
              <p className="mt-2 text-slate-300">{svc.blurb}</p>
              <button
                type="button"
                className="mt-3 border border-rose-400/40 px-3 py-1.5 text-sm text-rose-100 hover:bg-rose-400/10"
                onClick={() => {
                  setSelectedReviewId(svc.review_target_id);
                  setSelectedLabel(svc.label);
                  setSelectedKind("service");
                }}
              >
                Reviews
              </button>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 text-xl text-white">Movement listings (handoff rails)</h2>
        <ul className="mt-4 space-y-5">
          {(catalog?.partners || []).map((p) => (
            <li key={p.id} className="border-t border-white/10 pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg text-white">{p.name}</h3>
                <span className="text-sm text-slate-400">{p.jurisdiction}</span>
              </div>
              <p className="mt-2 text-slate-300">{p.blurb}</p>
              {p.official_partnership === false ? (
                <p className="mt-2 text-xs uppercase tracking-wide text-amber-200/70">
                  Desk listing — not an official partnership
                </p>
              ) : null}
              {p.emblem_licensed === false ? (
                <p className="mt-1 text-xs uppercase tracking-wide text-amber-200/70">
                  Emblem not licensed — text name only
                </p>
              ) : null}
              {p.ethics_note ? <p className="mt-2 text-sm text-slate-400">{p.ethics_note}</p> : null}
              {p.regulatory_note ? <p className="mt-1 text-sm text-slate-500">{p.regulatory_note}</p> : null}
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <a
                  href={p.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-300 underline"
                >
                  Official website
                </a>
                <button
                  type="button"
                  className="border border-rose-400/40 px-3 py-1.5 text-rose-100 hover:bg-rose-400/10"
                  onClick={() => {
                    setSelectedReviewId(p.review_target_id);
                    setSelectedLabel(p.name);
                    setSelectedKind("partner");
                  }}
                >
                  Reviews
                </button>
              </div>
            </li>
          ))}
        </ul>

        {selectedReviewId ? (
          <div className="mt-12">
            <ServiceReviewsPanel
              targetType={selectedKind}
              targetId={selectedReviewId}
              label={selectedLabel}
              reviewerUserId={isAuthenticated ? user?.id : undefined}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
