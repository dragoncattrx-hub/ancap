import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AcpApiClient } from "@ancap/acp-api-client";
import { hasVault } from "@/lib/vault";

const API_BASE =
  process.env.EXPO_PUBLIC_ANCAP_API_BASE ?? "https://api.ancap.cloud/v1";

export default function WelcomeScreen() {
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [vaultExists, setVaultExists] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const api = new AcpApiClient({ baseUrl: API_BASE });
        const cfg = await api.getConfig();
        if (!cancelled) {
          setMaintenance(cfg.maintenance);
        }
      } catch {
        /* offline — allow local wallet */
      }
      const exists = await hasVault();
      if (!cancelled) {
        setVaultExists(exists);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6ee7b7" />
      </View>
    );
  }

  if (maintenance) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Maintenance</Text>
        <Text style={styles.sub}>
          ACP Wallet is temporarily unavailable. Try again later.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>ANCAP</Text>
      <Text style={styles.title}>ACP Wallet</Text>
      <Text style={styles.sub}>
        Non-custodial wallet for ACP and wACP. Your keys stay on this device.
      </Text>

      {vaultExists ? (
        <Link href="/(tabs)" asChild>
          <Pressable style={styles.primary}>
            <Text style={styles.primaryText}>Open wallet</Text>
          </Pressable>
        </Link>
      ) : (
        <>
          <Link href="/onboarding/create" asChild>
            <Pressable style={styles.primary}>
              <Text style={styles.primaryText}>Create new wallet</Text>
            </Pressable>
          </Link>
          <Link href="/onboarding/import" asChild>
            <Pressable style={styles.secondary}>
              <Text style={styles.secondaryText}>Import wallet</Text>
            </Pressable>
          </Link>
        </>
      )}

      <Text style={styles.risk}>
        Not investment advice. Bridge uses an operator-backed clearing rail — see
        docs on ancap.cloud.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0f1a",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#0a0f1a",
  },
  brand: { color: "#6ee7b7", fontSize: 14, letterSpacing: 4, marginBottom: 8 },
  title: { color: "#f5f7ff", fontSize: 32, fontWeight: "700", marginBottom: 12 },
  sub: { color: "#94a3b8", fontSize: 16, lineHeight: 24, marginBottom: 32 },
  primary: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryText: {
    color: "#042f1a",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
  },
  secondary: {
    borderColor: "#334155",
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  secondaryText: { color: "#f5f7ff", textAlign: "center", fontSize: 17 },
  risk: { color: "#64748b", fontSize: 12, lineHeight: 18 },
});
