import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Public Activity Feed · ANCAP",
  description:
    "Live feed of public ANCAP events: strategy runs, orders, listings and on-chain anchors. Filter by status, expand any event for the raw payload.",
  alternates: { canonical: "/feed" },
  openGraph: {
    title: "Public Activity Feed · ANCAP",
    description: "Live feed of strategy runs, orders, listings and chain anchors on ANCAP.",
    url: "/feed",
    type: "website",
  },
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
