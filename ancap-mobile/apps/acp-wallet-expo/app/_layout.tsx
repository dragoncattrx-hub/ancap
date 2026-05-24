import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { setNativeWalletModule } from "@ancap/acp-wallet-sdk";
import { getExpoAcpCoreModule } from "expo-acp-core";
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
        router.replace("/");
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
      const vault = await hasVault();
      if (!vault && inTabs) {
        router.replace("/");
      }
      if (vault && !inTabs && segments[0] !== "onboarding" && segments[0] !== "receive") {
        const onWelcome = !segments[0];
        if (onWelcome) {
          router.replace("/(tabs)");
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
      </Stack>
    </>
  );
}
