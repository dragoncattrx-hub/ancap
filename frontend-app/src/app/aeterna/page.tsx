"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { getApiUrl } from "@/lib/api";

type AeternaStatus = {
  feature_enabled: boolean;
  division: string;
  tagline: string;
  vault_entries: number;
  intent_orders: number;
  partners_verified: number;
  workflow_slugs: string[];
  sequencing_import_hint: string;
  compliance_note: string;
  next_gate: string;
};

const INTENTS = [
  {
    title: "Pigmentation consult",
    body: "Eye-color and pigmentation goals as licensed-clinic consult briefs — not DIY editing.",
  },
  {
    title: "Telomere panel",
    body: "Panel review shells for clinician interpretation of telomere-related labs.",
  },
  {
    title: "Disease-risk navigator",
    body: "Educational risk themes from vaulted genomic metadata for provider discussion.",
  },
  {
    title: "DNA sandbox",
    body: "Explore annotations on your sequenced data; play with maps, not wet-lab protocols.",
  },
];

export default function AeternaPage() {
  const [status, setStatus] = useState<AeternaStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/aeterna/status`);
        if (!res.ok) throw new Error(`Status unavailable (${res.status})`);
        if (!cancelled) setStatus((await res.json()) as AeternaStatus);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load AETERNA");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#05070c] text-[#e8eef8]">
      <Navigation />

      <section className="relative min-h-[100svh] overflow-hidden">
        <Image
          src="/aeterna/hero.jpg"
          alt="AETERNA — DNA, Cas9 awareness, and blockchain settlement"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05070c]/90 via-[#05070c]/55 to-[#05070c]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-transparent to-[#05070c]/40" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 lg:px-8">
          <p className="font-[family-name:var(--font-display,inherit)] text-[clamp(3.5rem,12vw,8rem)] font-black leading-[0.85] tracking-[-0.06em] text-white">
            AETERNA
          </p>
          <h1 className="mt-5 max-w-xl text-xl font-medium tracking-[-0.02em] text-white/90 sm:text-2xl">
            Longevity rails for DNA you own — pay ACP, explore your genome, route licensed partners.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/65">
            Upload or link Sequencing.com exports. Buy workflows for wellness reports, longevity panels,
            pigmentation consults, and disease-risk navigators.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/ai/workflows"
              className="rounded-md bg-[#7ad0c8] px-5 py-3 text-sm font-semibold text-[#04201e] transition hover:bg-[#9ae0d9]"
            >
              Browse AETERNA workflows
            </Link>
            <a
              href="https://sequencing.com/"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-white/30 px-5 py-3 text-sm font-medium text-white/90 transition hover:border-white/60"
            >
              Sequencing.com
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">What you can pay for</h2>
          <p className="mt-3 text-sm leading-7 text-white/65">
            Priority intents settle in ACP through Workflow Store. Clinical actions stay with verified
            partners — AETERNA is the capital and data rail, not a home CRISPR kit.
          </p>
        </section>

        <ul className="mt-10 grid gap-8 sm:grid-cols-2">
          {INTENTS.map((item) => (
            <li key={item.title}>
              <h3 className="text-lg font-medium tracking-[-0.02em] text-[#9ae0d9]">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-white/65">{item.body}</p>
            </li>
          ))}
        </ul>

        {error && <p className="mt-10 text-sm text-amber-300">{error}</p>}

        {status && (
          <section className="mt-14 border-t border-white/10 pt-10">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Division status</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">{status.tagline}</p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">{status.compliance_note}</p>
            <dl className="mt-8 grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-white/40">Feature</dt>
                <dd className="mt-1 text-2xl font-semibold">{status.feature_enabled ? "on" : "flagged off"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-white/40">Vault entries</dt>
                <dd className="mt-1 text-2xl font-semibold">{status.vault_entries}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-white/40">Workflows</dt>
                <dd className="mt-1 text-2xl font-semibold">{status.workflow_slugs.length}</dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-white/55">{status.sequencing_import_hint}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/35">Next: {status.next_gate}</p>
            <ul className="mt-6 flex flex-wrap gap-2 font-mono text-xs text-white/50">
              {status.workflow_slugs.map((slug) => (
                <li key={slug} className="border border-white/10 px-2 py-1">
                  {slug}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
