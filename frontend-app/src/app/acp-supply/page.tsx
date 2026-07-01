import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { getServerApiBase } from "@/lib/serverApi";

const API_BASE = getServerApiBase();

async function loadSupply() {
  try {
    const [statusRes, explorerRes] = await Promise.all([
      fetch(`${API_BASE}/acp/explorer/status`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE}/wacp/status`, { next: { revalidate: 60 } }),
    ]);
    const explorer = statusRes.ok ? await statusRes.json() : null;
    const wacp = explorerRes.ok ? await explorerRes.json() : null;
    return { explorer, wacp };
  } catch {
    return { explorer: null, wacp: null };
  }
}

export const metadata = {
  title: "ACP Supply | ANCAP transparency",
  description: "Public ACP chain height snapshot and wACP bridge supply context.",
};

export default async function AcpSupplyPage() {
  const { explorer, wacp } = await loadSupply();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold">ACP supply snapshot</h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          Public transparency surface for native ACP chain activity and bridged wACP context. This is not a certified audit — verify bridge contracts before moving funds.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold">Native ACP chain</h2>
            {explorer ? (
              <div className="mt-3 space-y-1 text-sm text-white/70">
                <div>Chain ID: {explorer.chain_id}</div>
                <div>Block height: {explorer.block_height}</div>
                <div className="break-all">Best hash: {explorer.best_block_hash}</div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-amber-200">Explorer RPC unavailable</p>
            )}
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold">wACP bridge</h2>
            {wacp ? (
              <div className="mt-3 space-y-1 text-sm text-white/70">
                <div>Status: {wacp.status}</div>
                <div>Reserve health: {wacp.reserve_health}</div>
                <div className="break-all">wACP contract: {wacp.wacp_contract || "—"}</div>
                <div className="break-all">Reserve ACP: {wacp.reserve_acp_address || "—"}</div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-amber-200">Bridge status unavailable</p>
            )}
          </section>
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/reserves" className="text-emerald-300">
            Reserves dashboard
          </Link>
          <Link href="/explorer" className="text-emerald-300">
            ACP explorer
          </Link>
          <Link href="/status" className="text-emerald-300">
            Platform status
          </Link>
        </div>
      </main>
    </div>
  );
}
