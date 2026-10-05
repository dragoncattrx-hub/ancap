import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { HelioCheckoutPanel } from "@/components/HelioCheckoutPanel";

export const metadata = {
  title: "Buy ACP | Crypto-first top-up",
  description:
    "Get ACP via wACP bridge, credits invoice, MoonPay Commerce, or optional Stripe — then spend on workflows, API, and marketplace.",
};

const V3_POOL = "0xe626bd3ef516c4f784e5d5fb46e297d9c0d7f5e1";

export default function BuyAcpPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Buy ACP</h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          ACP is the accounting unit for workflows, API spend, exchange tickets, and merchant checkout.
          Bridge wrap: <strong>1 ACP ↔ 10 wACP</strong>. Prefer crypto rails first — card adapters are
          optional.
        </p>
        <p className="mt-3 text-sm leading-7 text-white/55">
          There is no fixed web &quot;$1 ACP / USDT TRC-20&quot; sale. Use bridge or credits on web; USDT→ACP
          tickets remain available in the mobile wallet Exchange tab. See{" "}
          <Link href="/markets" className="underline">
            /markets
          </Link>{" "}
          and{" "}
          <Link href="/legal/welcome-grant" className="underline">
            welcome-grant legal
          </Link>
          .
        </p>
        <p className="mt-3 text-sm leading-7 text-white/55">
          For wACP size above roughly <strong>25%</strong> of active PancakeSwap V3 depth, use the mobile
          Exchange office or desk-assisted OTC instead of hitting the public pool — see{" "}
          <Link href="/docs/wacp/pancakeswap" className="underline">
            wACP liquidity playbook
          </Link>
          . Bootstrap V3:{" "}
          <a
            href={`https://pancakeswap.finance/liquidity/pool/bsc/${V3_POOL}`}
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            shallow pool
          </a>
          .
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300/90">
            1. Get ACP (recommended)
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/bridge"
              className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950"
            >
              Bridge wACP ↔ ACP
            </Link>
            <Link
              href="/wallet/credits"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85"
            >
              Credits invoice / packages
            </Link>
            <Link
              href="/wallet/acp"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85"
            >
              ACP wallet
            </Link>
          </div>
          <p className="text-xs leading-6 text-white/50">
            Mobile wallet Exchange tab can quote and auth-settle USDT→ACP tickets (not the retired web desk).
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300/90">
            MoonPay Commerce checkout
          </h2>
          <p className="text-sm leading-7 text-white/55">
            Pay with card or crypto via MoonPay Commerce (Helio). Default quote currency is USDC; ACP
            ledger credit is confirmed after webhook / desk settle.
          </p>
          <HelioCheckoutPanel />
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300/90">
            2. Spend ACP (platform profit)
          </h2>
          <p className="text-sm leading-7 text-white/55">
            Profit is fee income from real spend — not PancakeSwap APR. Golden path: buy/bridge → run one
            paid surface → confirm fee on{" "}
            <Link href="/treasury" className="underline">
              /treasury
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/ai/workflows"
              className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950"
            >
              Paid workflows
            </Link>
            <Link
              href="/developers"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85"
            >
              Paid API keys
            </Link>
            <Link
              href="/marketplace"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85"
            >
              Marketplace
            </Link>
            <Link
              href="/listings"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85"
            >
              Create listing
            </Link>
          </div>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">
            Optional Stripe adapter
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/wallet/top-up"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85"
            >
              Card top-up (Stripe)
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85"
            >
              Pricing
            </Link>
            <Link
              href="/cards"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85"
            >
              Physical card / Apple Pay waitlist
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
