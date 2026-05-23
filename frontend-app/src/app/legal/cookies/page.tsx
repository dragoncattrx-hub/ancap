import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "Cookie Policy",
  description: "ANCAP cookie and local storage policy with necessary, analytics, and marketing preference categories.",
};

const categories = [
  {
    title: "Strictly necessary",
    examples: "Consent memory, login/session state, security checks, wallet connection state, language, theme, service-worker support.",
    consent: "Used without optional consent where required for the site to work.",
  },
  {
    title: "Analytics",
    examples: "Funnel events, page performance, error diagnostics, workflow conversion, aggregate product metrics.",
    consent: "Disabled by default and enabled only after consent where required.",
  },
  {
    title: "Marketing and attribution",
    examples: "Campaign source, referral attribution, partner code, paid-run attribution.",
    consent: "Disabled by default and enabled only after consent where required.",
  },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">Cookie policy</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Cookie and storage preferences</h1>
          <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base">
            Last updated: 23 May 2026. ANCAP uses a consent banner with equal access to accept optional storage,
            reject optional storage, or customize preferences. A necessary preference record is stored so the banner
            does not keep reappearing.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/legal/privacy" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              Privacy Notice
            </Link>
            <Link href="/legal/terms" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              User Agreement
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          {categories.map((category) => (
            <article key={category.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">{category.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">
                <span className="font-semibold text-white/84">Examples: </span>
                {category.examples}
              </p>
              <p className="mt-2 text-sm leading-7 text-white/70">
                <span className="font-semibold text-white/84">Consent: </span>
                {category.consent}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-sky-300/15 bg-sky-400/[0.055] p-5">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Regulatory references</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            EU and UK guidance generally distinguishes strictly necessary storage from optional analytics or marketing
            storage. Optional categories should require informed consent and should not be pre-enabled where consent is
            required.
          </p>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <a className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sky-100 transition hover:border-sky-300/35" href="https://commission.europa.eu/cookies-policy_en">
              European Commission cookie policy example
            </a>
            <a className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sky-100 transition hover:border-sky-300/35" href="https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en">
              EDPB consent guidelines
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
