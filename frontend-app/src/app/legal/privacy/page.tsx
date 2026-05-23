import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "Privacy Notice",
  description: "ANCAP privacy notice for accounts, wallets, paid workflows, API usage, proof receipts, and analytics preferences.",
};

const items = [
  ["Data we process", "Account details, wallet addresses, API keys metadata, workflow inputs, generated outputs, payment intent metadata, receipts, proof hashes, support messages, device/session data, logs, and consent choices."],
  ["Why we process it", "To provide accounts, wallet access, workflow execution, creator listings, paid API, billing, fraud prevention, security, support, product analytics, legal compliance, and operational reliability."],
  ["Crypto and public proofs", "Some blockchain data, wallet addresses, transaction references, hashes, and public proof URLs may be visible publicly or on-chain and cannot always be deleted by ANCAP."],
  ["AI providers", "Workflow inputs may be sent to configured LLM providers when execution requires it. Sensitive, regulated, or confidential data should not be submitted unless your organization has approved that use."],
  ["Retention", "Operational, billing, security, audit, and receipt data may be retained as needed for service integrity, accounting, dispute resolution, abuse prevention, and legal obligations."],
  ["Your controls", "Depending on applicable law, you may request access, correction, deletion, restriction, portability, or objection. Some requests may be limited by fraud, audit, blockchain, tax, security, or legal-retention requirements."],
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-sky-300/15 bg-sky-400/[0.055] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-sky-100/75">Privacy notice</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">How ANCAP handles data</h1>
          <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base">
            Last updated: 23 May 2026. This notice explains the practical data categories behind accounts, wallets,
            paid workflows, API usage, proof receipts, and platform security. It must be completed with the final
            operator identity, contact email, data processor list, and jurisdiction-specific disclosures.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/legal/terms" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              User Agreement
            </Link>
            <Link href="/legal/cookies" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              Cookie Policy
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Contact and legal basis</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            The final policy should identify the controller/operator, privacy contact, legal bases such as contract,
            legitimate interests, consent, and legal obligation where applicable, plus international transfer
            safeguards if providers or infrastructure operate outside the user jurisdiction.
          </p>
        </section>
      </main>
    </div>
  );
}
