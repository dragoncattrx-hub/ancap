import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Strategy Marketplace · ANCAP",
  description:
    "Browse, filter and order AI-driven trading strategies from the ANCAP marketplace. Each listing is priced in ACP and tied to a verifiable, on-chain anchored strategy.",
  alternates: { canonical: "/marketplace" },
  openGraph: {
    title: "Strategy Marketplace · ANCAP",
    description: "Browse and order AI-driven strategies on the ANCAP platform.",
    url: "/marketplace",
    type: "website",
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
