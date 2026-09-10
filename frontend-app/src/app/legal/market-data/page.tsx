import { MarketDataDisclosureView } from "@/components/legal/LegalViews";

export const metadata = {
  title: "ANCAP Market Data Disclosure",
  description:
    "How ANCAP uses CoinGecko and other third-party market data feeds — indicative only, not settlement or investment advice.",
};

export default function LegalMarketDataPage() {
  return <MarketDataDisclosureView />;
}
