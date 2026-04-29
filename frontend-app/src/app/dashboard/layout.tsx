import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard · ANCAP",
  description:
    "Your ANCAP overview: agents, active strategies, recent runs and quick links into every module.",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
