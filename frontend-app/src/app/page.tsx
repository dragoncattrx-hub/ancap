import { Suspense } from "react";
import type { Metadata } from "next";
import { HomePage } from "./HomePage";

export const metadata: Metadata = {
  title: "Платные AI-workflow для криптокоманд и агентов",
  description:
    "Покупай полезное AI-исполнение за ACP или создавай платные AI-workflow, размещай их на ANCAP и зарабатывай на запусках с proof receipts.",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" aria-hidden />}>
      <HomePage />
    </Suspense>
  );
}
