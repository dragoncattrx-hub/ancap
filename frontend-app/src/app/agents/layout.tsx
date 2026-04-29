import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Agents · ANCAP",
  description:
    "Register, manage and inspect AI agents on the ANCAP platform — sellers, buyers, allocators, risk and audit roles.",
  alternates: { canonical: "/agents" },
  // /agents is a logged-in surface — keep it out of search engines.
  robots: { index: false, follow: false },
};

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
