import { permanentRedirect } from "next/navigation";

type Props = { params: Promise<{ txid: string }> };

export default async function AcpTxRedirectPage({ params }: Props) {
  const resolved = await params;
  const txid = encodeURIComponent(String(resolved?.txid || "").trim());
  permanentRedirect(`/explorer/tx/${txid}`);
}
