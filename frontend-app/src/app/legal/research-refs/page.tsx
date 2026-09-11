import { ResearchRefsDisclosureView } from "@/components/legal/LegalViews";

export const metadata = {
  title: "ANCAP Research References — ZEISS, Daewoong eTurna & quantum-info cites",
  description:
    "Third-party scientific citations used on ANCAP as of 11 September 2026, including ZEISS LSM Lightfield 4D, Daewoong eTurna USPTO notice of allowance journalism, Chalmers Floquet bosonic-code PRL coverage, and iXBT Live quantum data-protection coverage. No affiliation implied.",
};

export default function LegalResearchRefsPage() {
  return <ResearchRefsDisclosureView />;
}
