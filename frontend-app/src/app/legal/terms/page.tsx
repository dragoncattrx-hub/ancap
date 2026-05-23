import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "User Agreement",
  description: "ANCAP user agreement for paid AI workflows, ACP payments, creator listings, API usage, and proof receipts.",
};

const terms = [
  {
    title: "1. Parties and acceptance",
    body:
      "These Terms are a template user agreement between the ANCAP platform operator and each user of ancap.cloud, the API, wallet, workflow store, creator tools, and related services. By using the services, creating an account, connecting a wallet, buying a workflow, publishing a listing, or using the API, you agree to these Terms.",
  },
  {
    title: "2. Operator details",
    body:
      "Before commercial launch, the operator must insert the legal entity name, registered address, registration number, tax number where applicable, support email, and governing jurisdiction. If a signed enterprise agreement conflicts with these Terms, the signed agreement controls for that customer.",
  },
  {
    title: "3. Eligibility",
    body:
      "You must have legal capacity to enter into this agreement and may not use ANCAP if laws, sanctions, export controls, or platform restrictions prohibit your use. You are responsible for determining whether crypto-asset, AI, data, tax, and business rules in your jurisdiction allow your intended use.",
  },
  {
    title: "4. Services",
    body:
      "ANCAP provides paid AI-workflow execution, workflow listings, creator publishing tools, ACP wallet/accounting features, paid API products, proof receipts, sample reports, search, analytics, and related operational tools. The service may change as the platform develops.",
  },
  {
    title: "5. ACP, credits, payments, and refunds",
    body:
      "ACP is the primary platform accounting and payment unit. Platform credits, wallet balances, payment intents, and receipts may be denominated in ACP. Unless a separate policy states otherwise, workflow purchases are consumed when execution begins. Refunds, credits, or compensation for failed or degraded runs are handled under platform policy and may depend on logs, status, and proof data.",
  },
  {
    title: "6. AI outputs and review duty",
    body:
      "AI-generated outputs can be inaccurate, incomplete, delayed, or unsuitable for a specific legal, financial, technical, compliance, or business decision. ANCAP sells workflow execution artifacts, not investment advice, legal advice, tax advice, financial advice, or guaranteed business outcomes. You must review outputs before relying on them.",
  },
  {
    title: "7. Creator listings",
    body:
      "Creators may submit workflow offers, schemas, prices, samples, proof policies, and related materials. ANCAP may review, reject, suspend, rank, modify display, or remove listings to protect users, comply with law, reduce spam, and maintain quality. Creator earnings may be subject to take rates, holds, refunds, abuse checks, taxes, and payout rules.",
  },
  {
    title: "8. API use",
    body:
      "API users must protect API keys, respect rate limits, spend caps, idempotency rules, and usage policies. ANCAP may throttle, suspend, or block requests that threaten stability, violate policy, bypass payment, scrape protected resources, abuse AI/LLM services, or create legal/security risk.",
  },
  {
    title: "9. Prohibited conduct",
    body:
      "You may not use ANCAP to commit fraud, evade sanctions, launder funds, attack systems, distribute malware, violate privacy rights, infringe IP, manipulate markets, impersonate others, spam users, misrepresent AI outputs as certified advice, or create illegal financial promotions.",
  },
  {
    title: "10. Intellectual property",
    body:
      "ANCAP and its licensors retain rights in the platform, software, brand, documentation, and system designs. You retain rights in lawful input content you provide. You grant ANCAP the rights needed to process inputs, run workflows, generate outputs, operate proof receipts, enforce policies, and improve the service as described in privacy and data terms.",
  },
  {
    title: "11. Privacy, cookies, and data",
    body:
      "Personal data and cookie preferences are handled under the Privacy Notice and Cookie Policy. Necessary storage supports login, security, wallet state, language, theme, and consent memory. Optional analytics or marketing storage should be activated only after valid consent where required.",
  },
  {
    title: "12. Disclaimers and limitation of liability",
    body:
      "To the maximum extent permitted by law, ANCAP is provided as-is and as-available without warranties of uninterrupted operation, error-free AI output, market value, liquidity, regulatory approval, or fitness for a particular purpose. Liability limits, exclusions, mandatory consumer rights, and local law carve-outs must be finalized by counsel for the operator jurisdiction.",
  },
  {
    title: "13. Suspension and termination",
    body:
      "ANCAP may suspend or terminate access, keys, listings, payouts, or workflows for security, abuse, unpaid amounts, suspected fraud, legal risk, policy violations, or platform integrity. Users may stop using the service at any time, subject to outstanding obligations and data retention rules.",
  },
  {
    title: "14. Changes",
    body:
      "ANCAP may update these Terms as the product, law, or risk environment changes. Material changes should be communicated through the site, account notice, email, or another reasonable channel. Continued use after the effective date means acceptance of the updated Terms.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">Legal agreement</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">ANCAP User Agreement</h1>
          <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base">
            Last updated: 23 May 2026. This is a production-ready legal template for the ANCAP website, but it must be
            reviewed and completed by qualified counsel before relying on it as the final binding agreement.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/legal/privacy" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              Privacy Notice
            </Link>
            <Link href="/legal/cookies" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              Cookie Policy
            </Link>
            <Link href="/whitepaper/acp" className="rounded-full border border-emerald-400/25 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/50 hover:text-emerald-100">
              ACP Whitepaper
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          {terms.map((term) => (
            <article key={term.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">{term.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">{term.body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
