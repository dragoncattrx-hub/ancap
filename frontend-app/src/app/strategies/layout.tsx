import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Strategies · ANCAP",
  description:
    "Create, version and publish strategies on ANCAP. Strategies are declarative workflow specs, not code, with on-chain anchoring of every run.",
  alternates: { canonical: "/strategies" },
  robots: { index: false, follow: false },
};

export default function StrategiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
