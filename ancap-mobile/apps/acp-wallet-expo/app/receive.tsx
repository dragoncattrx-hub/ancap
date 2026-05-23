import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { loadVault } from "@/lib/vault";

export default function ReceiveScreen() {
  const [address, setAddress] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void loadVault().then((v) => {
      if (v) setAddress(v.address);
    });
  }, []);

  const onCopy = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Receive ACP</Text>
      <Text style={styles.warn}>Send only native ACP to this address.</Text>

      {address ? (
        <View style={styles.qrWrap}>
          <QRCode value={address} size={220} backgroundColor="#fff" />
        </View>
      ) : null}

      <Text style={styles.address} selectable>
        {address || "…"}
      </Text>

      <Pressable style={styles.btn} onPress={onCopy}>
        <Text style={styles.btnText}>{copied ? "Copied" : "Copy address"}</Text>
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
