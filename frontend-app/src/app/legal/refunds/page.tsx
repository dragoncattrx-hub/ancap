import { RefundsView } from "@/components/legal/LegalViews";

export const metadata = {
  title: "ANCAP Payments & Refunds",
  description: "How ANCAP treats paid workflow runs, API spend, credits, fiat top-ups, and refund review requests.",
};

export default function LegalRefundsPage() {
  return <RefundsView />;
}
