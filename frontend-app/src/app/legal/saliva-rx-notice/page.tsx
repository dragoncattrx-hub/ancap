export const metadata = {
  title: "ANCAP Saliva Rx legal notice",
  description:
    "Saliva analysis and individualized compounding desk: intents only, licensed partners, no cure warranty.",
};

export default function LegalSalivaRxNoticePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-slate-800 dark:text-slate-100">
      <h1 className="font-serif text-3xl">Saliva Rx — legal notice</h1>
      <p className="mt-4 text-sm text-slate-500">As of 11 September 2026</p>
      <div className="mt-8 space-y-4 text-base leading-7">
        <p>
          The ANCAP <strong>Saliva Rx</strong> desk sells ACP-settled coordination intents: saliva kit logistics,
          partner laboratory assay briefs, individualized formulation design briefs, and escrow toward licensed
          compounding or synthesis pharmacies.
        </p>
        <p>
          ANCAP does <strong>not</strong> practice medicine, diagnose or treat disease, manufacture medicinal
          products, or guarantee that any saliva-derived profile will cure or prevent any condition. Physical
          assays and compounding occur only under partner licenses and applicable health / pharmacy law.
        </p>
        <p>
          Users must not upload regulated health data without a lawful basis. Controlled substances, pathogen
          work, and gene synthesis are out of scope for ANCAP hosts. Where a prescription is required, a
          licensed clinician and pharmacy must authorize the batch.
        </p>
        <p>
          See also{" "}
          <a className="underline" href="/saliva-rx">
            /saliva-rx
          </a>
          ,{" "}
          <a className="underline" href="/aeterna">
            AETERNA
          </a>
          , and{" "}
          <a className="underline" href="/legal/terms">
            Terms
          </a>
          .
        </p>
      </div>
    </main>
  );
}
