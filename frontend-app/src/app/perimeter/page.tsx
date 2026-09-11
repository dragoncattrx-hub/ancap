"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { perimeterCleanupDesk } from "@/lib/api";

type CipherInfo = {
  cipher_id: string;
  algorithm: string;
  kdf: string;
  note: string;
};

type Service = {
  id: string;
  label: string;
  contamination: string;
  description: string;
  price_from_acp: string;
  unit: string;
};

type Job = {
  id: string;
  service_id: string;
  contamination: string;
  site_label_hint: string;
  status: string;
  cipher_id: string;
  content_hash: string;
  created_at: string;
  payload?: Record<string, unknown>;
};

export default function PerimeterPage() {
  const [cipher, setCipher] = useState<CipherInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [serviceId, setServiceId] = useState("perimeter-full-sweep");
  const [contamination, setContamination] = useState("mixed_all");
  const [siteLabel, setSiteLabel] = useState("");
  const [perimeterMeters, setPerimeterMeters] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [compliance, setCompliance] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [c, cat, list] = await Promise.all([
        perimeterCleanupDesk.cipher() as Promise<CipherInfo>,
        perimeterCleanupDesk.catalog() as Promise<{
          services: Service[];
          compliance_note: string;
        }>,
        perimeterCleanupDesk.listJobs().catch(() => ({ items: [] as Job[] })) as Promise<{
          items: Job[];
        }>,
      ]);
      setCipher(c);
      setServices(cat.services || []);
      setCompliance(cat.compliance_note || "");
      if (cat.services?.[0]) {
        setServiceId((prev) => prev || cat.services[0].id);
      }
      setJobs(list.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load perimeter desk");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onServicePick = (id: string) => {
    setServiceId(id);
    const svc = services.find((s) => s.id === id);
    if (svc) setContamination(svc.contamination);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await perimeterCleanupDesk.createJob({
        service_id: serviceId,
        contamination,
        site_label: siteLabel.trim(),
        perimeter_meters: perimeterMeters.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setInfo("Заявка зашифрована (Abrams Suite-B AES-256-GCM) и сохранена.");
      setSiteLabel("");
      setNotes("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const onDecrypt = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      const job = (await perimeterCleanupDesk.getJob(id)) as Job;
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, payload: job.payload } : j)));
      setInfo(`Расшифрован job ${id.slice(0, 8)}…`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decrypt failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Field services</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Уборка периметра
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          Услуга очистки периметра от всех видов загрязнений. Брифы заявок хранятся в сейфе{" "}
          <strong className="text-white/90">Abrams Suite-B</strong>: AES-256-GCM + HKDF-SHA384 —
          публичные алгоритмы того же класса, что у Type-1 стеков Abrams (не секретные Type-1 ключи).
        </p>

        {cipher ? (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/55">
            {cipher.algorithm} · {cipher.kdf} · <code>{cipher.cipher_id}</code>
          </p>
        ) : null}

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {info ? <p className="mt-4 text-sm text-emerald-300">{info}</p> : null}

        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">Каталог</h2>
          <div className="grid gap-3">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onServicePick(s.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  serviceId === s.id
                    ? "border-emerald-400/40 bg-emerald-400/[0.08]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold">{s.label}</span>
                  <span className="text-sm text-emerald-300/90">
                    from {Number(s.price_from_acp).toLocaleString()} ACP / {s.unit}
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/60">{s.description}</p>
              </button>
            ))}
          </div>
        </section>

        <form onSubmit={onSubmit} className="mt-10 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">
            Зашифрованная заявка
          </h2>
          <label className="block text-sm">
            <span className="text-white/55">Объект / периметр</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              value={siteLabel}
              onChange={(e) => setSiteLabel(e.target.value)}
              required
              placeholder="Склад А / периметр север"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/55">Длина периметра (м)</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              value={perimeterMeters}
              onChange={(e) => setPerimeterMeters(e.target.value)}
              placeholder="опционально"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/55">Класс загрязнения</span>
            <select
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              value={contamination}
              onChange={(e) => setContamination(e.target.value)}
            >
              <option value="mixed_all">Все виды (mixed)</option>
              <option value="chemical">Химия</option>
              <option value="biological">Биология</option>
              <option value="radiological_survey">Радиология (survey)</option>
              <option value="oil_hydrocarbon">Нефтепродукты</option>
              <option value="industrial">Пром. отходы</option>
              <option value="soil">Грунт</option>
              <option value="water">Вода</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-white/55">Заметки для лицензированной бригады</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy || !siteLabel.trim()}
            className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {busy ? "Сохранение…" : "Зашифровать и создать заявку"}
          </button>
        </form>

        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">Мои заявки</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-white/45">Пока пусто — войдите и создайте заявку.</p>
          ) : (
            jobs.map((j) => (
              <div key={j.id} className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{j.site_label_hint}</span>
                  <span className="text-xs text-white/45">{j.status}</span>
                </div>
                <p className="mt-1 text-xs text-white/45">
                  {j.contamination} · {j.cipher_id}
                </p>
                <button
                  type="button"
                  className="mt-2 text-sm text-emerald-300 underline"
                  onClick={() => void onDecrypt(j.id)}
                >
                  Расшифровать
                </button>
                {j.payload ? (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-2 text-[11px] text-white/70">
                    {JSON.stringify(j.payload, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </section>

        {compliance ? <p className="mt-8 text-xs leading-5 text-white/40">{compliance}</p> : null}

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href="/insurance" className="text-emerald-300 underline">
            Страховка периметра
          </Link>
          <Link href="/buy-acp" className="text-emerald-300 underline">
            Купить ACP
          </Link>
        </div>
      </main>
    </div>
  );
}
