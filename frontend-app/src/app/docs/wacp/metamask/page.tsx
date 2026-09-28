import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { SiteLegalFooter } from "@/components/legal/LegalViews";
import { WACP_BSC_CONTRACT, WACP_SYMBOL } from "@/lib/wacpToken";

export const metadata = {
  title: "Add official wACP in MetaMask",
  description:
    "How to add the official Wrapped ACP (wACP) BEP-20 contract in MetaMask and spot fake lookalikes.",
};

export default function WacpMetamaskPage() {
  return (
    <div className="relative min-h-screen">
      <Navigation />
      <main className="container" style={{ padding: "48px 24px 72px", maxWidth: 820 }}>
        <div className="section-num">WACP · METAMASK</div>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 850, margin: "10px 0 14px" }}>
          Official {WACP_SYMBOL} only
        </h1>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 20 }}>
          ANCAP will never ask you to “remove a suspicious token” through a chat agent. Verify addresses
          yourself against the official list, then hide unknown tokens in your wallet UI if you choose.
        </p>

        <section className="card" style={{ borderRadius: 8, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Canonical BSC contract</h2>
          <p className="break-all" style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
            {WACP_BSC_CONTRACT}
          </p>
          <ul style={{ color: "var(--text-muted)", lineHeight: 1.75, paddingLeft: 20 }}>
            <li>Symbol: {WACP_SYMBOL} (Wrapped ACP)</li>
            <li>Chain: BNB Smart Chain (chain id 56)</li>
            <li>Decimals: 18</li>
            <li>
              Do <strong>not</strong> search CoinGecko ticker “ACP” (Arena Of Faith collision).
            </li>
          </ul>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            <Link href="/docs/wacp/contracts" className="btn btn-ghost">
              Contract docs
            </Link>
            <a href="/tokenlist.json" className="btn btn-ghost">
              tokenlist.json
            </a>
            <Link href="/markets" className="btn btn-ghost">
              Markets hub
            </Link>
          </div>
        </section>

        <section className="card" style={{ borderRadius: 8, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Add in MetaMask</h2>
          <ol style={{ color: "var(--text-muted)", lineHeight: 1.75, paddingLeft: 20 }}>
            <li>Switch MetaMask to BNB Smart Chain.</li>
            <li>Import tokens → Custom token.</li>
            <li>Paste the canonical address above (character-for-character).</li>
            <li>Confirm symbol {WACP_SYMBOL} and 18 decimals.</li>
          </ol>
        </section>

        <section className="card" style={{ borderRadius: 8 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Fake-token checks</h2>
          <ul style={{ color: "var(--text-muted)", lineHeight: 1.75, paddingLeft: 20 }}>
            <li>Same name/logo with a different address is not official.</li>
            <li>Compare against <code>/tokenlist.json</code> and BscScan token page linked from /markets.</li>
            <li>Never enter a seed phrase into a website or chat bot.</li>
            <li>Hiding a token in MetaMask is a local UI action — ANCAP cannot remotely delete assets from your wallet.</li>
          </ul>
        </section>
      </main>
      <SiteLegalFooter />
    </div>
  );
}
