import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import type { DatingAccessPoint } from "@ancap/acp-api-client";
import { safeErrorMessage } from "@ancap/acp-wallet-sdk";
import { getApi } from "@/lib/api";
import {
  DatingMeshNode,
  DEVICE_NAME_PREFIX,
  type DiscoveredPeer,
  type MeshChatLine,
} from "@/lib/dating-mesh";

const AGE_KEY = "ancap_dating_age_18";
const PEER_KEY = "ancap_dating_peer_id";

export default function DatingScreen() {
  const { t } = useTranslation();
  const [ageOk, setAgeOk] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [mesh, setMesh] = useState<DatingMeshNode | null>(null);
  const [meshInfo, setMeshInfo] = useState("");
  const [peers, setPeers] = useState<DiscoveredPeer[]>([]);
  const [chat, setChat] = useState<MeshChatLine[]>([]);
  const [draft, setDraft] = useState("");
  const [points, setPoints] = useState<DatingAccessPoint[]>([]);
  const [apTitle, setApTitle] = useState("");
  const [apLat, setApLat] = useState("52.5200");
  const [apLon, setApLon] = useState("13.4050");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const v = await SecureStore.getItemAsync(AGE_KEY);
      setAgeOk(v === "1");
    })();
  }, []);

  const refreshPoints = useCallback(async () => {
    try {
      const api = getApi();
      const list = await api.listDatingAccessPoints();
      setPoints(list);
    } catch (e) {
      setError(safeErrorMessage(e, t("dating.loadFailed")));
    }
  }, [t]);

  useEffect(() => {
    if (ageOk) void refreshPoints();
  }, [ageOk, refreshPoints]);

  useEffect(() => {
    return () => {
      void mesh?.stop();
    };
  }, [mesh]);

  const attestAge = async () => {
    if (!displayName.trim()) {
      setError(t("dating.nameRequired"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await SecureStore.setItemAsync(AGE_KEY, "1");
      let peerId = await SecureStore.getItemAsync(PEER_KEY);
      if (!peerId) {
        peerId = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        await SecureStore.setItemAsync(PEER_KEY, peerId);
      }
      try {
        const api = getApi();
        await api.upsertDatingProfile({
          display_name: displayName.trim(),
          age_attested_18: true,
          visibility: "nearby",
          mesh_peer_id: peerId,
        });
      } catch {
        // Profile sync is optional when offline / unauthenticated
      }
      setAgeOk(true);
    } finally {
      setBusy(false);
    }
  };

  const startMesh = async () => {
    setBusy(true);
    setError("");
    try {
      let peerId = (await SecureStore.getItemAsync(PEER_KEY)) ?? undefined;
      const node = new DatingMeshNode(peerId);
      if (!peerId) await SecureStore.setItemAsync(PEER_KEY, node.peerId);
      const info = await node.start();
      setMesh(node);
      setMeshInfo(
        info.ble
          ? t("dating.meshBleOn", { name: info.advertisingName })
          : t("dating.meshSimOn", { name: info.advertisingName })
      );
      setPeers(node.getPeers());
      setChat(node.getInbox());
      node.onPeers(setPeers);
      node.onChat((line) => setChat((prev) => [...prev.filter((x) => x.id !== line.id), line]));
    } catch (e) {
      setError(safeErrorMessage(e, t("dating.meshFailed")));
    } finally {
      setBusy(false);
    }
  };

  const stopMesh = async () => {
    await mesh?.stop();
    setMesh(null);
    setMeshInfo("");
  };

  const send = () => {
    if (!mesh || !draft.trim()) return;
    mesh.sendChat(draft.trim());
    setDraft("");
    setChat(mesh.getInbox());
  };

  const createAp = async () => {
    const lat = Number(apLat);
    const lon = Number(apLon);
    if (!apTitle.trim() || Number.isNaN(lat) || Number.isNaN(lon)) {
      setError(t("dating.apInvalid"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      mesh?.beaconAccessPoint(apTitle.trim(), lat, lon);
      try {
        const api = getApi();
        await api.createDatingAccessPoint({
          title: apTitle.trim(),
          lat,
          lon,
        });
      } catch {
        // Local beacon still created
      }
      setApTitle("");
      await refreshPoints();
    } catch (e) {
      setError(safeErrorMessage(e, t("dating.apFailed")));
    } finally {
      setBusy(false);
    }
  };

  const peerLabel = useMemo(() => peers.slice(0, 12), [peers]);

  if (ageOk === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6ee7b7" />
      </View>
    );
  }

  if (!ageOk) {
    return (
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.h1}>{t("dating.title")}</Text>
        <Text style={styles.body}>{t("dating.ageGate")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("dating.displayName")}
          placeholderTextColor="#64748b"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Pressable style={styles.btn} onPress={() => void attestAge()} disabled={busy}>
          <Text style={styles.btnText}>{t("dating.attest18")}</Text>
        </Pressable>
        <Pressable onPress={() => void Linking.openURL("https://ancap.cloud/legal/dating")}>
          <Text style={styles.link}>{t("dating.legal")}</Text>
        </Pressable>
        {error ? <Text style={styles.err}>{error}</Text> : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Text style={styles.h1}>{t("dating.title")}</Text>
      <Text style={styles.body}>{t("dating.subtitle", { brand: DEVICE_NAME_PREFIX })}</Text>

      <View style={styles.row}>
        {!mesh ? (
          <Pressable style={styles.btn} onPress={() => void startMesh()} disabled={busy}>
            <Text style={styles.btnText}>{t("dating.startMesh")}</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.btn, styles.btnMuted]} onPress={() => void stopMesh()}>
            <Text style={styles.btnText}>{t("dating.stopMesh")}</Text>
          </Pressable>
        )}
      </View>
      {meshInfo ? <Text style={styles.meta}>{meshInfo}</Text> : null}

      <Text style={styles.h2}>{t("dating.nearby")}</Text>
      {peerLabel.length === 0 ? (
        <Text style={styles.meta}>{t("dating.noPeers")}</Text>
      ) : (
        peerLabel.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.cardTitle}>{p.name}</Text>
            <Text style={styles.meta}>
              {p.via}
              {p.rssi != null ? ` · ${p.rssi} dBm` : ""} · {p.id.slice(0, 10)}…
            </Text>
          </View>
        ))
      )}

      <Text style={styles.h2}>{t("dating.meshChat")}</Text>
      <View style={styles.chatBox}>
        {chat.slice(-30).map((line) => (
          <Text key={line.id} style={styles.chatLine}>
            [{line.hops}h] {line.fromPeerId.slice(0, 6)}: {line.text}
          </Text>
        ))}
        {!chat.length ? <Text style={styles.meta}>{t("dating.chatEmpty")}</Text> : null}
      </View>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={t("dating.message")}
          placeholderTextColor="#64748b"
          value={draft}
          onChangeText={setDraft}
        />
        <Pressable style={styles.btnSmall} onPress={send} disabled={!mesh}>
          <Text style={styles.btnText}>{t("dating.send")}</Text>
        </Pressable>
      </View>

      <Text style={styles.h2}>{t("dating.accessPoints")}</Text>
      <TextInput
        style={styles.input}
        placeholder={t("dating.apTitle")}
        placeholderTextColor="#64748b"
        value={apTitle}
        onChangeText={setApTitle}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="lat"
          placeholderTextColor="#64748b"
          value={apLat}
          onChangeText={setApLat}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="lon"
          placeholderTextColor="#64748b"
          value={apLon}
          onChangeText={setApLon}
          keyboardType="decimal-pad"
        />
      </View>
      <Pressable style={styles.btn} onPress={() => void createAp()} disabled={busy}>
        <Text style={styles.btnText}>{t("dating.createAp")}</Text>
      </Pressable>
      {points.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.cardTitle}>{p.title}</Text>
          <Text style={styles.meta}>
            {p.lat.toFixed(5)}, {p.lon.toFixed(5)}
          </Text>
          <Pressable
            onPress={() =>
              void Linking.openURL(
                `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=16/${p.lat}/${p.lon}`
              )
            }
          >
            <Text style={styles.link}>{t("dating.openMap")}</Text>
          </Pressable>
        </View>
      ))}

      <Pressable onPress={() => void Linking.openURL("https://ancap.cloud/dating")}>
        <Text style={styles.link}>{t("dating.webCatalog")}</Text>
      </Pressable>
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0a0f1a" },
  pad: { padding: 16, gap: 10, backgroundColor: "#0a0f1a", paddingBottom: 48 },
  h1: { color: "#f5f7ff", fontSize: 22, fontWeight: "700" },
  h2: { color: "#e2e8f0", fontSize: 16, fontWeight: "600", marginTop: 12 },
  body: { color: "#94a3b8", fontSize: 14, lineHeight: 20 },
  meta: { color: "#64748b", fontSize: 12 },
  input: {
    backgroundColor: "#111827",
    borderColor: "#1e293b",
    borderWidth: 1,
    borderRadius: 10,
    color: "#f5f7ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btn: {
    backgroundColor: "#065f46",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  btnMuted: { backgroundColor: "#334155" },
  btnSmall: {
    backgroundColor: "#065f46",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  btnText: { color: "#ecfdf5", fontWeight: "600" },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  card: {
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#0f172a",
  },
  cardTitle: { color: "#f8fafc", fontWeight: "600" },
  chatBox: {
    minHeight: 80,
    maxHeight: 180,
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 10,
    padding: 8,
    backgroundColor: "#0f172a",
  },
  chatLine: { color: "#cbd5e1", fontSize: 12, marginBottom: 4 },
  link: { color: "#6ee7b7", fontSize: 13, textDecorationLine: "underline", marginTop: 4 },
  err: { color: "#fca5a5", marginTop: 8 },
});
