"use client";

import { useEffect } from "react";

const RELOAD_GUARD_KEY = "ancap_chunk_reload_once";

function isChunkLoadError(reason: unknown): boolean {
  if (!reason) return false;
  const msg =
    typeof reason === "string"
      ? reason
      : typeof reason === "object" && "message" in reason
        ? String((reason as { message?: unknown }).message ?? "")
        : "";
  return /ChunkLoadError|Loading chunk [0-9]+ failed|_next\/static\/chunks/i.test(msg);
}

export function ChunkErrorRecovery() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      if (!isChunkLoadError(event.reason)) return;
      if (sessionStorage.getItem(RELOAD_GUARD_KEY) === "1") return;
      sessionStorage.setItem(RELOAD_GUARD_KEY, "1");

      const url = new URL(window.location.href);
      url.searchParams.set("_reload", String(Date.now()));
      window.location.replace(url.toString());
    };

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return null;
}
