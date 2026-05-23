import { Link } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { loadVault } from "@/lib/vault";
import { getApi } from "@/lib/api";

export default function WalletHomeScreen() {
  const [address, setAddress] = useState("");
  const [acp, setAcp] = useState("—");
  const [utxos, setUtxos] = useState(0);
  const [bridgeStatus, setBridgeStatus] = useState("—");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    const vault = await loadVault();
    if (!vault) {
      setError("No wallet on device.");
      return;
    }
    setAddress(vault.address);
    try {
      const api = getApi();
      const [bal, cfg] = await Promise.all([
        api.getBalance(vault.address),
        api.getConfig(),
      ]);
      setAcp(bal.acp);
      setUtxos(bal.utxo_count);
      setBridgeStatus(cfg.bridgeStatus);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load balance");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const onPull = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onPull} tintColor="#6ee7b7" />
      }
    >
      <Text style={styles.label}>ACP address</Text>
      <Text style={styles.address} selectable>
        {address || "…"}
      </Text>

      <View style={styles.actions}>
        <Link href="/receive" asChild>
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionText}>Receive</Text>
          </Pressable>
        </Link>
        <Link href="/(tabs)/send" asChild>
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionText}>Send</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>ACP balance</Text>
        <Text style={styles.balance}>{acp}</Text>
        <Text style={styles.meta}>UTXOs: {utxos}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Bridge</Text>
        <Text style={styles.meta}>Status: {bridgeStatus}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!address && !error ? <ActivityIndicator color="#6ee7b7" /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  label: { color: "#94a3b8", fontSize: 13, marginBottom: 4 },
  address: { color: "#f5f7ff", fontSize: 14, marginBottom: 16 },
  actions: { flexDirection: "row", gap: 12, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionText: { color: "#042f1a", textAlign: "center", fontWeight: "600" },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderColor: "#1e293b",
    borderWidth: 1,
  },
  cardLabel: { color: "#94a3b8", marginBottom: 8 },
  balance: { color: "#6ee7b7", fontSize: 36, fontWeight: "700" },
  meta: { color: "#cbd5e1", marginTop: 8 },
  error: { color: "#f87171", marginTop: 12 },
});
