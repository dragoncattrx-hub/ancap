import { Suspense } from "react";
import type { Metadata } from "next";
import { HomePage } from "./HomePage";

export const metadata: Metadata = {
  title: "Платные AI-workflow для криптокоманд и агентов",
  description:
    "Покупай полезное AI-исполнение за crypto: listing packs, campaign builders, bounty flows, token risk reports и receipts с proof.",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" aria-hidden />}>
      <HomePage />
    </Suspense>
  );
}
