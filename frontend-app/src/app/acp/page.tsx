"use client";

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useLanguage } from "@/components/LanguageProvider";

export default function AcpLandingPage() {
  const { t } = useLanguage();
  return (
    <>
      <NetworkBackground />

      <div className="min-h-screen">
        <Navigation />

        <main className="container" style={{ padding: "48px 24px 72px" }}>
          {/* Hero */}
          <section style={{ padding: "24px 0 44px" }}>
            <div className="card" style={{ background: "linear-gradient(135deg, rgba(0, 212, 170, 0.06), rgba(0, 168, 138, 0.02))" }}>
              <div className="card-header" style={{ alignItems: "center" }}>
                <div>
                  <div className="section-num" style={{ marginBottom: 10 }}>
                    {t("hero.acpToken")}
                  </div>
                  <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 10 }}>
                    {t("acpLanding.title")}
                  </h1>
                  <p style={{ color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 780, margin: 0 }}>
                    {t("acpLanding.lead")}
                  </p>
                </div>
                <span className="badge badge-active" style={{ alignSelf: "flex-start" }}>
                  {t("acpLanding.badge")}
                </span>
              </div>

              <p style={{ color: "var(--text-muted)", lineHeight: 1.75, maxWidth: 900, margin: "16px 0 0" }}>
                {t("acpLanding.statusLead")}
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
                <Link href="/wallet/acp" className="btn btn-primary">
                  {t("acpLanding.walletCta")}
                </Link>
                <a href="/projects" className="btn btn-ghost">
                  {t("acpLanding.platformOverview")}
                </a>
                <a href="/#vision" className="btn btn-ghost">
                  {t("acpLanding.l123Vision")}
                </a>
                <a href="/api/docs" className="btn btn-ghost" target="_blank" rel="noopener">
                  {t("acpLanding.apiDocs")}
                </a>
              </div>
            </div>
          </section>

          {/* Section 01 */}
          <section style={{ padding: "22px 0" }}>
            <span className="section-num">01</span>
            <h2 style={{ fontSize: "clamp(1.3rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
              {t("acpLanding.whatIs")}
            </h2>
            <div className="responsive-grid responsive-grid-3">
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 700, margin: 0, color: "#34d399" }}>{t("acpLanding.nativeToken")}</h3>
                  <span className="badge badge-active">ACP</span>
                </div>
                <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  {t("acpLanding.nativeTokenDesc")}
                </p>
              </div>
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 700, margin: 0 }}>{t("acpLanding.chainAnchors")}</h3>
                  <span className="badge badge-active">L3</span>
                </div>
                <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{t("acpLanding.anchorsCard")}</p>
              </div>
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 700, margin: 0 }}>{t("acpLanding.aiIdentity")}</h3>
                  <span className="badge badge-active">Proof-of-Agent</span>
                </div>
                <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  {t("acpLanding.aiIdentityDesc")}
                </p>
              </div>
            </div>
          </section>

          {/* Section 02 */}
          <section style={{ padding: "34px 0 22px", borderTop: "1px solid var(--border)" }}>
            <span className="section-num">02</span>
            <h2 style={{ fontSize: "clamp(1.3rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
              Repository modules (ACP-crypto)
            </h2>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 18, maxWidth: 900 }}>
              ACP lives in the ANCAP monorepo under <code>ACP-crypto</code>. It includes crypto primitives, a node, and wallet/examples.
            </p>
            <div className="responsive-grid responsive-grid-3">
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 10 }}>acp-crypto</h3>
                <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  BIP39 mnemonic, bech32 <code>acp1...</code> addresses, transactions/blocks, protocol params (supply, emission, fees).
                </p>
              </div>
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 10 }}>acp-node</h3>
                <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  RocksDB-backed node with mempool, JSON-RPC, and mining. Intended as anchor target for ANCAP’s chain driver.
                </p>
              </div>
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 10 }}>acp-wallet</h3>
                <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  CLI wallet + examples for genesis and transfers. Helps bootstrap a testnet and validate the end-to-end flow.
                </p>
              </div>
            </div>
          </section>

          {/* Section 03 */}
          <section style={{ padding: "34px 0 22px", borderTop: "1px solid var(--border)" }}>
            <span className="section-num">03</span>
            <h2 style={{ fontSize: "clamp(1.3rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
              L3 features implemented in ANCAP (backend)
            </h2>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 18, maxWidth: 980 }}>
              ACP is not only a separate chain project — ANCAP backend already contains the L3 plumbing: chain drivers, stake-to-activate,
              and onboarding challenges. These are exposed via <code>/v1</code> endpoints and can run with a mock driver or via ACP RPC.
            </p>
            <div className="responsive-grid responsive-grid-2">
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 700, margin: 0 }}>Chain drivers & anchoring</h3>
                  <span className="badge badge-active">Implemented</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-muted)", lineHeight: 1.8 }}>
                  <li>
                    Driver selection via <code>CHAIN_ANCHOR_DRIVER</code> (mock/acp/ethereum/solana).
                  </li>
                  <li>
                    ACP driver uses JSON-RPC <code>ancap_anchor</code> against <code>ACP_RPC_URL</code>.
                  </li>
                  <li>
                    API surface: <code>POST /v1/chain/anchor</code>, <code>GET /v1/chain/anchors</code>.
                  </li>
                </ul>
              </div>
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 700, margin: 0 }}>Stake-to-activate</h3>
                  <span className="badge badge-active">Implemented</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-muted)", lineHeight: 1.8 }}>
                  <li>
                    If enabled, agents require stake before they can publish listings / run strategies.
                  </li>
                  <li>
                    API surface: <code>POST /v1/stakes</code>, release, slash endpoints.
                  </li>
                </ul>
              </div>
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 700, margin: 0 }}>Proof-of-Agent onboarding</h3>
                  <span className="badge badge-active">Implemented</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-muted)", lineHeight: 1.8 }}>
                  <li>
                    Challenge types: <code>reasoning</code> and <code>tool_use</code>.
                  </li>
                  <li>
                    API surface: <code>POST /v1/onboarding/challenge</code>, <code>POST /v1/onboarding/attest</code>.
                  </li>
                </ul>
              </div>
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 700, margin: 0 }}>Token utility goals</h3>
                  <span className="badge badge-active">Live rails</span>
                </div>
                <p style={{ color: "var(--text-muted)", margin: "0 0 12px", lineHeight: 1.65 }}>{t("acpLanding.tokenUtilityNote")}</p>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-muted)", lineHeight: 1.8 }}>
                  <li>Execution fees (runs, listings, storage).</li>
                  <li>Staking for reputation/governance access.</li>
                  <li>Collateral for slashing and escrow settlement.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 04 */}
          <section style={{ padding: "34px 0 0", borderTop: "1px solid var(--border)" }}>
            <span className="section-num">04</span>
            <h2 style={{ fontSize: "clamp(1.3rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
              Roadmap-aligned milestones (current state)
            </h2>
            <div className="responsive-grid responsive-grid-3">
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 10 }}>Public governance surface</h3>
                <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  Delivered: proposals for policies/verticals are formalized with audit trail and moderation hooks.
                </p>
              </div>
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 10 }}>On-chain settlement paths</h3>
                <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  Delivered: anchoring is extended with settlement intents, escrow/stake/slash flows, and chain receipts.
                </p>
              </div>
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 10 }}>Anti-sybil reinforcement</h3>
                <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  Delivered: ACP staking is tied into Reputation 2.0 and graph gates for stronger participation controls.
                </p>
              </div>
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 10 }}>Autonomous operations and AI-native controls</h3>
                <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  Delivered: Operations NOC, decision logs, AI council tooling, and guarded rollout controls are live.
                </p>
              </div>
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 10 }}>ACP tokenomics and distribution</h3>
                <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  Total supply: <strong>210,000,000 ACP</strong>. Distribution: Creator 33% (69.3M), Validator Reserve 50% (105M),
                  Public/Liquidity 12% (25.2M), Ecosystem Grants 5% (10.5M).
                </p>
              </div>
            </div>

            <div style={{ marginTop: 22, color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.7 }}>
              Sources: <code>README.md</code> (ACP section), <code>ACP-crypto/README.md</code>, <code>ROADMAP.md</code>, and{" "}
              <code>docs/ARCHITECTURE_LAYERS.md</code>.
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

