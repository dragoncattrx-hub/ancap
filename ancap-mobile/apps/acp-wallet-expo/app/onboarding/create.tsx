import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { createWallet } from "@ancap/acp-wallet-sdk";
import { saveVault } from "@/lib/vault";

// P5-2: block screenshots while seed phrase is visible
import {
  allowScreenCaptureAsync,
  preventScreenCaptureAsync,
} from "expo-screen-capture";

export default function CreateWalletScreen() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [keystoreJson, setKeystoreJson] = useState("");

  useEffect(() => {
    void preventScreenCaptureAsync();
    return () => {
      allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  const onGenerate = async () => {
    setBusy(true);
    try {
      const w = await createWallet();
      const wordsList = w.mnemonic.split(/\s+/).filter(Boolean);
      setWords(wordsList);
      setAddress(w.address);
      setKeystoreJson(w.keystoreJson);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("createWallet.couldNotCreate");
      if (msg.includes("not linked") || msg.includes("Native ACP")) {
        const nativeSteps = Platform.select({
          ios: t("createWallet.nativeStepsIos"),
          android: t("createWallet.nativeStepsAndroid"),
          default: t("createWallet.nativeStepsDefault"),
        });
        Alert.alert(
          t("createWallet.nativeBuildRequiredTitle"),
          t("createWallet.nativeBuildRequiredBody", { nativeSteps }),
          [{ text: t("createWallet.useImport"), onPress: () => router.push("/onboarding/import") }]
        );
      } else {
        Alert.alert(t("createWallet.couldNotCreate"), msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const onBackupConfirm = () => {
    Alert.alert(
      t("createWallet.backupTitle"),
      t("createWallet.backupBody"),
      [
        { text: t("createWallet.backupDone"), style: "cancel" },
        { text: t("createWallet.backupReview"), style: "destructive" },
      ]
    );
  };

  const onSaveAndContinue = async () => {
    if (!address || !keystoreJson || words.length === 0) {
      Alert.alert(t("createWallet.generateFirst"));
      return;
    }
    await saveVault({ address, keystoreJson, mnemonic: words.join(" ") });
    Alert.alert(
      t("createWallet.savedTitle"),
      t("createWallet.savedBody"),
      [{ text: t("createWallet.continue"), onPress: () => router.replace("/(tabs)") }]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("createWallet.title")}</Text>
      <Text style={styles.body}>{t("createWallet.body")}</Text>

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
            {words.length ? t("createWallet.regenerate") : t("createWallet.generate")}
          </Text>
        )}
      </Pressable>

      {words.length > 0 ? (
        <>
          <Pressable style={styles.warning} onPress={onBackupConfirm}>
            <Text style={styles.warningText}>{t("createWallet.readBeforeContinuing")}</Text>
          </Pressable>

          <Pressable style={styles.secondary} onPress={onSaveAndContinue}>
            <Text style={styles.secondaryText}>{t("createWallet.saveWallet")}</Text>
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
