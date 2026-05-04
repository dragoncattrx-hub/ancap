import { redirect } from "next/navigation";

/** Canonical bridge UI lives under /bridge/acp-bsc */
export default function BridgeIndexPage() {
  redirect("/bridge/acp-bsc");
}
