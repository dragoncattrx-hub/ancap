import { redirect } from "next/navigation";

/** Alias for BscScan / listing forms that look for a wACP whitepaper path. */
export default function WacpWhitepaperAliasPage() {
  redirect("/whitepaper/acp");
}
