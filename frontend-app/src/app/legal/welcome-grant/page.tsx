import { WelcomeGrantView } from "@/components/legal/LegalViews";

export const metadata = {
  title: "ANCAP welcome grant — 100 ACP access credit",
  description:
    "100 ACP registration grant is a promotional platform credit (nominal $100 label): not a charitable donation, not e-money, not a MiCA public offer, not USD/EUR cash, and not tax-deductible under EU/US/RU rules.",
};

export default function LegalWelcomeGrantPage() {
  return <WelcomeGrantView />;
}
