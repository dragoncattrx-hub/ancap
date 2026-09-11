"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { apiFetch } from "@/lib/api";

type CipherInfo = {
  cipher_id: string;
  algorithm: string;
  kdf: string;
  note: string;
};

type BankEntry = {
  id: string;
  molecule: string;
  entry_type: string;
  title_hint: string;
  species_hint?: string | null;
  cipher_id: string;
  content_hash: string;
  created_at: string;
  payload?: Record<string, unknown>;
};

const MOLECULES = ["dna", "rna"] as const;
const ENTRY_TYPES = [
  "sequence_summary",
  "vcf_panel",
  "blood_rna_panel",
  "transcriptome_summary",
  "methylation_panel",
  "microbiome_rna",
  "other",
] as const;

const field =
  "mt-1 w-full rounded-lg border border-emerald-400/20 bg-black/30 px-3 py-2.5 text-sm text-emerald-50 outline-none transition focus:border-emerald-300/50";
const label = "block text-sm font-medium text-emerald-100/80";

export default function DnaRnaBankPage() {
  const [cipher, setCipher] = useState<CipherInfo | null>(null);
  const [entries, setEntries] = useState<BankEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<BankEntry | null>(null);

  const [molecule, setMolecule] = useState<(typeof MOLECULES)[number]>("dna");
  const [entryType, setEntryType] = useState<(typeof ENTRY_TYPES)[number]>("sequence_summary");
  const [title, setTitle] = useState("");
  const [species, setSpecies] = useState("Homo sapiens");
  const [sampleId, setSampleId] = useState("");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    const data = (await apiFetch("/dna-rna-bank/entries")) as { items: BankEntry[] };
    setEntries(data.items || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = (await apiFetch("/dna-rna-bank/cipher")) as CipherInfo;
        if (!cancelled) setCipher(c);
      } catch {
        /* optional */
      }
      try {
        await load();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Sign in to use the DNA/RNA bank");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await apiFetch("/dna-rna-bank/entries", {
        method: "POST",
        body: JSON.stringify({
          molecule,
          entry_type: entryType,
          title: title.trim(),
          species: species.trim() || undefined,
          sample_id: sampleId.trim() || undefined,
          sequence_summary: summary.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      setTitle("");
      setSampleId("");
      setSummary("");
      setNotes("");
      setInfo("Запись зашифрована (AES-256-GCM + HKDF-SHA384) и сохранена в банке.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onReveal(id: string) {
    setBusy(true);
    setError(null);
    try {
      const doc = (await apiFetch(`/dna-rna-bank/entries/${id}`)) as BankEntry;
      setRevealed(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decrypt failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/dna-rna-bank/entries/${id}`, { method: "DELETE" });
      if (revealed?.id === id) setRevealed(null);
      await load();
      setInfo("Запись удалена.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#040a08] text-emerald-50">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-10">
        <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/70">Digital Genome Bank</p>
        <h1
          className="mt-2 text-4xl tracking-tight text-emerald-50"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          ДНК / РНК банк
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-100/55">
          Отдельный цифровой сейф для метаданных ДНК и РНК: панели, summary, sample IDs. Полные геномы на API не
          принимаются. Шифрование at-rest: AES-256-GCM + HKDF-SHA384 (v1) — отдельно от паспорта и кошелька.
        </p>
        <p className="mt-2 text-xs text-emerald-100/40">
          Связано с AETERNA longevity rails:{" "}
          <Link href="/aeterna" className="text-emerald-300/80 underline">
            /aeterna
          </Link>
        </p>

        {cipher && (
          <p className="mt-4 text-xs text-emerald-100/40">
            Шифр: {cipher.algorithm} · {cipher.kdf} · <span className="text-emerald-200/70">{cipher.cipher_id}</span>
          </p>
        )}

        <p className="mt-4 max-w-xl text-xs leading-relaxed text-emerald-100/45">
          Interop с DeFi не через общий master key: vault остаётся private domain. Наружу уходит только явный
          export envelope (redacted attestation / content hash) для workflow или on-chain receipt — Aave/Maker не
          расшифровывают ciphertext сейфа.
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}{" "}
            <Link href="/login" className="underline">
              Войти
            </Link>
          </p>
        )}
        {info && <p className="mt-4 text-sm text-emerald-200/80">{info}</p>}

        <form onSubmit={onAdd} className="mt-10 space-y-4 border-t border-emerald-400/10 pt-8">
          <h2 className="text-lg text-emerald-50/90">Новая запись</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Молекула</label>
              <select className={field} value={molecule} onChange={(e) => setMolecule(e.target.value as typeof molecule)}>
                {MOLECULES.map((m) => (
                  <option key={m} value={m}>
                    {m.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Тип</label>
              <select className={field} value={entryType} onChange={(e) => setEntryType(e.target.value as typeof entryType)}>
                {ENTRY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={label}>Название</label>
            <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Blood RNA aging panel metadata" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Вид</label>
              <input className={field} value={species} onChange={(e) => setSpecies(e.target.value)} />
            </div>
            <div>
              <label className={label}>Sample ID</label>
              <input className={field} value={sampleId} onChange={(e) => setSampleId(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label}>Sequence / panel summary</label>
            <textarea className={field} rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Короткое summary или JSON-метаданные панели — не полный геном" />
          </div>
          <div>
            <label className={label}>Заметки</label>
            <textarea className={field} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="rounded-lg bg-emerald-400/90 px-4 py-2.5 text-sm font-medium text-[#04140e] transition hover:bg-emerald-300 disabled:opacity-40"
          >
            {busy ? "Сохранение…" : "Зашифровать и положить в банк"}
          </button>
        </form>

        <section className="mt-12 border-t border-emerald-400/10 pt-8">
          <h2 className="text-lg text-emerald-50/90">Сейф</h2>
          {entries.length === 0 ? (
            <p className="mt-3 text-sm text-emerald-100/45">Пока пусто.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {entries.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/10 py-3">
                  <div>
                    <p className="text-sm text-emerald-50/90">{d.title_hint}</p>
                    <p className="text-xs text-emerald-100/40">
                      {d.molecule.toUpperCase()} · {d.entry_type}
                      {d.species_hint ? ` · ${d.species_hint}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={busy} onClick={() => void onReveal(d.id)} className="rounded border border-emerald-400/25 px-3 py-1.5 text-xs text-emerald-100/80">
                      Расшифровать
                    </button>
                    <button type="button" disabled={busy} onClick={() => void onDelete(d.id)} className="rounded border border-rose-400/30 px-3 py-1.5 text-xs text-rose-100/80">
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {revealed?.payload && (
          <pre className="mt-6 overflow-x-auto rounded-lg border border-emerald-400/15 bg-black/50 p-4 text-xs text-emerald-100/80">
            {JSON.stringify(revealed.payload, null, 2)}
          </pre>
        )}
      </main>
    </div>
  );
}
