import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "ANCAP Reserves | Bridge transparency",
  description: "Bridge reserve addresses, backing disclosure, and fake-address warnings.",
};

export default function ReservesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Reserves & bridge transparency</h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          Public reserve dashboard (beta stub). Full monthly transparency report ships in the 61–90 day scale phase. Always verify bridge contract addresses on official ANCAP docs before sending funds.
        </p>
        <div className="mt-8 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5 text-sm text-amber-100/90">
          Never send assets to addresses shared only in DMs or unofficial channels. Use{" "}
          <Link href="/docs/wacp/bridge" className="underline">official bridge documentation</Link> and{" "}
          <Link href="/docs/wacp/contracts" className="underline">published contracts</Link>.
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["wACP reserve (BSC)", "See /docs/wacp/reserve"],
            ["ACP supply", "/acp-supply (planned)"],
            ["Bridge status", "/bridge"],
            ["Proof center", "/proof-center"],
          ].map(([title, href]) => (
            <Link key={title} href={href.startsWith("/") ? href : "/docs/wacp/reserve"} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20">
              <div className="font-semibold">{title}</div>
              <div className="mt-2 text-sm text-white/60">{href}</div>
            </Link>
          ))}
        </div>
        <Link href="/status" className="mt-8 inline-block text-sm text-emerald-300">
          Platform status
        </Link>
      </main>
    </div>
  );
}
