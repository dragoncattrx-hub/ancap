import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0a0f1a" },
        headerTintColor: "#f5f7ff",
        tabBarStyle: { backgroundColor: "#111827", borderTopColor: "#1e293b" },
        tabBarActiveTintColor: "#6ee7b7",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.wallet"), headerTitle: t("tabs.walletHeader") }} />
      <Tabs.Screen name="activity" options={{ title: t("tabs.activity") }} />
      <Tabs.Screen name="send" options={{ title: t("tabs.send") }} />
      <Tabs.Screen name="bridge" options={{ title: t("tabs.bridge") }} />
      <Tabs.Screen name="settings" options={{ title: t("tabs.settings") }} />
    </Tabs>
  );
}
