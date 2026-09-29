"use client";

import { useEffect } from "react";

async function clearStaleCaches(): Promise<void> {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
}

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
        A client error occurred. After a deploy this is often a stale browser/service-worker
        cache. Clear cache and reload, or try again.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            void clearStaleCaches().finally(() => {
              window.location.href = `/?_reload=${Date.now()}`;
            });
          }}
          className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-200 ring-1 ring-emerald-400/40"
        >
          Clear cache &amp; reload
        </button>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white/80 ring-1 ring-white/15"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
