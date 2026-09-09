/**
 * Org identity sync — register NFC uid_hash with backend (never raw UID).
 */
import { getEnrolledNfcUidHash } from "@/lib/nfc";
import { getApi, hasApiAuthHeader } from "@/lib/api";

function getConfiguredOrgId(): string | null {
  const raw = process.env.EXPO_PUBLIC_ORG_ID?.trim();
  return raw || null;
}

export async function syncNfcCredentialToBackend(label?: string): Promise<boolean> {
  const orgId = getConfiguredOrgId();
  if (!orgId || !hasApiAuthHeader()) {
    return false;
  }
  const uidHash = await getEnrolledNfcUidHash();
  if (!uidHash) {
    return false;
  }
  const api = getApi();
  await api.registerOrgNfcCredential(orgId, { uid_hash: uidHash, label: label ?? "biohax" });
  return true;
}

export function getOrgIdForPassport(): string | null {
  return getConfiguredOrgId();
}
