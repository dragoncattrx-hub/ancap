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
  const [keystoreJson, setKeystoreJson] = useState("");

  const onGenerate = async () => {
    setBusy(true);
    try {
      const w = await createWallet();
      const wordsList = w.mnemonic.split(/\s+/).filter(Boolean);
      setWords(wordsList);
      setAddress(w.address);
      setKeystoreJson(w.keystoreJson);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed";
      if (msg.includes("not linked") || msg.includes("Native ACP")) {
        Alert.alert(
          "Native build required",
          "Create wallet needs the native ACP core linked.\n\n" +
            "Run: build-android-native.ps1\n" +
            "Then: npx expo run:android\n\n" +
            "For quick testing in Expo Go, use Import instead.",
          [{ text: "Use Import", onPress: () => router.push("/onboarding/import") }]
        );
      } else {
        Alert.alert("Could not create wallet", msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const onBackupConfirm = () => {
    Alert.alert(
      "Confirm your backup",
      "Write down the 12 words in order and store them somewhere safe.\n\n" +
        "Anyone with these words can access your ACP.",
      [
        { text: "I wrote it down", style: "cancel" },
        { text: "Let me check again", style: "destructive" },
      ]
    );
  };

  const onSaveAndContinue = async () => {
    if (!address || !keystoreJson || words.length === 0) {
      Alert.alert("Generate a wallet first");
      return;
    }
    await saveVault({ address, keystoreJson, mnemonic: words.join(" ") });
    Alert.alert(
      "Wallet saved",
      "Your wallet is stored on this device only. Keep your seed safe.",
      [{ text: "Continue", onPress: () => router.replace("/(tabs)") }]
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
            {words.length ? "Regenerate" : "Generate wallet"}
          </Text>
        )}
      </Pressable>

      {words.length > 0 ? (
        <>
          <Pressable style={styles.warning} onPress={onBackupConfirm}>
            <Text style={styles.warningText}>
              Read before continuing — backup your seed
            </Text>
          </Pressable>

          <Pressable style={styles.secondary} onPress={onSaveAndContinue}>
            <Text style={styles.secondaryText}>I've backed up my seed → save wallet</Text>
          </Pressable>
        </>
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
  warning: {
    backgroundColor: "#450a0a",
    borderColor: "#b91c1c",
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  warningText: { color: "#fecaca", textAlign: "center", fontWeight: "600" },
  secondary: {
    borderColor: "#334155",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryText: { color: "#f5f7ff", textAlign: "center" },
});
