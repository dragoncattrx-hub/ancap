import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ACP Token & Chain · ANCAP",
  description:
    "ANCAP Chain Protocol (ACP) overview: native token, on-chain anchors, AI-native identity, staking and tokenomics.",
  alternates: { canonical: "/acp" },
  openGraph: {
    title: "ACP Token & Chain · ANCAP",
    description: "ANCAP Chain Protocol — token, anchors, identity and tokenomics.",
    url: "/acp",
    type: "website",
  },
};

export default function AcpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
