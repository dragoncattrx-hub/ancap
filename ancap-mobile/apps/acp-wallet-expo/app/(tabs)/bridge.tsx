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
import type { BridgeIntent, RedeemQuote, ReserveProof, WacpStatus } from "@ancap/acp-bridge-client";
import { loadVault } from "@/lib/vault";
import { getBridgeClient } from "@/lib/bridge";

export default function BridgeScreen() {
  const [loading, setLoading] = useState(true);
  const [bridgeStatus, setBridgeStatus] = useState("—");
  const [bridgeEnabled, setBridgeEnabled] = useState(false);
  const [reverseEnabled, setReverseEnabled] = useState(false);
  const [wacpContract, setWacpContract] = useState("");
  const [reserveProof, setReserveProof] = useState<ReserveProof | null>(null);
  const [wacpStatus, setWacpStatus] = useState<WacpStatus | null>(null);
  const [sampleRedeemQuote, setSampleRedeemQuote] = useState<RedeemQuote | null>(null);
  const [recentIntents, setRecentIntents] = useState<BridgeIntent[]>([]);
  const [docs, setDocs] = useState<{ bridge: string; risks: string; reserve: string } | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    const bridge = getBridgeClient();
    try {
      const [status, reserve, publicStatus, quote] = await Promise.all([
        bridge.getStatus(),
        bridge.getReserveProof(),
        bridge.getWacpStatus(),
        bridge.quoteBscToAcp("1"),
      ]);
      setBridgeStatus(publicStatus.status || reserve.status || "offline");
      setBridgeEnabled(status.bridge_rail_enabled);
      setReverseEnabled(publicStatus.redeem_available);
      setWacpContract(publicStatus.wacp_contract || "—");
      setReserveProof(reserve);
      setWacpStatus(publicStatus);
      setSampleRedeemQuote(quote);
      setDocs({
        bridge: publicStatus.docs.bridge,
        risks: publicStatus.docs.risks,
        reserve: publicStatus.docs.reserve,
      });
    } catch (e) {
      setBridgeStatus("offline");
      setError(e instanceof Error ? e.message : "Bridge status unavailable");
      setReserveProof(null);
      setWacpStatus(null);
      setSampleRedeemQuote(null);
      setRecentIntents([]);
      return;
    }

    try {
      const vault = await loadVault();
      if (!vault) {
        setRecentIntents([]);
        return;
      }
      setRecentIntents([]);
    } catch {
      setRecentIntents([]);
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

      {reserveProof ? (
        <View style={styles.card}>
          <Text style={styles.label}>Reserve proof</Text>
          <Text style={styles.meta}>Health: {reserveProof.reserve_health}</Text>
          <Text style={styles.meta}>Backing ratio: {reserveProof.backing_ratio ?? "—"}</Text>
          <Text style={styles.meta}>Reserve address: {reserveProof.acp_reserve_address || "—"}</Text>
          <Text style={styles.meta}>Reserve balance: {reserveProof.acp_reserve_balance_smallest} smallest ACP</Text>
        </View>
      ) : null}

      {sampleRedeemQuote ? (
        <View style={styles.card}>
          <Text style={styles.label}>Redeem example</Text>
          <Text style={styles.meta}>1 wACP → {sampleRedeemQuote.acp_amount_floor} ACP</Text>
          <Text style={styles.meta}>Remainder: {sampleRedeemQuote.remainder_wacp} wACP</Text>
          <Text style={styles.meta}>{sampleRedeemQuote.policy}</Text>
        </View>
      ) : null}

      {wacpStatus ? (
        <View style={styles.card}>
          <Text style={styles.label}>Public market status</Text>
          <Text style={styles.meta}>Pair live: {wacpStatus.pair_live ? "yes" : "no"}</Text>
          <Text style={styles.meta}>DEX: {wacpStatus.pair_dex ?? "—"}</Text>
          <Text style={styles.meta}>Contract verified: {wacpStatus.bsc_contract_verified ? "yes" : "no"}</Text>
          <Text style={styles.meta}>Token metadata live: {wacpStatus.token_metadata_live ? "yes" : "no"}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Your bridge intents</Text>
        {recentIntents.length > 0 ? (
          recentIntents.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.intentRow}>
              <Text style={styles.intentPrimary}>{item.direction} · {item.status}</Text>
              <Text style={styles.intentMeta}>{item.amount_acp_smallest} ACP-smallest</Text>
            </View>
          ))
        ) : (
          <Text style={styles.meta}>
            Authenticated mobile intent history wiring is ready in the SDK client, but the app is not
            logging users into ANCAP yet, so in-app intent polling stays off for now.
          </Text>
        )}
      </View>

      <Text style={styles.note}>
        Full in-app bridge intents (deposit → mint / burn → payout) ship in v1.1. This screen now
        reflects live reserve + market status and a real redeem quote.
      </Text>

      {docs ? (
        <View style={styles.links}>
          <Pressable onPress={() => Linking.openURL(docs.bridge)}>
            <Text style={styles.link}>Bridge documentation</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(docs.risks)}>
            <Text style={styles.link}>Risk disclosure</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(docs.reserve)}>
            <Text style={styles.link}>Reserve proof docs</Text>
          </Pressable>
          {wacpStatus?.swap_url ? (
            <Pressable onPress={() => Linking.openURL(wacpStatus.swap_url!)}>
              <Text style={styles.link}>Open PancakeSwap</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  intentRow: {
    paddingVertical: 8,
    borderTopColor: "#1e293b",
    borderTopWidth: 1,
  },
  intentPrimary: { color: "#f5f7ff", fontSize: 14, fontWeight: "600" },
  intentMeta: { color: "#94a3b8", marginTop: 4, fontSize: 12 },
  note: { color: "#94a3b8", lineHeight: 22, marginBottom: 16 },
  links: { gap: 12 },
  link: { color: "#6ee7b7", fontSize: 16 },
  error: { color: "#f87171", marginTop: 12 },
});
