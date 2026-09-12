import { HumanitarianLegalView } from "@/components/legal/LegalViews";

export const metadata = {
  title: "ANCAP humanitarian aid desk — legal notice",
  description:
    "ACP-settled humanitarian briefs and Red Cross / Red Crescent national-society listings: not a 135-FZ charity, not a signed ICRC/IFRC partnership, not an emblem licence, not a tax-deductible donation receipt.",
};

export default function LegalHumanitarianPage() {
  return <HumanitarianLegalView />;
}
