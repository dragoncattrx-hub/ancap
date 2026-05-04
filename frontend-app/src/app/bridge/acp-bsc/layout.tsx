import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ACP ↔ BSC (wACP) · ANCAP",
  description:
    "Custodial clearing rail: register ACP→BSC mint intent, view status and reserve summary. See docs/bridge-spec-v1.md.",
  alternates: { canonical: "/bridge/acp-bsc" },
  robots: { index: false, follow: false },
};

export default function BridgeAcpBscLayout({ children }: { children: React.ReactNode }) {
  return children;
}
