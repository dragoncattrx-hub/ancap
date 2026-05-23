import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { setNativeWalletModule } from "@ancap/acp-wallet-sdk";
import { getExpoAcpCoreModule } from "expo-acp-core";
import { hasVault } from "@/lib/vault";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    setNativeWalletModule(getExpoAcpCoreModule());
  }, []);

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
