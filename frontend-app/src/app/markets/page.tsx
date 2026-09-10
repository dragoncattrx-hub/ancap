"use client";

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { WacpPublicActions } from "@/components/WacpPublicActions";
import { SiteLegalFooter } from "@/components/legal/LegalViews";
import {
  WACP_BSC_CONTRACT,
  WACP_SYMBOL,
  getWacpLogoUrl,
} from "@/lib/wacpToken";

const POOL = "0xF391ca2bcBaB93Afa23326ebF1e35DB950841601";
const GATEWAY = "0x57c24FF77B23a82328cb88914D4FD4EEBd93321b";

const LIVE = [
  {
    title: "PancakeSwap (trade by address)",
    status: "Live — no approval needed",
    body: "Import wACP by contract on BSC and trade the wACP/USDT V2 pair. Official default token lists are curated; address import always works.",
    href: `https://pancakeswap.finance/swap?inputCurrency=0x55d398326f99059fF775485246999027B3197955&outputCurrency=${WACP_BSC_CONTRACT}`,
    external: true,
  },
  {
    title: "GeckoTerminal",
    status: "Indexed",
    body: "CoinGecko’s DEX terminal already tracks Wrapped ACP and the PancakeSwap pool. Full CoinGecko coin page still needs liquidity + Partners form.",
    href: `https://www.geckoterminal.com/bsc/pools/${POOL.toLowerCase()}`,
    external: true,
  },
  {
    title: "BscScan",
    status: "Live",
    body: "On-chain token page for the official wACP contract.",
    href: `https://bscscan.com/token/${WACP_BSC_CONTRACT}`,
    external: true,
  },
  {
    title: "ANCAP official token list",
    status: "Self-hosted — import anywhere",
    body: "Uniswap-compatible JSON. Add this URL in wallets / DEX custom token lists that support Token Lists.",
    href: "/tokenlist.json",
    external: false,
  },
];

const LATER = [
  {
    title: "CoinGecko Active Listing",
    body: "Blocked until pool liquidity/volume is non-dust. Use docs/COINGECKO_LISTING_PLAYBOOK.md — list as wACP, never as ticker ACP.",
    href: "/legal/market-data",
  },
  {
    title: "DexScreener",
    body: "Auto-indexes after meaningful pool activity. Dust / zero-volume pairs often stay invisible — seed liquidity and make a few swaps.",
    href: `https://dexscreener.com/bsc/${POOL}`,
  },
  {
    title: "Trust Wallet Assets",
    body: "Community PR pack prepared under docs/listings/trustwallet-smartchain-wacp/ — submit to trustwallet/assets when ready.",
    href: "https://github.com/trustwallet/assets",
  },
];

export default function MarketsPage() {
  return (
    <div className="relative min-h-screen">
      <Navigation />
      <main className="container" style={{ padding: "48px 24px 72px" }}>
        <div className="section-num">PUBLIC MARKETS</div>
        <h1
          style={{
            fontSize: "clamp(1.9rem, 4vw, 2.9rem)",
            fontWeight: 850,
            margin: "10px 0 14px",
            maxWidth: 820,
          }}
        >
          Where wACP is already visible
        </h1>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 760, marginBottom: 28 }}>
          No CoinGecko approval required for these surfaces. Official asset is{" "}
          <strong>{WACP_SYMBOL}</strong> on BNB Smart Chain — not the unrelated CoinGecko ticker
          “ACP” (Arena Of Faith). Native ACP stays on the ANCAP chain; sACP lists after mainnet deploy.
        </p>

        <div
          className="card"
          style={{
            marginBottom: 28,
            borderRadius: 8,
            background: "rgba(18, 26, 45, 0.82)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getWacpLogoUrl()}
              alt="wACP"
              width={56}
              height={56}
              style={{ borderRadius: 12, background: "#000" }}
            />
            <div style={{ flex: "1 1 240px" }}>
              <div style={{ fontWeight: 800, fontSize: "1.15rem" }}>Wrapped ACP · {WACP_SYMBOL}</div>
              <div className="break-all" style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 6 }}>
                {WACP_BSC_CONTRACT}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 6 }}>
                Gateway {GATEWAY}
              </div>
            </div>
            <WacpPublicActions layout="home" />
          </div>
        </div>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 14 }}>Live without gatekeepers</h2>
        <div className="responsive-grid responsive-grid-2" style={{ gap: 14, marginBottom: 36 }}>
          {LIVE.map((item) => (
            <div key={item.title} className="card" style={{ borderRadius: 8, minWidth: 0 }}>
              <div className="badge badge-success" style={{ marginBottom: 12 }}>
                {item.status}
              </div>
              <h3 style={{ margin: "0 0 10px", fontSize: "1.05rem" }}>{item.title}</h3>
              <p style={{ margin: "0 0 14px", color: "var(--text-muted)", lineHeight: 1.65 }}>{item.body}</p>
              {item.external ? (
                <a href={item.href} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
                  Open
                </a>
              ) : (
                <Link href={item.href} className="btn btn-ghost">
                  Open token list
                </Link>
              )}
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 14 }}>Needs liquidity / review</h2>
        <div className="responsive-grid responsive-grid-2" style={{ gap: 14, marginBottom: 36 }}>
          {LATER.map((item) => (
            <div key={item.title} className="card" style={{ borderRadius: 8, minWidth: 0 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: "1.05rem" }}>{item.title}</h3>
              <p style={{ margin: "0 0 14px", color: "var(--text-muted)", lineHeight: 1.65 }}>{item.body}</p>
              <a href={item.href} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
                Details
              </a>
            </div>
          ))}
        </div>

        <div className="card" style={{ borderRadius: 8 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Import the official list</h2>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.65 }}>
            Token list URL (copy into wallet / DEX custom lists):
          </p>
          <code style={{ display: "block", wordBreak: "break-all", marginTop: 8 }}>
            https://ancap.cloud/tokenlist.json
          </code>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <Link href="/docs/wacp" className="btn btn-ghost">
              wACP docs
            </Link>
            <Link href="/bridge/acp-bsc" className="btn btn-ghost">
              Bridge
            </Link>
            <Link href="/legal/market-data" className="btn btn-ghost">
              Market data disclosure
            </Link>
            <Link href="/docs/wacp/pancakeswap" className="btn btn-ghost">
              PancakeSwap notes
            </Link>
          </div>
        </div>
      </main>
      <SiteLegalFooter />
    </div>
  );
}
