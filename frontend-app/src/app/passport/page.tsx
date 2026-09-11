"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { apiFetch } from "@/lib/api";

type Passport = {
  id: string;
  wallet_address: string;
  token_id: number;
  status: string;
  claim_hash: string;
  chain_id: string;
  explorer_url?: string | null;
};

type EduDoc = {
  id: string;
  doc_type: string;
  title_hint: string;
  institution_hint?: string | null;
  cipher_id: string;
  content_hash: string;
  created_at: string;
  payload?: Record<string, unknown>;
};

type CipherInfo = {
  cipher_id: string;
  algorithm: string;
  kdf: string;
  note: string;
};

const DOC_TYPES = [
  "diploma",
  "certificate",
  "transcript",
  "degree",
  "course_completion",
  "license",
  "other",
] as const;

const field =
  "mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/50";
const label = "block text-sm font-medium text-white/80";

export default function PassportPage() {
  const [passports, setPassports] = useState<Passport[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [docs, setDocs] = useState<EduDoc[]>([]);
  const [cipher, setCipher] = useState<CipherInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<EduDoc | null>(null);

  const [docType, setDocType] = useState<(typeof DOC_TYPES)[number]>("diploma");
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [program, setProgram] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const [notes, setNotes] = useState("");

  const loadDocs = useCallback(async (passportId: string) => {
    const data = (await apiFetch(`/passports/${passportId}/education-docs`)) as {
      items: EduDoc[];
      cipher_id: string;
    };
    setDocs(data.items || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = (await apiFetch("/passports/education/cipher")) as CipherInfo;
        if (!cancelled) setCipher(c);
      } catch {
        /* public cipher info optional */
      }
      try {
        const me = (await apiFetch("/passports/me")) as { items: Passport[] };
        if (cancelled) return;
        const items = me.items || [];
        setPassports(items);
        const active = items.find((p) => p.status === "active") || items[0];
        if (active) {
          setSelectedId(active.id);
          await loadDocs(active.id);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Sign in to manage passport documents");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadDocs]);

  async function onSelectPassport(id: string) {
    setSelectedId(id);
    setRevealed(null);
    setError(null);
    try {
      await loadDocs(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    }
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!selectedId || !title.trim()) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await apiFetch(`/passports/${selectedId}/education-docs`, {
        method: "POST",
        body: JSON.stringify({
          doc_type: docType,
          title: title.trim(),
          institution: institution.trim() || undefined,
          program: program.trim() || undefined,
          credential_id: credentialId.trim() || undefined,
          issued_on: issuedOn.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      setTitle("");
      setInstitution("");
      setProgram("");
      setCredentialId("");
      setIssuedOn("");
      setNotes("");
      setInfo("Документ зашифрован (ChaCha20-Poly1305 v2) и привязан к паспорту.");
      await loadDocs(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save document");
    } finally {
      setBusy(false);
    }
  }

  async function onReveal(docId: string) {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const doc = (await apiFetch(`/passports/${selectedId}/education-docs/${docId}`)) as EduDoc;
      setRevealed(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decrypt failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(docId: string) {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/passports/${selectedId}/education-docs/${docId}`, { method: "DELETE" });
      if (revealed?.id === docId) setRevealed(null);
      await loadDocs(selectedId);
      setInfo("Документ удалён.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const selected = passports.find((p) => p.id === selectedId);

  return (
    <div className="min-h-screen bg-[#070b12] text-white">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-10">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Digital Passport</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-white">Образование</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
          Дипломы, сертификаты и транскрипты хранятся у паспорта в зашифрованном виде. На цепи — только
          claim hash; PII и реквизиты документов не публикуются.
        </p>

        {cipher && (
          <p className="mt-4 text-xs text-white/40">
            Шифр: {cipher.algorithm} · {cipher.kdf} · <span className="text-cyan-200/70">{cipher.cipher_id}</span>
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}{" "}
            <Link href="/login" className="underline">
              Войти
            </Link>
          </p>
        )}
        {info && <p className="mt-4 text-sm text-emerald-200/80">{info}</p>}

        {passports.length === 0 && !error && (
          <p className="mt-8 text-sm text-white/50">
            Паспорт ещё не выпущен. Запросите soulbound passport через организацию с verified NFC.
          </p>
        )}

        {passports.length > 0 && (
          <section className="mt-8">
            <label className={label}>Паспорт</label>
            <select
              className={field}
              value={selectedId}
              onChange={(e) => void onSelectPassport(e.target.value)}
            >
              {passports.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.token_id} · {p.status} · {p.wallet_address.slice(0, 10)}…
                </option>
              ))}
            </select>
            {selected && (
              <p className="mt-2 text-xs text-white/40">
                claim {selected.claim_hash.slice(0, 18)}… · {selected.chain_id}
                {selected.explorer_url ? (
                  <>
                    {" · "}
                    <a href={selected.explorer_url} className="text-cyan-300/80 underline" target="_blank" rel="noreferrer">
                      explorer
                    </a>
                  </>
                ) : null}
              </p>
            )}
          </section>
        )}

        {selectedId && (
          <>
            <form onSubmit={onAdd} className="mt-10 space-y-4 border-t border-white/10 pt-8">
              <h2 className="text-lg text-white/90">Добавить документ</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Тип</label>
                  <select className={field} value={docType} onChange={(e) => setDocType(e.target.value as typeof docType)}>
                    {DOC_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>Дата выдачи</label>
                  <input className={field} type="date" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={label}>Название</label>
                <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="MSc Computer Science" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Учреждение</label>
                  <input className={field} value={institution} onChange={(e) => setInstitution(e.target.value)} />
                </div>
                <div>
                  <label className={label}>Программа</label>
                  <input className={field} value={program} onChange={(e) => setProgram(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={label}>ID / серия</label>
                <input className={field} value={credentialId} onChange={(e) => setCredentialId(e.target.value)} />
              </div>
              <div>
                <label className={label}>Заметки</label>
                <textarea className={field} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <button
                type="submit"
                disabled={busy || !title.trim()}
                className="rounded-lg bg-cyan-500/90 px-4 py-2.5 text-sm font-medium text-[#041018] transition hover:bg-cyan-400 disabled:opacity-40"
              >
                {busy ? "Сохранение…" : "Зашифровать и сохранить"}
              </button>
            </form>

            <section className="mt-12 border-t border-white/10 pt-8">
              <h2 className="text-lg text-white/90">Документы</h2>
              {docs.length === 0 ? (
                <p className="mt-3 text-sm text-white/45">Пока пусто.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {docs.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 py-3">
                      <div>
                        <p className="text-sm text-white/90">{d.title_hint}</p>
                        <p className="text-xs text-white/40">
                          {d.doc_type}
                          {d.institution_hint ? ` · ${d.institution_hint}` : ""} · {d.cipher_id}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void onReveal(d.id)}
                          className="rounded border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:border-cyan-300/40"
                        >
                          Расшифровать
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void onDelete(d.id)}
                          className="rounded border border-rose-400/30 px-3 py-1.5 text-xs text-rose-100/80"
                        >
                          Удалить
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {revealed?.payload && (
              <pre className="mt-6 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 text-xs text-cyan-100/80">
                {JSON.stringify(revealed.payload, null, 2)}
              </pre>
            )}
          </>
        )}
      </main>
    </div>
  );
}
