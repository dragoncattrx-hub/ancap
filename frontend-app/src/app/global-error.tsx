"use client";

import { useEffect } from "react";

/**
 * Catches errors in the root layout (outside app/error.tsx).
 * Clears stale caches then offers a hard reload — the default Next.js
 * "Application error: a client-side exception has occurred" page is useless
 * after a deploy with hashed chunks.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const recover = async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      const regs = await navigator.serviceWorker?.getRegistrations();
      await Promise.all((regs || []).map((r) => r.unregister()));
    } catch {
      /* ignore */
    }
    window.location.href = `/?_reload=${Date.now()}`;
  };

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#0a0a0f",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ maxWidth: "28rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.6)" }}>
          A client error occurred while loading ANCAP. This is often a stale cache after a
          deploy. Clear cache and reload.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => void recover()}
            style={{
              borderRadius: "0.5rem",
              background: "rgba(16,185,129,0.2)",
              color: "#a7f3d0",
              border: "1px solid rgba(52,211,153,0.4)",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Clear cache &amp; reload
          </button>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              borderRadius: "0.5rem",
              background: "transparent",
              color: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
