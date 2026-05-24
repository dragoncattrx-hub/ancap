import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { loadVaultAddress } from "@/lib/vault";

const CLIPBOARD_CLEAR_MS = 30_000; // P5-3: auto-clear address from clipboard after 30s

export default function ReceiveScreen() {
  const { t } = useTranslation();
  const [address, setAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const clipboardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void loadVaultAddress().then((value) => {
      if (value) setAddress(value);
    });
    return () => {
      if (clipboardTimer.current) clearTimeout(clipboardTimer.current);
    };
  }, []);

  const onCopy = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    if (clipboardTimer.current) clearTimeout(clipboardTimer.current);
    clipboardTimer.current = setTimeout(async () => {
      await Clipboard.setStringAsync("");
      setCopied(false);
    }, CLIPBOARD_CLEAR_MS);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("receive.title")}</Text>
      <Text style={styles.warn}>{t("receive.warning")}</Text>

      {address ? (
        <View style={styles.qrWrap}>
          <QRCode value={address} size={220} backgroundColor="#fff" />
        </View>
      ) : null}

      <Text style={styles.address} selectable>
        {address || "…"}
      </Text>

      <Pressable style={styles.btn} onPress={onCopy}>
        <Text style={styles.btnText}>{copied ? t("receive.copied") : t("receive.copyAddress")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: "center", flexGrow: 1 },
  title: { color: "#f5f7ff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  warn: { color: "#fbbf24", textAlign: "center", marginBottom: 24 },
  qrWrap: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 24,
  },
  address: {
    color: "#cbd5e1",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  btn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: { color: "#042f1a", fontWeight: "600" },
});
