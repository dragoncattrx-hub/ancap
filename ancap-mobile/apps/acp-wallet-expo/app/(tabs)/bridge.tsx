import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getApi } from "@/lib/api";

export default function BridgeScreen() {
  const [loading, setLoading] = useState(true);
  const [bridgeStatus, setBridgeStatus] = useState("—");
  const [bridgeEnabled, setBridgeEnabled] = useState(false);
  const [reverseEnabled, setReverseEnabled] = useState(false);
  const [wacpContract, setWacpContract] = useState("");
  const [docs, setDocs] = useState<{ bridge: string; risks: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const cfg = await getApi().getConfig();
      setBridgeStatus(cfg.bridgeStatus);
      setBridgeEnabled(cfg.bridgeEnabled);
      setReverseEnabled(cfg.bridgeReverseEnabled);
      setWacpContract(cfg.wacpContract || "—");
      setDocs({ bridge: cfg.docs.bridge, risks: cfg.docs.risks });
    } catch {
      setBridgeStatus("offline");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void refresh().finally(() => setLoading(false));
    }, [refresh])
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => {
            setLoading(true);
            void refresh().finally(() => setLoading(false));
          }}
          tintColor="#6ee7b7"
        />
      }
    >
      <Text style={styles.title}>ACP ↔ wACP</Text>
      <Text style={styles.disclaimer}>
        Custodial clearing rail (operator-backed peg). Not a trustless bridge. Read risks before
        converting.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Rail status</Text>
        <Text style={styles.value}>{bridgeStatus}</Text>
        <Text style={styles.meta}>Mint: {bridgeEnabled ? "enabled" : "disabled"}</Text>
        <Text style={styles.meta}>
          Redeem: {reverseEnabled ? "enabled" : "pending / disabled"}
        </Text>
        <Text style={styles.meta}>wACP contract: {wacpContract}</Text>
      </View>

      <Text style={styles.note}>
        Full in-app bridge intents (deposit → mint) ship in v1.1. Track status here; convert via
        ANCAP bridge when live.
      </Text>

      {docs ? (
        <View style={styles.links}>
          <Pressable onPress={() => Linking.openURL(docs.bridge)}>
            <Text style={styles.link}>Bridge documentation</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(docs.risks)}>
            <Text style={styles.link}>Risk disclosure</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? <ActivityIndicator color="#6ee7b7" style={{ marginTop: 24 }} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  title: { color: "#f5f7ff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  disclaimer: { color: "#fbbf24", lineHeight: 20, marginBottom: 20, fontSize: 13 },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    borderColor: "#1e293b",
    borderWidth: 1,
    marginBottom: 16,
  },
  label: { color: "#94a3b8", marginBottom: 8 },
  value: { color: "#6ee7b7", fontSize: 20, fontWeight: "600", marginBottom: 8 },
  meta: { color: "#cbd5e1", marginTop: 4, fontSize: 13 },
  note: { color: "#94a3b8", lineHeight: 22, marginBottom: 16 },
  links: { gap: 12 },
  link: { color: "#6ee7b7", fontSize: 16 },
});
