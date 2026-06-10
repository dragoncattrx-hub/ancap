import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "Simple wallet mode | ANCAP",
  description: "Email OTP and internal ACP credits — embedded wallet preview.",
};

export default function SimpleWalletPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Simple wallet mode</h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          Beginner mode: email OTP login with internal ACP credit balance. Advanced mode keeps seed export and mobile FFI wallet — toggle ships with embedded wallet partner integration (Privy/CDP/Circle eval).
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/wallet/credits" className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950">
            Use credits wallet now
          </Link>
          <Link href="/wallet/acp" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85">
            Advanced ACP wallet
          </Link>
        </div>
      </main>
    </div>
  );
}
