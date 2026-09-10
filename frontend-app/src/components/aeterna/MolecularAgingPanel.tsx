"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

type Hallmark = {
  id: string;
  title: string;
  gene_pair_hint: string;
  theme: string;
};

const FALLBACK_HALLMARKS: Hallmark[] = [
  { id: "dna_repair", title: "DNA repair", gene_pair_hint: "repair sensor / effector", theme: "genomic_instability" },
  { id: "telomere_maintenance", title: "Telomere maintenance", gene_pair_hint: "shelterin / telomerase-axis", theme: "telomere_attrition" },
  { id: "epigenetic_regulation", title: "Epigenetic regulation", gene_pair_hint: "writer / eraser", theme: "epigenetic_alterations" },
  { id: "proteostasis", title: "Proteostasis", gene_pair_hint: "chaperone / proteasome", theme: "loss_of_proteostasis" },
  { id: "autophagy", title: "Autophagy", gene_pair_hint: "initiation / clearance", theme: "disabled_macroautophagy" },
  { id: "energy_metabolism", title: "Energy metabolism", gene_pair_hint: "glycolysis / OXPHOS", theme: "energy" },
  { id: "cellular_senescence", title: "Cellular senescence", gene_pair_hint: "SASP / checkpoint", theme: "senescence" },
  { id: "stem_cell_maintenance", title: "Stem-cell maintenance", gene_pair_hint: "niche / renewal", theme: "stem_cells" },
  { id: "mitochondrial_function", title: "Mitochondrial function", gene_pair_hint: "biogenesis / QC", theme: "mitochondria" },
  { id: "inflammatory_tone", title: "Inflammatory tone", gene_pair_hint: "pro- / anti-inflammatory", theme: "inflammation" },
  { id: "intercellular_signaling", title: "Intercellular signaling", gene_pair_hint: "ligand / receptor", theme: "signaling" },
  { id: "extracellular_matrix", title: "Extracellular matrix", gene_pair_hint: "build / remodel", theme: "matrix" },
  { id: "circadian_systemic", title: "Circadian / systemic", gene_pair_hint: "clock / effector", theme: "circadian" },
  { id: "immune_aging", title: "Immune aging", gene_pair_hint: "innate / adaptive", theme: "immunity" },
  { id: "nutrient_sensing", title: "Nutrient sensing", gene_pair_hint: "mTOR / AMPK-axis", theme: "nutrient" },
];

const WORKFLOW_SLUG = "aeterna-molecular-aging-profile";

type Props = {
  hallmarks?: Hallmark[] | null;
  note?: string | null;
};

/** Public 15-axis molecular aging map — consult framing, not a bio-age score. */
export function MolecularAgingPanel({ hallmarks, note }: Props) {
  const { t } = useLanguage();
  const rows = hallmarks && hallmarks.length > 0 ? hallmarks : FALLBACK_HALLMARKS;

  return (
    <section id="molecular-aging" className="scroll-mt-24">
      <p className="text-xs uppercase tracking-[0.16em] text-[#9ae0d9]">{t("aeternaPage.agingKicker")}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{t("aeternaPage.agingTitle")}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">{t("aeternaPage.agingLead")}</p>
      {note ? <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">{note}</p> : null}

      <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((h, index) => (
          <li
            key={h.id}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="truncate font-mono text-[10px] text-white/30">{h.theme}</span>
            </div>
            <div className="mt-2 text-sm font-medium text-[#9ae0d9]">{h.title}</div>
            <div className="mt-1 text-xs leading-5 text-white/50">{h.gene_pair_hint}</div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/ai/run/${WORKFLOW_SLUG}`}
          className="rounded-md bg-[#7ad0c8] px-5 py-3 text-sm font-semibold text-[#04201e] transition hover:bg-[#9ae0d9]"
        >
          {t("aeternaPage.agingCta")}
        </Link>
        <p className="max-w-md self-center text-xs leading-5 text-white/40">{t("aeternaPage.agingCite")}</p>
      </div>
    </section>
  );
}
