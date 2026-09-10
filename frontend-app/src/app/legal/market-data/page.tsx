import { MarketDataDisclosureView } from "@/components/legal/LegalViews";

export const metadata = {
  title: "ANCAP Market Data Disclosure",
  description:
    "How ANCAP uses CoinGecko market feeds and AccuWeather weather data — indicative only, not settlement, advice, or official weather warnings.",
};

export default function LegalMarketDataPage() {
  return <MarketDataDisclosureView />;
}
