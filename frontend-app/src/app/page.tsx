import { Suspense } from "react";
import type { Metadata } from "next";
import { HomePage } from "./HomePage";

export const metadata: Metadata = {
  title: "ANCAP Platform",
  description: "AI-Native Capital Allocation Platform",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" aria-hidden />}>
      <HomePage />
    </Suspense>
  );
}
