import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "wACP PancakeSwap",
  description: "PancakeSwap launch and listing playbook for wACP.",
};

export default function WacpPancakeDocsPage() {
  return (
    <>
      <div className="min-h-screen">
        <Navigation />
        <main className="container" style={{ padding: "48px 24px 72px" }}>
          <div className="card">
            <div className="card-header">
              <h1 style={{ margin: 0, fontWeight: 800 }}>wACP → PancakeSwap</h1>
              <span className="badge badge-active">Playbook</span>
            </div>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.75 }}>
              PancakeSwap V2 was used for the first public technical bootstrap. The current pair is <code>wACP/USDT</code>. This is live for smoke-testing, not yet positioned as a deep-liquidity market launch.
            </p>
            <ol style={{ lineHeight: 1.9, color: "var(--text-muted)" }}>
              <li>wACP production contract verified on BSC explorer</li>
              <li>Reserve / bridge / risk / contracts docs published</li>
              <li>Public reserve proof and status endpoints published</li>
              <li>Pair created on PancakeSwap V2: <code>0xF391ca2bcBaB93Afa23326ebF1e35DB950841601</code></li>
              <li>Initial liquidity bootstrap tx: <code>0x82458ec2b17e5aa58201a625169e493bb5ce8159487d66846906d9de69587503</code></li>
              <li>Smoke-test swaps completed in both directions</li>
              <li>Metadata / logo review by external platforms remains pending</li>
            </ol>
            <div style={{ marginTop: 16, display: "grid", gap: 8, color: "var(--text-muted)" }}>
              <div><strong style={{ color: "var(--text)" }}>Pool link:</strong> <a href="https://pancakeswap.finance/liquidity/pool/bsc/0xF391ca2bcBaB93Afa23326ebF1e35DB950841601" target="_blank" rel="noreferrer">open pool</a></div>
              <div><strong style={{ color: "var(--text)" }}>Swap link:</strong> <a href="https://pancakeswap.finance/swap?inputCurrency=0x55d398326f99059fF775485246999027B3197955&outputCurrency=0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402" target="_blank" rel="noreferrer">open swap</a></div>
              <div><strong style={{ color: "var(--text)" }}>First swap A:</strong> <code>0xe6b867346d6acfdef7e0a34c457dd48c9bf572c7e0aa94224c705dc83c1a504c</code></div>
              <div><strong style={{ color: "var(--text)" }}>First swap B:</strong> <code>0x02ff5659d584aabf7bfe19c508c7673ba449ff89c1df07069cc272a6a8ab6795</code></div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
