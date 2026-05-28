import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "ACP Wallet Security",
  description: "Public security model and release-status notes for the non-custodial ACP mobile wallet.",
};

const controls = [
  ["Non-custodial by design", "The mobile wallet is device-local. ANCAP API read endpoints and the broadcast relay never hold the seed phrase or decrypted private keys."],
  ["PIN handling", "The app stores only a salted SHA-256 verifier for the local PIN. Raw PIN digits are not persisted."],
  ["Biometric gating", "When enabled, mnemonic and keystore secrets move into biometric-gated secure storage so reading signing secrets requires device authentication."],
  ["Sensitive screen controls", "Seed-phrase screens block screenshots, receive-address clipboard copies auto-clear, and the app auto-locks after inactivity."],
  ["Error/log redaction", "Wallet UI surfaces sanitize mnemonic, keystore, raw transaction, and bearer-token shaped values before rendering or forwarding errors."],
];

const remainingGates = [
  "real device verification for PIN, biometrics, and secure-vault migration",
  "native create/send/sign verification once Android/iOS FFI artifacts are built",
  "stronger production-grade root/jailbreak or device-integrity checks",
  "TestFlight / Play Internal / store release validation",
];

export default function MobileSecurityDocsPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container" style={{ padding: "48px 24px 72px" }}>
        <section className="card">
          <div className="card-header">
            <div>
              <div className="section-num" style={{ marginBottom: 10 }}>Mobile security</div>
              <h1 style={{ margin: 0, fontWeight: 800 }}>ACP Wallet security model</h1>
            </div>
            <span className="badge badge-active">Public docs</span>
          </div>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.75, marginTop: 16, maxWidth: 920 }}>
            This page is the public summary of the current non-custodial mobile-wallet security posture.
            Source-of-truth detail remains in <code>docs/mobile/SECURITY_MODEL.md</code>, but this route exists so
            mobile clients and public docs can link to a real web page instead of stale placeholders.
          </p>
          <div style={{ marginTop: 16, padding: 14, borderRadius: 12, border: "1px solid rgba(56, 189, 248, 0.24)", background: "rgba(56, 189, 248, 0.08)", color: "var(--text-muted)", lineHeight: 1.75 }}>
            <strong style={{ color: "var(--text)" }}>Release-status truth:</strong> the repo baseline for the main MASVS-L1-relevant controls is in place,
            but the wallet is not yet fully release-closed until real-device and native-build verification is finished.
          </div>
        </section>

        <section className="responsive-grid responsive-grid-2" style={{ gap: 16, marginTop: 16 }}>
          <article className="card">
            <h2 style={{ marginTop: 0 }}>Current baseline controls</h2>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9, color: "var(--text-muted)" }}>
              {controls.map(([title, body]) => (
                <li key={title}>
                  <strong style={{ color: "var(--text)" }}>{title}:</strong> {body}
                </li>
              ))}
            </ul>
          </article>

          <article className="card">
            <h2 style={{ marginTop: 0 }}>Remaining release gates</h2>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9, color: "var(--text-muted)" }}>
              {remainingGates.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="card" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Read next</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
            <li><Link href="/docs/wacp/bridge">Bridge flow</Link></li>
            <li><Link href="/docs/wacp/risks">Bridge and custody risks</Link></li>
            <li><Link href="/legal/terms">Terms</Link></li>
            <li><Link href="/legal/privacy">Privacy</Link></li>
          </ul>
        </section>
      </main>
    </div>
  );
}
