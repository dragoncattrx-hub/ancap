import { WelcomeGrantView } from "@/components/legal/LegalViews";

export const metadata = {
  title: "ANCAP welcome grant — 100 ACP access credit",
  description:
    "100 ACP registration grant is a promotional platform credit (nominal $100 accounting label), not a charitable donation, not USD cash, and not tax-deductible.",
};

export default function LegalWelcomeGrantPage() {
  return <WelcomeGrantView />;
}
