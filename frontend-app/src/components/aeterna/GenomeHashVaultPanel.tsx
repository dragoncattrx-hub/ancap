"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { aeterna, auth } from "@/lib/api";
import { sha256FileStreaming } from "@/lib/sha256Stream";

const LOCAL_VAULT_KEY = "aeterna_local_fingerprint_v1";

type LocalFingerprint = {
  label: string;
  content_sha256: string;
  format_hint: string;
  content_byte_size: number;
  saved_at: string;
};

export function GenomeHashVaultPanel() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hash, setHash] = useState("");
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState("");
  const [localSaved, setLocalSaved] = useState(false);
  const [consent, setConsent] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(auth.isAuthenticated());
    try {
      const raw = localStorage.getItem(LOCAL_VAULT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LocalFingerprint;
      if (parsed?.content_sha256) {
        setHash(parsed.content_sha256);
        setFileMeta({ name: parsed.label, size: parsed.content_byte_size || 0 });
        setLocalSaved(true);
      }
    } catch {
      /* ignore corrupt local cache */
    }
  }, []);

  const onPick = async (file: File | null) => {
    if (!file) return;
    setError("");
    setSavedId("");
    setLocalSaved(false);
    setBusy(true);
    setProgress(0);
    try {
      const digest = await sha256FileStreaming(file, setProgress);
      setHash(digest);
      setFileMeta({ name: file.name, size: file.size });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hash failed");
    } finally {
      setBusy(false);
    }
  };

  const saveLocal = () => {
    if (!hash || !fileMeta || !consent) return;
    setError("");
    const row: LocalFingerprint = {
      label: fileMeta.name.slice(0, 120) || "genome-export",
      content_sha256: hash,
      format_hint: fileMeta.name.split(".").pop()?.slice(0, 16) || "vcf",
      content_byte_size: fileMeta.size,
      saved_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(row));
      setLocalSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Local save failed");
    }
  };

  const syncToAccount = async () => {
    if (!hash || !fileMeta || !consent) return;
    setError("");
    setBusy(true);
    try {
      if (!auth.isAuthenticated()) {
        setError("Sign in to sync this fingerprint to your ANCAP account (file never leaves your device).");
        return;
      }
      const row = (await aeterna.createVault({
        label: fileMeta.name.slice(0, 120) || "genome-export",
        source: "upload",
        content_sha256: hash,
        format_hint: fileMeta.name.split(".").pop()?.slice(0, 16) || "vcf",
        consent_acknowledged: true,
        metadata_json: {
          storage_mode: "hash_only",
          client_filename: fileMeta.name.slice(0, 180),
          content_byte_size: fileMeta.size,
          hash_mode: "sha256_stream_client",
          note: "Genome bytes were never uploaded to ANCAP.",
        },
      })) as { id: string };
      setSavedId(row.id);
      setSignedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vault sync failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#9ae0d9]">Hash-only DNA vault</h3>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">
        No account needed to hash and keep a fingerprint on this device. Reference genomes stay on your
        machine — the browser streams SHA-256 in 1 MB chunks. Optional account sync stores only the
        digest (typically under 1 KB).
      </p>

      <label className="mt-5 inline-flex cursor-pointer items-center gap-3 rounded-md border border-white/20 px-4 py-2.5 text-sm text-white/90 transition hover:border-[#7ad0c8]/60">
        <input
          type="file"
          className="hidden"
          accept=".vcf,.vcf.gz,.fastq,.fq,.bam,.cram,.fa,.fasta,.txt,.gz"
          onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
          disabled={busy}
        />
        {busy ? `Hashing… ${progress}%` : "Choose local export"}
      </label>

      {hash && fileMeta && (
        <div className="mt-5 space-y-2 font-mono text-xs text-white/70">
          <p>
            <span className="text-white/40">file </span>
            {fileMeta.name} · {(fileMeta.size / (1024 * 1024)).toFixed(2)} MB
          </p>
          <p className="break-all">
            <span className="text-white/40">sha256 </span>
            {hash}
          </p>
        </div>
      )}

      <label className="mt-5 flex max-w-xl cursor-pointer items-start gap-3 text-sm leading-6 text-white/55">
        <input
          type="checkbox"
          className="mt-1"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          I consent to storing this genomic fingerprint for ACP workflows. I understand AETERNA does not
          provide DIY gene-editing protocols.
        </span>
      </label>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!hash || !consent || busy}
          onClick={saveLocal}
          className="rounded-md bg-[#7ad0c8] px-4 py-2.5 text-sm font-semibold text-[#04201e] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save on this device
        </button>
        <button
          type="button"
          disabled={!hash || !consent || busy}
          onClick={() => void syncToAccount()}
          className="rounded-md border border-white/25 px-4 py-2.5 text-sm text-white/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {signedIn ? "Sync to account" : "Sync (sign in)"}
        </button>
        {!signedIn && (
          <Link
            href={`/login?next=${encodeURIComponent("/aeterna")}`}
            className="rounded-md border border-white/15 px-4 py-2.5 text-sm text-white/70"
          >
            Sign in
          </Link>
        )}
      </div>

      {localSaved && (
        <p className="mt-4 text-sm text-[#7ad0c8]">
          Fingerprint kept locally in this browser — no registration required.
        </p>
      )}
      {savedId && <p className="mt-4 text-sm text-[#7ad0c8]">Synced to ANCAP vault · id {savedId}</p>}
      {error && <p className="mt-4 text-sm text-amber-300">{error}</p>}
    </div>
  );
}
