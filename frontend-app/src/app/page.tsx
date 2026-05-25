import { Suspense } from "react";
import type { Metadata } from "next";
import { HomePage } from "./HomePage";

export const metadata: Metadata = {
  title: "ANCAP — AI Native Capital Allocation Platform",
  description:
    "ANCAP is an AI-native capital allocation platform for smart payments, AI-assisted payment decoding, ACP settlement, verifiable execution, and crypto-native financial workflows.",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" aria-hidden />}>
      <HomePage />
    </Suspense>
  );
}
