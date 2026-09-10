import { RiskDisclosureView } from "@/components/legal/LegalViews";

export const metadata = {
  title: "ANCAP Risk Disclosure",
  description:
    "Client risk disclosure for AI outputs, ACP utility nature, wallet and bridge risks, and regulatory considerations.",
};

export default function LegalRiskPage() {
  return <RiskDisclosureView />;
}
