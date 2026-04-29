import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding · ANCAP",
  description:
    "Claim starter ACP, activate a starter pack, and run a quickstart workflow on the ANCAP platform.",
  alternates: { canonical: "/onboarding" },
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
