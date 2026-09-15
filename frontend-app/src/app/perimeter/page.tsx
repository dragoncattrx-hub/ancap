"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
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
  small_operator?: boolean;
};

type BlastAttempt = {
  role: string;
  aead: string;
  aad: string;
  opened: boolean;
  error?: string | null;
};

type BlastProof = {
  subject: string;
  proof_status: string;
  procedure: string[];
  namespaces?: { fingerprints_distinct?: boolean };
  captured_brief?: { kind?: string; content_hash?: string; ciphertext_sha384?: string };
  attempts: BlastAttempt[];
  note?: string;
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

const CONTAMINATION_OPTIONS = [
  { value: "mixed_all", key: "contaminationMixedAll" },
  { value: "chemical", key: "contaminationChemical" },
  { value: "biological", key: "contaminationBiological" },
  { value: "radiological_survey", key: "contaminationRadiological" },
  { value: "oil_hydrocarbon", key: "contaminationOil" },
  { value: "industrial", key: "contaminationIndustrial" },
  { value: "soil", key: "contaminationSoil" },
  { value: "water", key: "contaminationWater" },
  { value: "physical_security", key: "contaminationPhysicalSecurity" },
] as const;

export default function PerimeterPage() {
  const { t } = useLanguage();
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
  const [accessNote, setAccessNote] = useState("");
  const [marketNote, setMarketNote] = useState("");
  const [blast, setBlast] = useState<BlastProof | null>(null);
  const [jobProofs, setJobProofs] = useState<Record<string, BlastProof>>({});

  const securitySteps = useMemo(
    () => [
      {
        title: t("perimeterPage.securityStepDetectionTitle"),
        body: t("perimeterPage.securityStepDetectionBody"),
      },
      {
        title: t("perimeterPage.securityStepIdentificationTitle"),
        body: t("perimeterPage.securityStepIdentificationBody"),
      },
      {
        title: t("perimeterPage.securityStepNotificationTitle"),
        body: t("perimeterPage.securityStepNotificationBody"),
      },
      {
        title: t("perimeterPage.securityStepResponseTitle"),
        body: t("perimeterPage.securityStepResponseBody"),
      },
    ],
    [t]
  );

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [c, cat, list, proof] = await Promise.all([
        perimeterCleanupDesk.cipher() as Promise<CipherInfo>,
        perimeterCleanupDesk.catalog() as Promise<{
          services: Service[];
          compliance_note: string;
          accessibility_note?: string;
          market_structure_note?: string;
          not_rwa_yield?: boolean;
        }>,
        perimeterCleanupDesk.listJobs().catch(() => ({ items: [] as Job[] })) as Promise<{
          items: Job[];
        }>,
        perimeterCleanupDesk.blastRadius().catch(() => null) as Promise<BlastProof | null>,
      ]);
      setCipher(c);
      setServices(cat.services || []);
      setCompliance(cat.compliance_note || "");
      setAccessNote(cat.accessibility_note || "");
      setMarketNote(cat.market_structure_note || "");
      setBlast(proof);
      if (cat.services?.[0]) {
        setServiceId((prev) => prev || cat.services[0].id);
      }
      setJobs(list.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("perimeterPage.loadError"));
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onServicePick = (id: string) => {
    setServiceId(id);
    const svc = services.find((s) => s.id === id);
    if (svc) setContamination(svc.contamination);
    if (typeof document !== "undefined") {
      document.getElementById("intake-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
      setInfo(t("perimeterPage.createSuccess"));
      setSiteLabel("");
      setNotes("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("perimeterPage.createFailed"));
    } finally {
      setBusy(false);
    }
  };

  const onBlast = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      const proof = (await perimeterCleanupDesk.jobBlastRadius(id)) as BlastProof;
      setJobProofs((prev) => ({ ...prev, [id]: proof }));
      setInfo(
        t("perimeterPage.blastRadiusInfo")
          .replace("{status}", proof.proof_status)
          .replace("{id}", id.slice(0, 8))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("perimeterPage.blastRadiusFailed"));
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
      setInfo(t("perimeterPage.decryptedInfo").replace("{id}", id.slice(0, 8)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("perimeterPage.decryptFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">{t("perimeterPage.kicker")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          {t("perimeterPage.title")}
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/68">
          {t("perimeterPage.intro").split("Abrams Suite-B")[0]}
          <strong className="text-white/90">Abrams Suite-B</strong>
          {t("perimeterPage.intro").split("Abrams Suite-B")[1]}
        </p>

        {cipher ? (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/55">
            {cipher.algorithm} · {cipher.kdf} · <code>{cipher.cipher_id}</code>
            {t("perimeterPage.cipherNoteSuffix")}
          </p>
        ) : null}

        {accessNote ? (
          <p className="mt-3 text-sm leading-6 text-white/60">{accessNote}</p>
        ) : null}
        {marketNote ? (
          <p className="mt-2 text-sm leading-6 text-amber-200/75">{marketNote}</p>
        ) : null}

        {blast ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">
              {t("perimeterPage.blastRadiusProof")}
            </h2>
            <p className="mt-2 text-sm text-emerald-200/90">
              {t("perimeterPage.blastStatus").replace("{status}", blast.proof_status)}
              {blast.namespaces?.fingerprints_distinct ? t("perimeterPage.fingerprintsDistinct") : ""}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/50">{blast.note}</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs leading-5 text-white/55">
              {(blast.procedure || []).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <ul className="mt-3 space-y-1 text-xs text-white/60">
              {(blast.attempts || []).map((a) => (
                <li key={a.role}>
                  {a.role}: {a.opened ? t("perimeterPage.attemptOpened") : t("perimeterPage.attemptFailed")}
                  {a.error ? ` (${a.error})` : ""}
                </li>
              ))}
            </ul>
            {blast.captured_brief?.content_hash ? (
              <p className="mt-2 break-all text-[11px] text-white/40">
                {t("perimeterPage.canaryHash").replace("{hash}", blast.captured_brief.content_hash)}
              </p>
            ) : null}
          </section>
        ) : null}

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {info ? <p className="mt-4 text-sm text-emerald-300">{info}</p> : null}

        <section
          id="security-watch"
          className="mt-8 scroll-mt-24 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.05] p-5 sm:p-6"
        >
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/80">
            {t("perimeterPage.securityWatchKicker")}
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">
              {t("perimeterPage.securityWatchTitle")}
            </h2>
            <p className="font-mono text-xl font-semibold text-emerald-200">
              {t("perimeterPage.securityWatchPrice")}
            </p>
          </div>
          <p className="mt-3 text-sm leading-7 text-white/70">{t("perimeterPage.securityWatchIntro")}</p>
          <p className="mt-2 text-sm leading-6 text-white/50">{t("perimeterPage.securityWatchDisclaimer")}</p>
          <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <div className="relative aspect-[16/11] w-full bg-[#071018]">
              <Image
                src="/perimeter/security-watch.jpg"
                alt={t("perimeterPage.securityWatchImageAlt")}
                fill
                unoptimized
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 48rem"
              />
            </div>
          </div>
          <ol className="mt-5 grid gap-3 sm:grid-cols-4">
            {securitySteps.map(({ title, body }, idx) => (
              <li key={title} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div className="mt-2 text-sm font-medium text-emerald-200">{title}</div>
                <div className="mt-1 text-xs leading-5 text-white/50">{body}</div>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="mt-6 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950"
            onClick={() => onServicePick("perimeter-security-watch")}
          >
            {t("perimeterPage.selectSecurityWatch")}
          </button>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">
            {t("perimeterPage.catalog")}
          </h2>
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
                    {t("perimeterPage.fromAcpUnit")
                      .replace("{price}", Number(s.price_from_acp).toLocaleString())
                      .replace("{unit}", s.unit)}
                  </span>
                </div>
                {s.small_operator ? (
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-emerald-200/80">
                    {t("perimeterPage.smallOperatorSku")}
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-white/60">{s.description}</p>
              </button>
            ))}
          </div>
        </section>

        <form id="intake-form" onSubmit={onSubmit} className="mt-10 scroll-mt-24 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">
            {t("perimeterPage.encryptedIntake")}
          </h2>
          <label className="block text-sm">
            <span className="text-white/55">{t("perimeterPage.siteLabel")}</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              value={siteLabel}
              onChange={(e) => setSiteLabel(e.target.value)}
              required
              placeholder={t("perimeterPage.sitePlaceholder")}
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/55">{t("perimeterPage.perimeterMeters")}</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              value={perimeterMeters}
              onChange={(e) => setPerimeterMeters(e.target.value)}
              placeholder={t("perimeterPage.perimeterOptional")}
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/55">{t("perimeterPage.contaminationClass")}</span>
            <select
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              value={contamination}
              onChange={(e) => setContamination(e.target.value)}
            >
              {CONTAMINATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(`perimeterPage.${opt.key}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-white/55">{t("perimeterPage.notesLabel")}</span>
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
            {busy ? t("perimeterPage.saving") : t("perimeterPage.encryptAndCreate")}
          </button>
        </form>

        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/55">
            {t("perimeterPage.myJobs")}
          </h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-white/45">{t("perimeterPage.jobsEmpty")}</p>
          ) : (
            jobs.map((j) => (
              <div key={j.id} className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{j.site_label_hint}</span>
                  <span className="text-xs text-white/45">{j.status}</span>
                </div>
                <p className="mt-1 text-xs text-white/45">
                  {j.contamination} · {j.cipher_id}
                  {j.content_hash ? ` · ${j.content_hash}` : ""}
                </p>
                <button
                  type="button"
                  className="mt-2 mr-3 text-sm text-emerald-300 underline"
                  onClick={() => void onDecrypt(j.id)}
                >
                  {t("perimeterPage.decrypt")}
                </button>
                <button
                  type="button"
                  className="mt-2 text-sm text-emerald-300 underline"
                  onClick={() => void onBlast(j.id)}
                >
                  {t("perimeterPage.blastRadius")}
                </button>
                {jobProofs[j.id] ? (
                  <p className="mt-2 text-xs text-amber-200/80">
                    {t("perimeterPage.compartmentStatus").replace(
                      "{status}",
                      jobProofs[j.id].proof_status
                    )}
                    {" · "}
                    {jobProofs[j.id].attempts.filter((a) => a.role !== "control_perimeter" && a.opened).length === 0
                      ? t("perimeterPage.foreignNamespacesClosed")
                      : t("perimeterPage.foreignKeyOpened")}
                  </p>
                ) : null}
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
            {t("perimeterPage.linkInsurance")}
          </Link>
          <Link href="/buy-acp" className="text-emerald-300 underline">
            {t("perimeterPage.linkBuyAcp")}
          </Link>
        </div>
      </main>
    </div>
  );
}
