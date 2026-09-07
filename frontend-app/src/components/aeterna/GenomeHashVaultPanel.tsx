"use client";

import { useState } from "react";
import Link from "next/link";
import { aeterna, auth } from "@/lib/api";
import { sha256FileStreaming } from "@/lib/sha256Stream";

export function GenomeHashVaultPanel() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hash, setHash] = useState("");
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState("");
  const [consent, setConsent] = useState(false);

  const onPick = async (file: File | null) => {
    if (!file) return;
    setError("");
    setSavedId("");
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

  const register = async () => {
    if (!hash || !fileMeta || !consent) return;
    setError("");
    setBusy(true);
    try {
      if (!auth.isAuthenticated()) {
        setError("Sign in to register the fingerprint (file never leaves your device).");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vault register failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#9ae0d9]">Hash-only DNA vault</h3>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">
        Reference genomes stay on your machine. The browser streams SHA-256 in 1 MB chunks; ANCAP stores
        only the digest, filename, and size — typically under 1 KB. No CRAM/FASTA on server disk.
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
          onClick={() => void register()}
          className="rounded-md bg-[#7ad0c8] px-4 py-2.5 text-sm font-semibold text-[#04201e] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Register fingerprint
        </button>
        <Link href="/login" className="rounded-md border border-white/25 px-4 py-2.5 text-sm text-white/80">
          Sign in
        </Link>
      </div>

      {savedId && <p className="mt-4 text-sm text-[#7ad0c8]">Vault entry saved · id {savedId}</p>}
      {error && <p className="mt-4 text-sm text-amber-300">{error}</p>}
    </div>
  );
}
