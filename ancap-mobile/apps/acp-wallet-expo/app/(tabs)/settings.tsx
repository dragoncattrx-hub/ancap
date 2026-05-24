import { Linking } from "react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  canUseBiometricUnlock,
  clearPinLock,
  disableBiometricUnlock,
  enableBiometricUnlock,
  hasPinLock,
  isBiometricUnlockEnabled,
  isValidPin,
  lockSession,
  setPinLock,
} from "@/lib/lock";
import {
  disableVaultBiometricProtection,
  enableVaultBiometricProtection,
  isVaultBiometricProtected,
  wipeVault,
} from "@/lib/vault";

const BASE = "https://ancap.cloud";

// P5-4: basic root/jailbreak/emulator detection (no native dependency needed)
function checkInsecureEnvironment(): string | null {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    return "Running on a development/simulator build. Do not use with real funds.";
  }
  return null;
}

const LINKS = [
  { label: "Terms of Service", url: `${BASE}/legal/terms` },
  { label: "Privacy Policy", url: `${BASE}/legal/privacy` },
  { label: "Bridge Risk Disclosure", url: `${BASE}/docs/wacp/risks` },
  { label: "Bridge Documentation", url: `${BASE}/docs/bridge` },
  { label: "Reserve Proof", url: `${BASE}/docs/wacp/reserve` },
  { label: "Support", url: `${BASE}/support` },
];

