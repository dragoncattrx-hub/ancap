import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { setNativeWalletModule } from "@ancap/acp-wallet-sdk";
import { getExpoAcpCoreModule } from "expo-acp-core";
import { hasPinLock, isSessionUnlocked, lockSession } from "@/lib/lock";
import { hasVault } from "@/lib/vault";

const AUTO_LOCK_MINUTES = 5 as const; // P5-6: auto-lock after 5 min inactivity

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const lastActive = useRef(Date.now());

  useEffect(() => {
    setNativeWalletModule(getExpoAcpCoreModule());
  }, []);

  // P5-6: auto-lock — check every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      const vault = await hasVault();
      if (!vault) return;
      const elapsed = (Date.now() - lastActive.current) / 1000 / 60;
      if (elapsed >= AUTO_LOCK_MINUTES) {
        lockSession();
        router.replace("/unlock");
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [router]);

  // Reset inactivity timer on any segment change
  useEffect(() => {
    lastActive.current = Date.now();
  }, [segments]);

  useEffect(() => {
    void (async () => {
      const inTabs = segments[0] === "(tabs)";
      const onUnlock = segments[0] === "unlock";
      const onWelcome = !segments[0];
      const vault = await hasVault();
      const pinEnabled = await hasPinLock();
      const unlocked = isSessionUnlocked();
      if (!vault && (inTabs || onUnlock)) {
        router.replace("/");
        return;
      }
      if (vault && pinEnabled && !unlocked && inTabs) {
        router.replace("/unlock");
        return;
      }
      if (vault && pinEnabled && unlocked && onUnlock) {
        router.replace("/(tabs)");
        return;
      }
      if (vault && !inTabs && !onUnlock && segments[0] !== "onboarding" && segments[0] !== "receive") {
        if (onWelcome) {
          router.replace(pinEnabled && !unlocked ? "/unlock" : "/(tabs)");
        }
      }
    })();
  }, [segments, router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0a0f1a" },
          headerTintColor: "#f5f7ff",
          contentStyle: { backgroundColor: "#0a0f1a" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="receive" options={{ title: "Receive ACP" }} />
        <Stack.Screen name="onboarding/create" options={{ title: "Create wallet" }} />
        <Stack.Screen name="onboarding/import" options={{ title: "Import wallet" }} />
        <Stack.Screen name="unlock" options={{ title: "Unlock wallet", headerBackVisible: false }} />
      </Stack>
    </>
  );
}
