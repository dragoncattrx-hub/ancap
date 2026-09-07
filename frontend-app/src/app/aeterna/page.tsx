"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { DnaNanobotScissors } from "@/components/DnaNanobotScissors";
import { DnaHelixSandbox } from "@/components/aeterna/DnaHelixSandbox";
import { GenomeHashVaultPanel } from "@/components/aeterna/GenomeHashVaultPanel";
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
    body: "Rotate the helix, swap base pairs locally, then settle ACP workflows on fingerprints — not wet-lab kits.",
  },
];

/** Public landing — sandbox + local hash work with zero account. Cloud vault sync is optional. */
export default function AeternaPage() {
  const [status, setStatus] = useState<AeternaStatus | null>(null);
  const [heroOk, setHeroOk] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/aeterna/status`, { credentials: "omit" });
        if (!res.ok) return;
        if (!cancelled) setStatus((await res.json()) as AeternaStatus);
      } catch {
        /* Public page stays usable offline / when API is briefly down */
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
        {heroOk ? (
          <Image
            src="/aeterna/hero.jpg"
            alt="AETERNA — DNA, Cas9 awareness, and blockchain settlement"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
            onError={() => setHeroOk(false)}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,#0d3a38_0%,#05070c_55%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#05070c]/90 via-[#05070c]/55 to-[#05070c]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-transparent to-[#05070c]/40" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 lg:px-8">
          <p className="font-[family-name:var(--font-display,inherit)] text-[clamp(3.5rem,12vw,8rem)] font-black leading-[0.85] tracking-[-0.06em] text-white">
            AETERNA
          </p>
          <h1 className="mt-5 max-w-xl text-xl font-medium tracking-[-0.02em] text-white/90 sm:text-2xl">
            Longevity rails for DNA you own — explore freely, pay ACP when you buy workflows.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/65">
            No registration required for the DNA sandbox or local hash vault. Sign in only if you want to
            sync a fingerprint or purchase a 1,000,000 ACP consult workflow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#dna-sandbox"
              className="rounded-md bg-[#7ad0c8] px-5 py-3 text-sm font-semibold text-[#04201e] transition hover:bg-[#9ae0d9]"
            >
              Open DNA sandbox
            </a>
            <Link
              href="/ai/workflows"
              className="rounded-md border border-white/30 px-5 py-3 text-sm font-medium text-white/90 transition hover:border-white/60"
            >
              Browse AETERNA workflows
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#05070c]" aria-label="Nanobot DNA scissors visualization">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="mb-4 text-xs uppercase tracking-[0.16em] text-white/40">
            Public demo · nanobots + chemical scissors
          </p>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <DnaNanobotScissors />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <section id="dna-sandbox" className="scroll-mt-24">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">DNA fragment sandbox</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
            Interactive double helix — drag to rotate, click a rung to replace A/T/G/C pairs. Educational
            only; ANCAP never hosts full reference genomes (disk stays lean).
          </p>
          <div className="mt-8">
            <DnaHelixSandbox />
          </div>
        </section>

        <section className="mt-16">
          <GenomeHashVaultPanel />
        </section>

        <section className="mt-16 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">What you can pay for</h2>
          <p className="mt-3 text-sm leading-7 text-white/65">
            Priority intents settle in ACP through Workflow Store at{" "}
            <span className="text-[#9ae0d9]">1,000,000 ACP</span> per AETERNA workflow. Clinical actions
            stay with verified partners — AETERNA is the capital and data rail, not a home CRISPR kit.
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

        <section className="mt-14 border-t border-white/10 pt-10">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Division status</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
            {status?.tagline ||
              "Eternal life rails: DNA vault, ACP workflows, licensed longevity partners."}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">
            {status?.compliance_note ||
              "AETERNA sells ACP-paid analysis, consult briefs, and licensed-partner handoffs only."}
          </p>
          <dl className="mt-8 grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-white/40">Feature</dt>
              <dd className="mt-1 text-2xl font-semibold">
                {status ? (status.feature_enabled ? "on" : "flagged off") : "public browse"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-white/40">Vault entries</dt>
              <dd className="mt-1 text-2xl font-semibold">{status?.vault_entries ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-white/40">Workflows</dt>
              <dd className="mt-1 text-2xl font-semibold">{status?.workflow_slugs.length ?? 5}</dd>
            </div>
          </dl>
          {status && (
            <>
              <p className="mt-6 text-sm text-white/55">{status.sequencing_import_hint}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/35">
                Next: {status.next_gate}
              </p>
              <ul className="mt-6 flex flex-wrap gap-2 font-mono text-xs text-white/50">
                {status.workflow_slugs.map((slug) => (
                  <li key={slug} className="border border-white/10 px-2 py-1">
                    {slug}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