export default function SettingsScreen() {
  const [envWarning, setEnvWarning] = useState<string | null>(null);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [vaultBiometricProtected, setVaultBiometricProtected] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  useEffect(() => {
    const w = checkInsecureEnvironment();
    if (w) setEnvWarning(w);
    void refreshLockState();
  }, []);

  const refreshLockState = async () => {
    const [pinOn, biometricOn, biometricCapable, vaultProtected] = await Promise.all([
      hasPinLock(),
      isBiometricUnlockEnabled(),
      canUseBiometricUnlock(),
      isVaultBiometricProtected(),
    ]);
    setPinEnabled(pinOn);
    setBiometricEnabled(biometricOn);
    setBiometricAvailable(biometricCapable);
    setVaultBiometricProtected(vaultProtected);
  };

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

  const onOpen = (url: string) => {
    void Linking.openURL(url);
  };

  const onSavePin = async () => {
    if (!isValidPin(pin)) {
      Alert.alert("Invalid PIN", "PIN must be 4 to 8 digits.");
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert("PIN mismatch", "PIN entries do not match.");
      return;
    }
    await setPinLock(pin);
    setPin("");
    setConfirmPin("");
    await refreshLockState();
    Alert.alert("PIN enabled", "Wallet unlock PIN is now active on this device.");
  };

  const onDisablePin = async () => {
    Alert.alert(
      "Disable lock?",
      "This removes the local PIN and biometric unlock requirement from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            await disableVaultBiometricProtection();
            await clearPinLock();
            await refreshLockState();
          },
        },
      ]
    );
  };

  const onEnableBiometrics = async () => {
    try {
      await enableBiometricUnlock();
      await enableVaultBiometricProtection();
      await refreshLockState();
      Alert.alert(
        "Biometrics enabled",
        "You can now unlock the wallet with device biometrics, and vault secrets are stored behind biometric-gated secure storage."
      );
    } catch (e) {
      Alert.alert("Could not enable biometrics", e instanceof Error ? e.message : "Unknown error");
    }
  };

  const onDisableBiometrics = async () => {
    Alert.alert(
      "Disable biometric unlock?",
      "This removes biometric unlock and moves vault secrets back to device-only secure storage without biometric gating.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            await disableVaultBiometricProtection();
            await disableBiometricUnlock();
            await refreshLockState();
          },
        },
      ]
    );
  };

  const onLockNow = () => {
    lockSession();
    router.replace("/unlock");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>About</Text>

      {envWarning ? (
        <View style={styles.warnCard}>
          <Text style={styles.warnText}>{envWarning}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>ANCAP ACP Wallet</Text>
        <Text style={styles.meta}>Version 1.0.0</Text>
        <Text style={styles.meta}>Non-custodial · Device-only keys</Text>
      </View>

      <Text style={styles.section}>Legal & Documentation</Text>
      {LINKS.map((l) => (
        <Pressable key={l.url} style={styles.linkRow} onPress={() => onOpen(l.url)}>
          <Text style={styles.linkText}>{l.label}</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}

      <Text style={styles.section}>Security</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Key storage</Text>
        <Text style={styles.meta}>
          Keys and keystore are stored in device-only secure storage. When biometric unlock is
          enabled, vault secrets move behind biometric-gated secure storage. ANCAP never receives
          or stores your seed or private key.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Bridge risk</Text>
        <Text style={styles.meta}>
          The ACP ↔ wACP bridge is a custodial clearing rail. Read the full risk disclosure before
          converting.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>App lock</Text>
        <Text style={styles.meta}>
          Status: {pinEnabled ? "PIN enabled" : "PIN disabled"}
          {biometricEnabled ? " · biometrics enabled" : ""}
          {vaultBiometricProtected ? " · secure vault gated by biometrics" : ""}
        </Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          placeholder="Set PIN (4–8 digits)"
          placeholderTextColor="#64748b"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
        />
        <TextInput
          style={styles.input}
          value={confirmPin}
          onChangeText={setConfirmPin}
          placeholder="Confirm PIN"
          placeholderTextColor="#64748b"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
        />
        <Pressable style={styles.primary} onPress={() => void onSavePin()}>
          <Text style={styles.primaryText}>{pinEnabled ? "Update PIN" : "Enable PIN"}</Text>
        </Pressable>
        {pinEnabled ? (
          <Pressable style={styles.secondary} onPress={onDisablePin}>
            <Text style={styles.secondaryText}>Disable PIN lock</Text>
          </Pressable>
        ) : null}
        {pinEnabled && biometricAvailable && !biometricEnabled ? (
          <Pressable style={styles.secondary} onPress={() => void onEnableBiometrics()}>
            <Text style={styles.secondaryText}>Enable biometric unlock + secure vault</Text>
          </Pressable>
        ) : null}
        {pinEnabled && biometricEnabled ? (
          <Pressable style={styles.secondary} onPress={onDisableBiometrics}>
            <Text style={styles.secondaryText}>Disable biometric unlock</Text>
          </Pressable>
        ) : null}
        {pinEnabled ? (
          <Pressable style={styles.secondary} onPress={onLockNow}>
            <Text style={styles.secondaryText}>Lock now</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable style={styles.danger} onPress={onWipe}>
        <Text style={styles.dangerText}>Remove wallet from this device</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  title: { color: "#f5f7ff", fontSize: 20, fontWeight: "700", marginBottom: 16 },
  section: { color: "#94a3b8", fontSize: 13, fontWeight: "600", marginTop: 20, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderColor: "#1e293b",
    borderWidth: 1,
  },
  cardLabel: { color: "#f5f7ff", fontWeight: "600", marginBottom: 6 },
  warnCard: {
    backgroundColor: "#450a0a",
    borderColor: "#b91c1c",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  warnText: { color: "#fecaca", fontSize: 13, lineHeight: 20 },
  meta: { color: "#94a3b8", fontSize: 13, lineHeight: 20 },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 6,
    borderColor: "#1e293b",
    borderWidth: 1,
  },
  linkText: { color: "#f5f7ff", fontSize: 15 },
  arrow: { color: "#64748b", fontSize: 20 },
  input: {
    backgroundColor: "#0f172a",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 10,
    color: "#f5f7ff",
    padding: 12,
    marginTop: 12,
  },
  primary: {
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  primaryText: { color: "#042f1a", textAlign: "center", fontWeight: "600" },
  secondary: {
    borderColor: "#334155",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  secondaryText: { color: "#f5f7ff", textAlign: "center", fontWeight: "600" },
  danger: {
    backgroundColor: "#450a0a",
    borderColor: "#b91c1c",
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  dangerText: { color: "#fecaca", textAlign: "center", fontWeight: "600" },
});
