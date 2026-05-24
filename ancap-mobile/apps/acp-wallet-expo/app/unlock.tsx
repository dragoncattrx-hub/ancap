import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  canUseBiometricUnlock,
  hasPinLock,
  isBiometricUnlockEnabled,
  markSessionUnlocked,
  verifyPin,
  unlockWithBiometrics,
} from "@/lib/lock";

export default function UnlockScreen() {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(true);
  const [biometricReady, setBiometricReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [pinEnabled, biometricEnabled, biometricAvailable] = await Promise.all([
        hasPinLock(),
        isBiometricUnlockEnabled(),
        canUseBiometricUnlock(),
      ]);
      if (cancelled) return;
      if (!pinEnabled) {
        markSessionUnlocked();
        router.replace("/(tabs)");
        return;
      }
      setBiometricReady(biometricEnabled && biometricAvailable);
      setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onUnlock = async () => {
    const ok = await verifyPin(pin);
    if (!ok) {
      Alert.alert(t("unlock.wrongPinTitle"), t("unlock.wrongPinBody"));
      return;
    }
    markSessionUnlocked();
    setPin("");
    router.replace("/(tabs)");
  };

  const onBiometricUnlock = async () => {
    const ok = await unlockWithBiometrics();
    if (ok) {
      router.replace("/(tabs)");
      return;
    }
    Alert.alert(t("unlock.biometricFailedTitle"), t("unlock.biometricFailedBody"));
  };

  if (busy) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6ee7b7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("unlock.title")}</Text>
      <Text style={styles.sub}>{t("unlock.subtitle")}</Text>

      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        placeholder={t("unlock.pinPlaceholder")}
        placeholderTextColor="#64748b"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={8}
      />

      <Pressable style={styles.primary} onPress={() => void onUnlock()}>
        <Text style={styles.primaryText}>{t("unlock.unlock")}</Text>
      </Pressable>

      {biometricReady ? (
        <Pressable style={styles.secondary} onPress={() => void onBiometricUnlock()}>
          <Text style={styles.secondaryText}>{t("unlock.useBiometrics")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0f1a",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0a0f1a",
  },
  title: { color: "#f5f7ff", fontSize: 28, fontWeight: "700", marginBottom: 12 },
  sub: { color: "#94a3b8", fontSize: 15, lineHeight: 22, marginBottom: 20 },
  input: {
    backgroundColor: "#111827",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 12,
    color: "#f5f7ff",
    padding: 14,
    fontSize: 18,
    letterSpacing: 4,
    marginBottom: 16,
  },
  primary: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryText: { color: "#042f1a", textAlign: "center", fontWeight: "600", fontSize: 16 },
  secondary: {
    borderColor: "#334155",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryText: { color: "#f5f7ff", textAlign: "center", fontSize: 16 },
});
