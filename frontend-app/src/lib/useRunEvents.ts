"use client";

import { useEffect, useState } from "react";
import { workflowStore } from "@/lib/api";

type RunEvent = {
  workflow_run_id: string;
  status: string;
  receipt_status?: string | null;
  payment_confirmed?: boolean;
  receipt_ready?: boolean;
  execution_mode?: string | null;
  llm_usage?: Record<string, any> | null;
  timeline_length?: number;
  updated_at?: string | null;
};

export function useRunEvents(runId?: string | null, enabled = true) {
  const [lastEvent, setLastEvent] = useState<RunEvent | null>(null);
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "open" | "closed" | "error">("idle");

  useEffect(() => {
    if (!runId || !enabled || typeof EventSource === "undefined") {
      setConnectionState("idle");
      return;
    }

    setConnectionState("connecting");
    const source = new EventSource(workflowStore.runEventsUrl(runId));

    source.onopen = () => setConnectionState("open");
    source.onerror = () => {
      setConnectionState("error");
      source.close();
    };
    source.addEventListener("workflow_run", (event) => {
      try {
        setLastEvent(JSON.parse((event as MessageEvent).data));
      } catch {
        setConnectionState("error");
      }
    });

    return () => {
      source.close();
      setConnectionState("closed");
    };
  }, [enabled, runId]);

  return { lastEvent, connectionState };
}
