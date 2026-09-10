import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "sACP Reserve",
  description: "ACP collateral model for the Stable ACP (sACP) soft USD peg.",
};

export default function SacpReservePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container" style={{ padding: "48px 24px 72px" }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="section-num" style={{ marginBottom: 10 }}>
                sACP
              </div>
              <h1 style={{ margin: 0, fontWeight: 800 }}>Reserve / collateral model</h1>
            </div>
            <Link href="/docs/sacp">Overview</Link>
          </div>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.75, marginTop: 16, maxWidth: 900 }}>
            Target peg: <code>1 sACP ≈ 1 USD</code>. Collateral is ACP held in a dedicated reserve with a
            minimum overcollateralization ratio (default 150%). Live proof endpoints report circulating
            supply vs collateral once the BSC contract and indexer are wired (S1–S2).
          </p>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.75, maxWidth: 900 }}>
            Canonical target invariant:{" "}
            <code>collateral_value_usd(ACP_reserve) &gt;= min_collateral_ratio × circulating_sACP</code>.
          </p>
          <p style={{ marginTop: 24 }}>
            <Link href="/api/v1/sacp/reserve-proof">Live reserve-proof JSON</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
