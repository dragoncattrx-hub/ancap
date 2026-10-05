"use client";

import { FormEvent, useState } from "react";
import { getApiUrl } from "@/lib/api";

const INTEREST = "physical_card_apple_pay";

export function CardsWaitlistForm() {
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`${getApiUrl()}/commerce/ramp-waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          interest: INTEREST,
          region: region.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof body?.detail === "string" ? body.detail : `Waitlist failed (${res.status})`,
        );
      }
      if (body.status === "already_registered") {
        setMessage("You are already on this waitlist.");
      } else {
        setMessage("Registered. We will email when a licensed issuer path is ready.");
      }
      setEmail("");
      setRegion("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Waitlist signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-4">
      <label className="block text-xs uppercase tracking-wide text-white/45">
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
          autoComplete="email"
        />
      </label>
      <label className="block text-xs uppercase tracking-wide text-white/45">
        Region (optional)
        <input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="EU / DE / …"
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
        />
      </label>
      <label className="block text-xs uppercase tracking-wide text-white/45">
        Notes (optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={500}
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
      >
        {busy ? "Submitting…" : "Join waitlist"}
      </button>
      {message ? <p className="text-sm text-emerald-200/85">{message}</p> : null}
      {error ? <p className="text-sm text-amber-200/85">{error}</p> : null}
    </form>
  );
}
