import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ACP Wallet & Swap · ANCAP",
  description:
    "Custodial ACP hot wallet: deposit, withdraw, distribute and swap Tether TRC-20 → ACP. Signed-in only.",
  alternates: { canonical: "/wallet/acp" },
  robots: { index: false, follow: false },
};

export default function AcpWalletLayout({ children }: { children: React.ReactNode }) {
  return children;
}
