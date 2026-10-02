import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "wACP PancakeSwap",
  description: "PancakeSwap V3 primary liquidity and V2 reference market for wACP.",
};

const V2_POOL = "0xF391ca2bcBaB93Afa23326ebF1e35DB950841601";
const WACP = "0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const V3_POOL = process.env.NEXT_PUBLIC_WACP_V3_POOL?.trim().toLowerCase() || "";
const V3_POOL_URL =
  process.env.NEXT_PUBLIC_WACP_V3_POOL_URL?.trim() ||
  (V3_POOL ? `https://pancakeswap.finance/liquidity/pool/bsc/${V3_POOL}` : "");

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
              New scarce liquidity targets <strong>PancakeSwap V3</strong> concentrated <code>wACP/USDT</code>.
              The existing <strong>V2</strong> pair remains a thin canonical reference market (smoke / oracle fallback).
            </p>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.75 }}>
              Operator playbook (Stage A/B/C):{" "}
              <a
                href="https://github.com/dragoncattrx-hub/ancap/blob/master/docs/WACP_LIQUIDITY_V3_PLAYBOOK.md"
                target="_blank"
                rel="noreferrer"
              >
                WACP_LIQUIDITY_V3_PLAYBOOK.md
              </a>
            </p>

            <h2 style={{ marginTop: 24, fontWeight: 700 }}>V3 primary</h2>
            {V3_POOL_URL ? (
              <div style={{ marginTop: 8, display: "grid", gap: 8, color: "var(--text-muted)" }}>
                <div>
                  <strong style={{ color: "var(--text)" }}>Pool:</strong>{" "}
                  <a href={V3_POOL_URL} target="_blank" rel="noreferrer">
                    open V3 pool
                  </a>
                </div>
                {V3_POOL ? (
                  <div>
                    <strong style={{ color: "var(--text)" }}>Address:</strong> <code>{V3_POOL}</code>
                  </div>
                ) : null}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)" }}>
                V3 pool URL will appear here after operator deployment (<code>WACP_V3_POOL</code> env).
              </p>
            )}

            <h2 style={{ marginTop: 28, fontWeight: 700 }}>V2 reference (thin)</h2>
            <ol style={{ lineHeight: 1.9, color: "var(--text-muted)" }}>
              <li>wACP production contract verified on BSC explorer</li>
              <li>Reserve / bridge / risk / contracts docs published</li>
              <li>Public reserve proof: <code>/api/v1/wacp/reserve-proof</code></li>
              <li>V2 pair: <code>{V2_POOL}</code></li>
              <li>Initial liquidity bootstrap tx: <code>0x82458ec2b17e5aa58201a625169e493bb5ce8159487d66846906d9de69587503</code></li>
            </ol>
            <div style={{ marginTop: 16, display: "grid", gap: 8, color: "var(--text-muted)" }}>
              <div>
                <strong style={{ color: "var(--text)" }}>V2 pool:</strong>{" "}
                <a
                  href={`https://pancakeswap.finance/liquidity/pool/bsc/${V2_POOL}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  open pool
                </a>
              </div>
              <div>
                <strong style={{ color: "var(--text)" }}>Swap:</strong>{" "}
                <a
                  href={`https://pancakeswap.finance/swap?inputCurrency=${USDT}&outputCurrency=${WACP}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  USDT → wACP
                </a>
              </div>
            </div>

            <p style={{ marginTop: 24, color: "var(--text-muted)", lineHeight: 1.75 }}>
              Large orders relative to active V3 depth should use{" "}
              <Link href="/buy-acp">OTC / exchange office routing</Link> instead of consuming the full concentrated
              band. wACP on BSC uses <strong>18 decimals</strong> on-chain.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
