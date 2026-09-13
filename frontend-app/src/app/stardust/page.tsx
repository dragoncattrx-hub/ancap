"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { stardustDesk } from "@/lib/api";
import { ServiceReviewsPanel } from "@/components/ServiceReviewsPanel";

type Service = {
  id: string;
  review_target_id: string;
  label: string;
  price_from_acp: string;
  blurb: string;
  workflow_slug?: string | null;
  billing?: string;
};

type Module = { id: string; label: string; role: string; blurb?: string };
type Control = { id: string; label: string; icon: string; blurb: string };

type Catalog = {
  title: string;
  brand: string;
  tagline: string;
  compliance_note: string;
  legal_href: string;
  website_ref: string;
  services: Service[];
  monitoring_modules: Module[];
  weather_controls: Control[];
  outcomes: Module[];
};

export default function StardustPage() {
  const { user, isAuthenticated } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Service | null>(null);
  const [controlsOn, setControlsOn] = useState<Record<string, boolean>>({
    rainfall: true,
    storm: true,
    temperature: true,
    snow: true,
  });

  const load = useCallback(async () => {
    try {
      const data = (await stardustDesk.catalog()) as Catalog;
      setCatalog(data);
      setError("");
      if (!selected && data.services[0]) setSelected(data.services[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Stardust desk");
    }
  }, [selected]);

  useEffect(() => {
    void load();
  }, [load]);

  const headline = catalog?.services.find((s) => s.id === "stardust-weather-control-global");

  return (
    <main className="min-h-screen bg-[#050b14] text-slate-100">
      <Navigation />

      <section className="relative overflow-hidden border-b border-cyan-400/15">
        <div className="absolute inset-0">
          <Image
            src="/stardust/weather-control.jpg"
            alt="StardustSRT Earth Software for Weather Control"
            fill
            unoptimized
            priority
            className="object-cover object-center opacity-55"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050b14]/35 via-[#050b14]/75 to-[#050b14]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pt-20">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/90">
            {catalog?.brand || "StardustSRT"} · Software for a smarter planet
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
            {catalog?.title || "Earth Software for Weather Control"}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200/85 sm:text-lg">
            {catalog?.tagline || "Predict. Analyze. Influence. Worldwide weather control — settled in ACP."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={headline?.workflow_slug ? `/ai/run/${headline.workflow_slug}` : "/ai/workflows"}
              className="inline-flex rounded-md bg-cyan-400 px-5 py-3 text-sm font-semibold text-[#041018] transition hover:bg-cyan-300"
            >
              Buy global weather control · {headline?.price_from_acp || "58,000"} ACP
            </Link>
            <Link
              href="/insurance"
              className="rounded-md border border-white/25 px-5 py-3 text-sm font-medium text-white/90 transition hover:border-white/50"
            >
              Weather-control insurance
            </Link>
            <Link
              href={catalog?.legal_href || "/legal/stardust"}
              className="rounded-md border border-white/25 px-5 py-3 text-sm font-medium text-white/90 transition hover:border-white/50"
            >
              Legal notice
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="max-w-3xl text-sm leading-7 text-slate-400">{catalog?.compliance_note}</p>
        <p className="mt-3 text-sm text-slate-500">
          Reference literacy:{" "}
          <a
            href={catalog?.website_ref || "https://stardustsrt.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-300 underline"
          >
            stardustsrt.com
          </a>
          {" · "}
          <Link href="/legal/market-data" className="text-cyan-300 underline">
            AccuWeather widget notice
          </Link>
        </p>
        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#0a1524]/80">
            <div className="relative aspect-[16/11] w-full bg-[#071018]">
              <Image
                src="/stardust/disaster-prevention.jpg"
                alt="StardustSRT earthquake and disaster prevention monitoring"
                fill
                unoptimized
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 40rem"
              />
            </div>
            <div className="border-t border-white/10 p-5">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">
                Earthquake & disaster prevention
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Advanced earth monitoring. Real-time alerts. Early detection / prediction / faster
                response — partner literacy for governments, businesses, and communities.
              </p>
            </div>
          </div>

          <aside className="rounded-2xl border border-cyan-400/25 bg-[#0b1730]/90 p-5 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Weather Control</h2>
              <span className="rounded border border-cyan-400/30 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-cyan-200">
                Paid desk
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Literacy toggles only — buying ACP opens a partner brief, not a live geoengineering console.
            </p>
            <ul className="mt-5 space-y-3">
              {(catalog?.weather_controls || []).map((c) => {
                const on = controlsOn[c.id] ?? true;
                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-cyan-100">{c.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">{c.blurb}</div>
                    </div>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setControlsOn((prev) => ({ ...prev, [c.id]: !on }))}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                        on ? "bg-cyan-400" : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
                          on ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Real-time monitoring</div>
              <div className="mt-3 flex h-16 items-end gap-1">
                {[40, 55, 35, 70, 48, 62, 44, 78, 52, 66, 58, 72].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-gradient-to-t from-cyan-700/40 to-cyan-300/80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            {headline?.workflow_slug ? (
              <Link
                href={`/ai/run/${headline.workflow_slug}`}
                className="mt-5 flex w-full items-center justify-center rounded-md bg-cyan-400 px-4 py-3 text-sm font-semibold text-[#041018] transition hover:bg-cyan-300"
              >
                Unlock worldwide control · {headline.price_from_acp} ACP
              </Link>
            ) : null}
          </aside>
        </div>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Earth monitoring modules</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(catalog?.monitoring_modules || []).map((m) => (
              <li key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-300/70">{m.role}</div>
                <h3 className="mt-2 text-lg font-medium text-white">{m.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{m.blurb}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Outcome themes</h2>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(catalog?.outcomes || []).map((o) => (
              <li key={o.id} className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-4 py-5 text-center">
                <div className="text-sm font-medium text-cyan-100">{o.label}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Paid services</h2>
          <p className="mt-2 text-sm text-slate-500">ACP settles partner briefs worldwide. Hardware and field ops stay with licensed partners.</p>
          <ul className="mt-6 space-y-5">
            {(catalog?.services || []).map((svc) => (
              <li key={svc.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-medium text-white">{svc.label}</h3>
                  <span className="font-mono text-cyan-200">
                    {svc.price_from_acp} ACP
                    {svc.billing === "subscription" ? " / month" : ""}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{svc.blurb}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {svc.workflow_slug ? (
                    <Link
                      href={`/ai/run/${svc.workflow_slug}`}
                      className="inline-flex rounded-md bg-cyan-400/90 px-4 py-2 text-sm font-semibold text-[#041018] transition hover:bg-cyan-300"
                    >
                      Buy with ACP
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-md border border-white/20 px-4 py-2 text-sm text-white/85 transition hover:border-white/45"
                    onClick={() => setSelected(svc)}
                  >
                    Reviews
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {selected ? (
          <div className="mt-12">
            <ServiceReviewsPanel
              targetType="service"
              targetId={selected.review_target_id}
              label={selected.label}
              reviewerUserId={isAuthenticated ? user?.id : undefined}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
