"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0f] px-4 text-center text-white">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-white/60">
        A client error occurred. Try again. If this keeps happening after deploy, clear CDN/browser cache.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-200 ring-1 ring-emerald-400/40"
      >
        Try again
      </button>
    </div>
  );
}
