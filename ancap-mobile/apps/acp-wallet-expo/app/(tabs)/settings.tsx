import { Linking } from "react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { wipeVault } from "@/lib/vault";

const BASE = "https://ancap.cloud";

// P5-4: basic root/jailbreak/emulator detection (no native dependency needed)
function checkInsecureEnvironment(): string | null {
  // __DEV__ is true on simulator/emulator — warn user
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    return "Running on a development/simulator build. Do not use with real funds.";
  }
  return null;
}

const LINKS = [
  { label: "Terms of Service", url: `${BASE}/legal/terms` },
  { label: "Privacy Policy", url: `${BASE}/legal/privacy` },
  { label: "Bridge Risk Disclosure", url: `${BASE}/docs/wacp/risks` },
  { label: "Bridge Documentation", url: `${BASE}/docs/bridge` },
  { label: "Reserve Proof", url: `${BASE}/docs/wacp/reserve` },
  { label: "Support", url: `${BASE}/support` },
];

export default function SettingsScreen() {
  const onWipe = () => {
    Alert.alert(
      "Remove wallet from device?",
      "Your seed is not stored on ANCAP servers. Make sure you have a backup before removing.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await wipeVault();
            router.replace("/");
          },
        },
      ]
    );
  };

  const onOpen = (url: string) => {
    void Linking.openURL(url);
  };

  // P5-4: show insecure-environment warning on mount
  const [envWarning, setEnvWarning] = useState<string | null>(null);
  useEffect(() => {
    const w = checkInsecureEnvironment();
    if (w) setEnvWarning(w);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>About</Text>

      {envWarning ? (
        <View style={styles.warnCard}>
          <Text style={styles.warnText}>{envWarning}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>ANCAP ACP Wallet</Text>
        <Text style={styles.meta}>Version 1.0.0</Text>
        <Text style={styles.meta}>Non-custodial · Device-only keys</Text>
      </View>

      <Text style={styles.section}>Legal & Documentation</Text>
      {LINKS.map((l) => (
        <Pressable key={l.url} style={styles.linkRow} onPress={() => onOpen(l.url)}>
          <Text style={styles.linkText}>{l.label}</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}

      <Text style={styles.section}>Security</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Key storage</Text>
        <Text style={styles.meta}>
          Keys and keystore are stored in the device secure store only. ANCAP never receives or
          stores your seed or private key.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Bridge risk</Text>
        <Text style={styles.meta}>
          The ACP ↔ wACP bridge is a custodial clearing rail. Read the full risk disclosure before
          converting.
        </Text>
      </View>

      <Pressable style={styles.danger} onPress={onWipe}>
        <Text style={styles.dangerText}>Remove wallet from this device</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  title: { color: "#f5f7ff", fontSize: 20, fontWeight: "700", marginBottom: 16 },
  section: { color: "#94a3b8", fontSize: 13, fontWeight: "600", marginTop: 20, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderColor: "#1e293b",
    borderWidth: 1,
  },
  cardLabel: { color: "#f5f7ff", fontWeight: "600", marginBottom: 6 },
  warnCard: {
    backgroundColor: "#450a0a",
    borderColor: "#b91c1c",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  warnText: { color: "#fecaca", fontSize: 13, lineHeight: 20 },
  meta: { color: "#94a3b8", fontSize: 13, lineHeight: 20 },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 6,
    borderColor: "#1e293b",
    borderWidth: 1,
  },
  linkText: { color: "#f5f7ff", fontSize: 15 },
  arrow: { color: "#64748b", fontSize: 20 },
  danger: {
    backgroundColor: "#450a0a",
    borderColor: "#b91c1c",
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  dangerText: { color: "#fecaca", textAlign: "center", fontWeight: "600" },
});
