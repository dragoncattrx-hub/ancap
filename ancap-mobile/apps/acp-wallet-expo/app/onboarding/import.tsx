import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { assertAcpAddress, safeErrorMessage, validateAcpAddress } from "@ancap/acp-wallet-sdk";
import { saveVault } from "@/lib/vault";

export default function ImportWalletScreen() {
  const { t } = useTranslation();
  const [address, setAddress] = useState("");
  const [keystoreJson, setKeystoreJson] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [error, setError] = useState("");

  const onSave = async () => {
    setError("");
    try {
      const addr = assertAcpAddress(address.trim(), "address");
      if (!keystoreJson.trim()) {
        throw new Error("Keystore JSON is required for a stable ACP address.");
      }
      JSON.parse(keystoreJson);
      await saveVault({
        address: addr,
        keystoreJson: keystoreJson.trim(),
        mnemonic: mnemonic.trim(),
      });
      router.replace("/(tabs)");
    } catch (e) {
      setError(safeErrorMessage(e, t("importWallet.importFailed")));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("importWallet.title")}</Text>
      <Text style={styles.hint}>{t("importWallet.hint")}</Text>

      <Text style={styles.label}>{t("importWallet.addressLabel")}</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="acp1..."
        placeholderTextColor="#64748b"
        autoCapitalize="none"
      />

      <Text style={styles.label}>{t("importWallet.mnemonicLabel")}</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={mnemonic}
        onChangeText={setMnemonic}
        placeholder="word1 word2 ..."
        placeholderTextColor="#64748b"
        multiline
      />

      <Text style={styles.label}>{t("importWallet.keystoreLabel")}</Text>
      <TextInput
        style={[styles.input, styles.multiline, styles.tall]}
        value={keystoreJson}
        onChangeText={setKeystoreJson}
        placeholder='{"version":3,...}'
        placeholderTextColor="#64748b"
        multiline
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.primary} onPress={onSave}>
        <Text style={styles.primaryText}>{t("importWallet.saveOnDevice")}</Text>
      </Pressable>

      {address && !validateAcpAddress(address) ? (
        <Text style={styles.warn}>{t("importWallet.invalidAddressWarning")}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#0a0f1a", flexGrow: 1 },
  title: { color: "#f5f7ff", fontSize: 24, fontWeight: "700", marginBottom: 8 },
  hint: { color: "#94a3b8", marginBottom: 20, lineHeight: 22 },
  label: { color: "#cbd5e1", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#111827",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 10,
    color: "#f5f7ff",
    padding: 12,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  tall: { minHeight: 120 },
  error: { color: "#f87171", marginTop: 12 },
  warn: { color: "#fbbf24", marginTop: 8 },
  primary: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  primaryText: { color: "#042f1a", textAlign: "center", fontWeight: "600" },
});
