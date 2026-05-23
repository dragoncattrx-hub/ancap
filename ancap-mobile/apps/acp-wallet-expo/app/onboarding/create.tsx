import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { createWallet } from "@ancap/acp-wallet-sdk";
import { saveVault } from "@/lib/vault";

export default function CreateWalletScreen() {
  const [busy, setBusy] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [address, setAddress] = useState("");

  const onGenerate = async () => {
    setBusy(true);
    try {
      const w = await createWallet();
      const wordsList = w.mnemonic.split(/\s+/).filter(Boolean);
      setWords(wordsList);
      setAddress(w.address);
      await saveVault({
        address: w.address,
        keystoreJson: w.keystoreJson,
        mnemonic: w.mnemonic,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed";
      Alert.alert(
        "Could not create wallet",
        `${msg}\n\nFor Expo Go use Import. For dev build: run build-android-native.ps1 then npx expo run:android.`
      );
    } finally {
      setBusy(false);
    }
  };

  const onDone = () => {
    if (!address) {
      Alert.alert("Create a wallet first");
      return;
    }
    Alert.alert(
      "Backup your seed",
      "Write down the 12 words. Anyone with the seed controls your ACP.",
      [{ text: "I saved it", onPress: () => router.replace("/(tabs)") }]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create wallet</Text>
      <Text style={styles.body}>
        Generated on-device. ANCAP never receives your seed or keystore.
      </Text>

      {words.length > 0 ? (
        <View style={styles.seedBox}>
          {words.map((w, i) => (
            <Text key={`${w}-${i}`} style={styles.word}>
              {i + 1}. {w}
            </Text>
          ))}
        </View>
      ) : null}

      {address ? (
        <Text style={styles.addr} selectable>
          {address}
        </Text>
      ) : null}

      <Pressable style={styles.primary} onPress={onGenerate} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#042f1a" />
        ) : (
          <Text style={styles.primaryText}>
            {words.length ? "Regenerate (dev)" : "Generate wallet"}
          </Text>
        )}
      </Pressable>

      {words.length > 0 ? (
        <Pressable style={styles.secondary} onPress={onDone}>
          <Text style={styles.secondaryText}>Continue to wallet</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  title: { color: "#f5f7ff", fontSize: 24, fontWeight: "700", marginBottom: 12 },
  body: { color: "#94a3b8", fontSize: 16, lineHeight: 24, marginBottom: 20 },
  seedBox: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderColor: "#334155",
    borderWidth: 1,
  },
  word: { color: "#f5f7ff", marginBottom: 6, fontSize: 16 },
  addr: { color: "#6ee7b7", marginBottom: 20, fontSize: 13 },
  primary: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryText: { color: "#042f1a", textAlign: "center", fontWeight: "600" },
  secondary: {
    borderColor: "#334155",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryText: { color: "#f5f7ff", textAlign: "center" },
});
