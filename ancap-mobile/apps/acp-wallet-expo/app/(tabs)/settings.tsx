import { router } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { wipeVault } from "@/lib/vault";

export default function SettingsScreen() {
  const onWipe = () => {
    Alert.alert(
      "Remove wallet from device?",
      "Your seed is not stored on ANCAP servers. Make sure you have a backup before removing.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await wipeVault();
            router.replace("/");
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Security</Text>
      <Text style={styles.body}>
        Keys and keystore are stored in the device secure store only.
      </Text>

      <Pressable style={styles.danger} onPress={onWipe}>
        <Text style={styles.dangerText}>Remove wallet from this device</Text>
      </Pressable>

      <Text style={styles.link}>
        Docs: ancap.cloud/docs/wacp/risks · Bridge is a custodial clearing rail.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  title: { color: "#f5f7ff", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  body: { color: "#94a3b8", lineHeight: 22, marginBottom: 24 },
  danger: {
    backgroundColor: "#450a0a",
    borderColor: "#b91c1c",
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
  },
  dangerText: { color: "#fecaca", textAlign: "center", fontWeight: "600" },
  link: { color: "#64748b", fontSize: 12, marginTop: 32, lineHeight: 18 },
});
