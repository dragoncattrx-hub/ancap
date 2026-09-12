import { MReceptorLegalView } from "@/components/legal/LegalViews";

export const metadata = {
  title: "M-receptor delivery subscription — legal notice | ANCAP",
  description:
    "AETERNA M-receptor rail: licensed-clinic subscription briefs only. Not compounding, not a CE/FDA device, not a treatment claim for Parkinson, asthma, COPD, arrhythmia, or intraocular pressure.",
};

export default function LegalMReceptorPage() {
  return <MReceptorLegalView />;
}
