import { InstallationProjectLegalView } from "@/components/legal/LegalViews";

export const metadata = {
  title: "Installation Project — legal notice | ANCAP",
  description:
    "AETERNA Installation Project rail: licensed neonatology / infant-nutrition partner literacy only. Not infant formula sold by ANCAP, not a CE/FDA hyperbaric device, not home HBO, not a guaranteed clinical outcome.",
};

export default function LegalInstallationProjectPage() {
  return <InstallationProjectLegalView />;
}
