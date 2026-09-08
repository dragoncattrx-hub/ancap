import { CookiesLegalView } from "@/components/legal/LegalViews";

export const metadata = {
  title: "Cookie Policy",
  description: "ANCAP cookie and local storage policy with necessary, analytics, and marketing preference categories.",
};

export default function CookiesPage() {
  return <CookiesLegalView />;
}
