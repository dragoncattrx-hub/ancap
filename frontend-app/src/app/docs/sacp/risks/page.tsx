import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "sACP Risks",
  description: "Risk disclosures for Stable ACP (sACP).",
};

export default function SacpRisksPage() {
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
              <h1 style={{ margin: 0, fontWeight: 800 }}>Risk disclosures</h1>
            </div>
            <Link href="/docs/sacp">Overview</Link>
          </div>
          <ul style={{ color: "var(--text-muted)", lineHeight: 1.9, maxWidth: 900 }}>
            <li>
              <strong>Soft peg only.</strong> sACP targets USD for commerce pricing. There is no guarantee of
              1:1 USD redemption or bank-deposit equivalence.
            </li>
            <li>
              <strong>ACP collateral risk.</strong> Reserve health depends on ACP market value, custody, and
              operator processes — similar honesty bar as the wACP bridge.
            </li>
            <li>
              <strong>Operator-mediated.</strong> Mint/redeem orchestration is custodial until further
              decentralization. Pause and gateway key risk apply.
            </li>
            <li>
              <strong>Not wACP.</strong> Confusing sACP with wACP (1:1 ACP wrap) or with partner USDC/USDT can
              cause wrong expectations about backing and redemption.
            </li>
            <li>
              <strong>Compliance.</strong> Public mint may require jurisdictional review (e.g. MiCA / e-money)
              before broad distribution.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
